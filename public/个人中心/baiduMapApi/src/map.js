;(function() {

'use strict';

function MapMaker(config) {
    if(!config) config = {};
    this.urlObj = null;           //解析URL所得的信息组成的对象
    this.currentPoint = null;      //用户定位点
    this.targetPoint = null;        //麦当劳定位点
    this.currentCity = null;        //用户所在城市
    this.currentMarker = null;  //定位跟随中用户定位点
    this.myIcon = null;           //用户当前位置icon
    this.targetIcon = null;       //麦当劳店icon
    this.callMapFlag = false;         //记录有没有调起服务
    this.distance = 0;            //起点到终点的距离
    this.targetName = '';         //目标店店名
    this.level = 0;             //距离的等级1、2、3级
    // radius=3000&output=json&scope=2&filter=industry_type:cater|sort_name:distance|sort_rule:1&ak=x78oVekBLBQQ6VIvPoX7eNDj&t=1411012334917
    this.closestUrl1 = "http://api.map.baidu.com/place/v2/search?&query=%E7%94%9C%E7%AD%92%E6%B4%BB%E5%8A%A8&location=";
    this.closestUrl2 = "&radius=3000&output=json&scope=2&filter=industry_type:cater|sort_name:distance|sort_rule:1&ak=x78oVekBLBQQ6VIvPoX7eNDj&t="+Date.now();
    this.routesUrl = "http://api.map.baidu.com/direction/v1?mode=walking&output=json&ak=x78oVekBLBQQ6VIvPoX7eNDj";

    // 这个回调，仅仅是直接进入step2时需要执行，step2的initmap只需要
    this.onInitFinish = config.onInitFinish || null;
    // 当从服务器更新时间后执行的回调
    this.onUpdateTimeCallback = config.onUpdateTimeCallback || null;         //
    // 超过3km时的回调
    this.onDistanceOver3km = config.onDistanceOver3km || null;
    // 甜品站于晚上8点停止营业，您可能无法在8点前赶到！
    this.onIsTooLate = config.onIsTooLate || null;
    this.onSuccess = config.onSuccess || null;
}


//起服务
MapMaker.prototype.callMap = function() {
    // 如果7.5.0以上，起服务
    if(isIn7_5 === true ) {
        if (!this.callMapFlag) {
            // alert(this.routesUrl)
            window.location.href='bdapi://reg_loc';
            // this.onUpdateTimeCallback = onUpdateCallback;
            this.callMapFlag = true;
        }
    } 
    else {
    // 否则，尝试使用nativeAppAdapter的获取位置
        nativeAppAdapter.getBaiduMercator(function(data){
            // 可以获取位置
            if (data.x !== null && data.y !== null) {
                // alert("获取位置");
                window.onLocationChange(data);
            }
            else {
            // 无法获取位置
                alert("无法获取位置");
            }
        });
        
    }
    
}

/*
    定位跟随回调函数
    首先上一次定位跟随的maker点移除
    新建marker点 并添加到地图上
    判断到目的地之间的距离 小于50米显示成功
*/
window.onLocationChange = function(data) {
    /*
        判断commom.currentPoint
    */
    if(!window.APP || !window.APP.mapMaker) return;
    // alert("onLocationChange");

    var maker = window.APP.mapMaker;
    // 如果没有当前坐标信息，缓存当前坐标
    if (!maker.currentPoint) {
        // 转化当前坐标
        maker.currentPoint = getPointByMercatorPoint(data);
        // 执行一些初始化操作
        maker._map();
    }
    else {
        maker.currentPoint = getPointByMercatorPoint(data);
    }

    if(!maker.map) {//地图实例还没有创建 ，将在进入第3页时创建
        // alert("hasn't map");
        return;
    }

    maker.onMoving();
    // if(newPoint.currentMarker){
    //  maker.map.removeOverlay(marker.currentMarker);
    //  window.firstMarker = null;
    // }
}

// 初始化地图
/*
*   config = {
        id : containerId,
        myIcon : {
            url : 'image url',
            size : {
                x : xSize,
                y : ySize
            }
        },
        targetIcon : {
            url : 'image url',
            size : {
                x : xSize,
                y : ySize
            }
        }
}
*
*/
MapMaker.prototype.initMap = function(config){
    var self = this;
    this.map = new BMap.Map(config.id);
    this.myIcon = new BMap.Icon(config.myIcon.url, new BMap.Size(config.myIcon.size.x,config.myIcon.size.y));
    // alert(config.myIcon.url);
    // alert(config.targetIcon.url);
    this.targetIcon = new BMap.Icon(config.targetIcon.url, new BMap.Size(config.targetIcon.size.x,config.targetIcon.size.y));
    this.map.addOverlay(new BMap.Marker(this.targetPoint,{icon:this.targetIcon}));
    // this.firstMarker = new BMap.Marker(common.currentPoint,{icon:common.myIcon});
    this.currentMarker = new BMap.Marker(this.currentPoint,{icon:this.myIcon});
    
    var word1 = "在活动指定时间内，<br>前往麦当劳甜品站，<br>就可1元兑换樱花甜筒！<br>Run起来吧！",
        word2 = "万一中途退出，<br>打开百度地图，<br>点击樱花甜筒按钮，<br>即可再次回到游戏~";

    // 在画好的地图上添加点
    this.map.addOverlay(this.currentMarker);
    // 设置缩放
    // alert(this.currentPoint instanceof BMap.Point);
    this.map.centerAndZoom(this.currentPoint,15);
    this.map.setViewport([this.currentPoint,this.targetPoint]);
    // 初始化两个文字标签
    var label1 = makeLable(word1),
        label2 = makeLable(word2);

    // 设置两个标签
    this.currentMarker.setLabel(label1);
    setTimeout(function(){
        self.map.removeOverlay(label1);
        self.currentMarker.setLabel(label2)
        setTimeout(function(){
            self.map.removeOverlay(label2);
        },3000);
    },3000);

    // 添加缩放控件
    this.map.addControl(new BMap.NavigationControl());
    
    //画路线
    this.getRoutes(this.currentPoint,this.targetPoint)

    self.onMoving();
    if(isIn7_5 === false) {
        self.timer = setInterval(function(){
            self.onMoving();
        },1000);    
    } else {
        self.timer = setInterval(function(){
            self.onMoving();
        },10*1000); 
    }
    
    
    /************用户定位后初始化地图*****************/
    /*
    *@params point BMap.Ponit 用户初始位置
    *
    */
    function makeLable(word){
        var label = new BMap.Label(word,{offset:new BMap.Size(-135,-15)});
        label.setStyle({                                   //给label设置样式，任意的CSS都是可以的
            fontSize:"10px",               //字号
            "line-height":"16px",
            color:"#fff",
            padding:"10px",
            border:"0",
            background:"url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAANsAAACLCAMAAADf0xyFAAAAA3NCSVQICAjb4U/gAAAAwFBMVEX///8zAAD3GDOlDBzeOlGtfoyUChitfozhNk2tfoytfoytfoytfoytfoytfozhNk3wFC/wITv0FDDFDyS8anutfozeOlHbP1XOUGRsBg5jBQzTSl/iNExQAweBCBN0BxD1GzbQESfmEyy/ZHbFXXDbP1XuJT96CBJbBArADyPHWm06AQLbP1WuDR/KVmlKAwabCxq3DiG/ZHa1c4O5bn6/ZHa8anvCYXPKVmnKVmmtfozXRFrTSl/jNEzXRFrwITs2cK7CAAAAQHRSTlMAzP/uzBHdIswzRFVmd4i7/+7/7neZu8yZ3d2qzMzd3e7u/4iIu93d3e6IzN3uu8zd7mZ3d3eIiIiZqqrMzN3dlXZrmAAAAAlwSFlzAAALEgAACxIB0t1+/AAAAB90RVh0U29mdHdhcmUATWFjcm9tZWRpYSBGaXJld29ya3MgOLVo0ngAAAAWdEVYdENyZWF0aW9uIFRpbWUAMDkvMTYvMTSNOCGHAAADa0lEQVR4nO2dW3PaQAxG4yUE8C4YE0pJSIK5BELStLk1l6Zp//+/qrQO2AaeCjMefaPzCg86I3nXexnroFqrNRphaK1zj/333qEweu/9R+esDcNGo1arEgcZXo3MXqKZEcosemG7TTmv5rpR2QHuRtR1K7nMzatdx/yH9ui+Io77UZtjj6+3yLFan389Ht4EIrkZHnP8/VQu78ZZo186F2WHuAsXHVLwmSskLrRdKsj2adnh7cYpFWbc5dGS5ZZu1tEw0hGuRnKUuWg9cXZC6RRdkCkXpDHxicvcOG2jsgPbB6Nc4pZuNGWflB3XPjihSXzN7YkGEqGDf5EbGk6eXFqUn24DmtnKDms/0Cw38IlbPXCXxtyWHdV+uDXmsliUPWMqZUe1HyrG9Ipuh0huh01kN5e+U2K62VDdZKFuMgF3+9oqvJggutUw3QoTHJxbriih3L59aeaLEsxtVZRVNLc/v7LEVZHchsaY3z5x6RNXBXLjhTfJNbP9ZSC3HyOS+97KhhMgt+C8KAflFpyPWY7dWA7LLTjnA6u3z0cOzC24yuTg3PyhRzLxiYNz471zE3s5PDc/h//9ienmj6tmJIfolso9YLoFR3wtA9QtuCM5C+rGiXvAdJvzA4dZk6c8C2COJfxSmWDOAX4xMKXVN56bX6H2Md+57klt0IR049H/sgm5DuDXrXqr6RfeYG68BpgtN0yw3HhhGj8vd/Gg3Hj0T5a7JVhuyPuTi6IaktvneUDuSjaOmz/HaeUP4KDc+PzNgp6/IZ+bZufdkGf5FveeAvL9Etx7Qcj3udRNIOomE3WTibrJRN1kom4yUTeZqJtM1E0m6iYTdZOJuslE3WSibjJRN5mom0zUTSbqJhN1k4m6yUTdZKJuMlE3maibTNRNJuomE3WTibrJBP672MDfoS+6IfcPQO778GzMuOyo9sPYmOfCMHngYpw+K/F6D5kIpCiPN/vj2KkxZl52YLvDn3aarvU1SvtRXZUd2q5cbetHFdpuYkxbuBx/UjPZ6CMWWvfK/d9El+Wc+7+9bvR/W/XtW4gdLU8Wub59ubSl/RbfEv51vKjcHQnjrrLgz3GZ5G1Lv8UaNzfF6JO5VpFZf9NpFJcd4P8SR9Pt/U2XfWmdc5NBr/5xdnZWFwKF+lHvDSYU+ta+tP8Ah+LOZQKrL2gAAAAASUVORK5CYII=) no-repeat center center"
            ,"background-size":"100% 100%"
        });
        return label;
    }
}

MapMaker.prototype.onMoving = function() {
    var self = this;
    if(this.map) {
        this.map.removeOverlay(this.currentMarker); //若覆盖物没有添加到地图上，remove不起作用
        // var newPoint = getPointByMercatorPoint(data); //把墨卡托坐标转化
        this.currentMarker = new BMap.Marker(this.currentPoint,{icon:this.myIcon});
        this.map.addOverlay(this.currentMarker);
        this.map.panTo(this.currentPoint);
        // alert('lng: '+newPoint.lng +  " lat: " + newPoint.lat)
        //判断到目的地的距离 小于50米时提示成功
    }
    var distance = getFlatternDistance(this.targetPoint.lat,this.targetPoint.lng,this.currentPoint.lat,this.currentPoint.lng);
    $('.word2').html(Math.floor(distance)+'m');
    // alert(Math.floor(distance)+'m')
    
    if (distance < 50 || isIn7_5 === false) {
        if(isIn7_5 === false) {
            clearInterval(self.timer)
        }
        typeof this.onSuccess === 'function' && this.onSuccess();
    }
}

// 传入初始、终点对象，往地图上画路线
MapMaker.prototype.getRoutes = function(origin,destination){
    var self = this;
    var o = origin.lat + ',' + origin.lng,
        d = destination.lat + ',' + destination.lng;

    var c = this.routesUrl +  "&origin=" + o + "&destination=" + d + "&region=" + this.currentCity;
    var _url = 'http://map.baidu.com/?qt=proxy&url=' + encodeURIComponent(c);

    $.ajax({
        url:_url,
        type:'get',
        dataType:'jsonp',
        data : {
            _t : Date.now()
        },
        success:function(data){

            var steps = data.result.routes[0]['steps'];
            // alert(steps)
            var stepArray = [new BMap.Point(origin.lng,origin.lat)];
            if( steps && steps.length > 0 ){
                for(var i=0;i<steps.length;i++){
                    stepArray.push(new BMap.Point(steps[i].stepDestinationLocation.lng,steps[i].stepDestinationLocation.lat));
                }
            }
        
            var mp = new BMap.Polyline(stepArray, {strokeColor:"blue", strokeWeight:3, strokeOpacity:0.5});
            self.map.addOverlay(mp);
            // callMap();//调起定位服务
        }
        ,error:function(){
            alert('获取路线失败！')
        }
    })
};

// 初始化操作
MapMaker.prototype._map = function(){
    var self = this;
    this.urlObj = handleUrl();
    nativeAppAdapter.getCity(function(data){
        self.currentCity = data.name;
        // alert(common.currentCity)
    });     
    // 设置目标麦当劳门店地址
    this.setTargetPoint(self.urlObj);
}

    /******************解析URL获取目标麦当劳门店地址****************/
MapMaker.prototype.setTargetPoint = function(urlObj){
    // alert(urlObj);
    var self = this;
    //从地图icon进入页面时，会在URL中传ploc参数，指向目标门店的坐标
    if (urlObj && urlObj.ploc) {
        this.targetPoint = getPointByMercatorPoint(urlObj.ploc);
        this.targetName = urlObj.pn;
        this.distance = getFlatternDistance(this.targetPoint.lat,this.targetPoint.lng,this.currentPoint.lat,this.currentPoint.lng);
        //根据距离，判断下一步逻辑
        judgeDistance(this.distance);
    }
    else {
        // 如果没有带url,调接口查询最近麦当劳
        var u = this.closestUrl1 + this.currentPoint.lat+','+this.currentPoint.lng + this.closestUrl2 + "&t=" + new Date().getTime();
        
        u = 'http://map.baidu.com/?qt=proxy&url='+encodeURIComponent(u);
        searchMJ(u);
    }
    //如果没有从URL解析到目的地址，
    //则由searchMJ函数发起ajax请求，检索附近3公里内的麦当劳店并以距离排序
    //搜索得到结果长度大于0，说明有适合的门店，把结果列表中第一个设为targetPoint
    //结果长度=0，说明没有适合的门店，给出提示
    //这些逻辑在searchMJ函数中实现
    function searchMJ(myURl) {
        
        $.ajax({
            url:myURl,
            type:'get',
            dataType:'jsonp',
            data : {
                _t : Date.now()
            },
            success:function(data){
                if(data && data.results && data.results.length > 0){
                    var t = data.results[0];
                    self.targetPoint = t.location;
                    self.distance = t.detail_info.distance;  //直接取得距离
                    self.targetName = t.name;
                    // alert(t.name)
                    //根据距离，判断下一步逻辑
                    // alert(self.distance);
                    judgeDistance(self.distance);
                    
                }else{//3公里内容搜不到麦当劳店
                    alert('附近没有适合参加活动的麦当劳店。')
                }
            },
            error:function(xhr,status,code){
                alert("error");
                alert(xhr);
                alert(status);
                alert(code);
                alert('网络发生错误，获取路线失败！')
            }
        });
    }
    
    function judgeDistance(distance) {
        // alert('distance : ' + distance);
        self.onMoving();
        typeof self.onInitFinish === 'function' && self.onInitFinish.call(self);
        
        var level = Math.floor(distance/500) + 1;//1-6有效

        // alert(level);
        // return 
        judgeTime(level);

        function judgeTime(lev){
            var t = new Date();
            t.setHours(20);
            t.setMinutes(0);
            t.setSeconds(0);
            
            lev >= 7 && (lev = 7);

            if(t.getTime() - Date.now() < lev*15*60*1000) {
            // if(true) {
                //提示可以无法在规定时间内到达
                // alert(lev)
                typeof self.onIsTooLate === 'function' && self.onIsTooLate.call(self,lev);
            } 
            else if(lev >= 7){
                self.onDistanceOver3km.call(self,7);
            }
            else {
                // alert("jump here else")
                //可以发请求
                self.getLeftTime(lev);
            }
        }

        // setTimeout(function(){
            // alert("called")
            
        // },500)
    }
}

// 根据距离，设置剩余时间
MapMaker.prototype.getLeftTime = function(level){
    // alert("sending request , level is " + level);
    var self = this;
    var timeURL = "http://map.baidu.com/maps/interfaces/mcdonald/lottery/mcdonald/start";
    // 根据距离，设置时间剩余级别
    $.ajax({
        url:timeURL,
        data:{
            cuid:window.cuid,
            type:level,
            _t : Date.now()
        },
        dataType : 'jsonp',
        success:function(data){
            // alert("success")
            // alert('getLeftTime' + data.errno);
            typeof self.onUpdateTimeCallback === 'function' && self.onUpdateTimeCallback(60);return;
            switch(data.errno) {
                case 0 : 
                    // case 6 :
                    if(typeof self.onUpdateTimeCallback === 'function' && data.result && data.result.res) {
                        self.onUpdateTimeCallback(data.result.res);
                    } else {
                        alert('返回值缺少参数');
                    }
                    // typeof self.onUpdateTimeCallback === 'function' && self.onUpdateTimeCallback(60);
                    // alert(data.result.res);
                    break;
                case 6 : 
                    // alert("参数错误");
                    break;
                // case 0 : 
                //  typeof self.onUpdateTimeCallback === 'function' && self.onUpdateTimeCallback(data.result.res);
                //  alert(data.result.res);
                //  break;
                // case 0 : 
                //  typeof self.onUpdateTimeCallback === 'function' && self.onUpdateTimeCallback(data.result.res);
                //  alert(data.result.res);
                //  break;
                // case 0 : 
                //  typeof self.onUpdateTimeCallback === 'function' && self.onUpdateTimeCallback(data.result.res);
                //  alert(data.result.res);
                //  break;
                default : 
                    alert('error num : ' + data.errno);
                    break;

            }
        },
        error:function(){

        }
    });
}

MapMaker.prototype.setUpdateTimeFunction = function(func){
    if(typeof func === 'function') this.onUpdateTimeCallback = func;
}
    
    /************************\
              内部功能函数
    \************************/

    // 解析URL
    function handleUrl(){
        var obj = {};
        try {
            var search = parseURI(decodeURIComponent(window.location)).search.slice(1).split("&");
            if(search.length === 1){
                return null;
            }
            for(var i = 0;i<search.length;i++){
                
                var p = search[i].split("=");
                switch(p[0]){
                    case 'ploc':
                    case 'loc':
                        var pp = p[1].slice(1,-1).split(',');
                        var ppp = {
                            x:pp[0],
                            y:pp[1]
                        };
                        obj[p[0]] = ppp;
                        break;
                    default:
                        obj[p[0]] = p[1];
                }
            }
        }catch(e){
            console.log(e)
        }
        return obj;
        
        function parseURI(url) {
            var m = String(url).replace(/^\s+|\s+$/g, '').match(/^([^:\/?#]+:)?(\/\/(?:[^:@]*(?::[^:@]*)?@)?(([^:\/?#]*)(?::(\d*))?))?([^?#]*)(\?[^#]*)?(#[\s\S]*)?/);
            // authority = '//' + user + ':' + pass '@' + hostname + ':' port
            return (m ? {
                href     : m[0] || '',
                protocol : m[1] || '',
                authority: m[2] || '',
                host     : m[3] || '',
                hostname : m[4] || '',
                port     : m[5] || '',
                pathname : m[6] || '',
                search   : m[7] || '',
                hash     : m[8] || ''
            } : null);
        }

        
    }

    /**********计算两点之间的距离***********************/
    function getFlatternDistance(lat1,lng1,lat2,lng2){
        var EARTH_RADIUS = 6378137.0,    //单位M
            PI = Math.PI,
            f = getRad((lat1 + lat2)/2),
            g = getRad((lat1 - lat2)/2),
            l = getRad((lng1 - lng2)/2);

        var sg = Math.sin(g),
            sl = Math.sin(l),
            sf = Math.sin(f);

        var s,c,w,r,d,h1,h2;
        var a = EARTH_RADIUS;
        var fl = 1/298.257;

        sg = sg*sg;
        sl = sl*sl;
        sf = sf*sf;

        s = sg*(1-sl) + (1-sf)*sl;
        c = (1-sg)*(1-sl) + sf*sl;

        w = Math.atan(Math.sqrt(s/c));
        r = Math.sqrt(s*c)/w;
        d = 2*w*a;
        h1 = (3*r -1)/2/c;
        h2 = (3*r +1)/2/s;
        
        
        function getRad(d){
            return d*PI/180.0;
        }
        return d*(1 + fl*(h1*sf*(1-sg) - h2*(1-sf)*sg));
    }

    //参数为百度墨卡托坐标，返回BMap.Point类型点
    function getPointByMercatorPoint(data){   
        return new BMap.MercatorProjection().pointToLngLat(data);
    }

    // window.onLocationChange = onLocationChange;
    // window._map = {
    //  callMap : callMap,
    //  initMap : initMap
    // }
    window.MapMaker = MapMaker;
})();