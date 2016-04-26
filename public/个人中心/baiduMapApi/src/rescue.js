/**
 *----------------------------------------------
 *              地图api控制类
 *----------------------------------------------
 *
 *   所有涉及地图api的逻辑封装在此
 *
 *   lontitude/lon/lng => 经度,x
 *   latitude/lat      => 纬度,y
 */

define([
    'APP', 'mapApi', 'nativeAppAdapter', 'utils', 'mediator', 'taskController', 'robot'
], function(APP, BMap, nativeAppAdapter, Utils, mediator, taskController, robot) {

    'use strict';

    function MapMaker(options) {

        // 是否已经调起了客户端接口
        this.hasCallMap = false;

        // 地图是否已经展示，如果已经展示，移动中心点只需要panTo
        this.hasShown = false;

        // 是否触发了抢鹿，如果已经触发了，在处理完抢鹿逻辑之前不再发请求
        this.hasTriggerHunt = false;

        // 获取路线的url
        this.routesUrl = "http://api.map.baidu.com/direction/v1?mode=walking&output=json&ak=" + window.__aces_token + '&';

        this.robotEnable = false;

        this.robotFireHunt = false;

        this.init(options);
    }

    // 初始化地图api控件
    MapMaker.prototype.init = function(options) {
        if (!_initOptions.call(this, options)) {
            throw new Error('非法参数或缺少参数!');
        }

        // 各种map组件的实例的容器
        this.data = {};

        // 存放icon的实例，icon的实例每个只需要创建一次
        // 添加多个icon，需要实例化point与marker
        // this.data.icons = {
        //     // 我自己的icon
        //     myIcon: null,
        //     // 鹿的icon
        //     deerIcon: null,
        //     // 竞争者的icon
        //     hunterIcon: null,
        //     selfDeerIcon: null,
        //     arrowIcon: null
        // }


        // 存放各种marker(里面存放icon)的实例，方便removeOverlay
        this.data.overlays = {
            // 我自己icon的marker
            myMarker: null,
            // 储存鹿icon信息对象的数组，每一个对象包含did和marker实例
            // 如: {did: 300, marker: marker}
            deerMarker: [],
            // 竞争者icon的marker数组
            huntersMarker: []
        };

        this.data.label = {
            self: null,
            deer: null,
            selfDeer: null,
            hunter: null
        };

        // 储存当前视野内point实例的容器
        // 考虑到进出数组难以控制，改用对象
        // 其中myPoint始终仅有一个，
        // deerPoint和hunterPoint由于不止一个而用数组
        // 调整视野时调用this.seeThemAll()方法
        this.nowInView = {
            myPoint: null,
            deerPoint: []
                // ,
                // hunterPoint: []
        };

        // 定时任务管理器，设置任务间隔和任务回调的上下文
        this.task = taskController(this.updateTimeGap * 1000, this);

        // 查看更多鹿，点击鹿后的回调，传递上下文给回调，
        // 该回调本体在文件最底部
        this.handleSelectDeer = onSelectDeer.bind(this);

        // 传入地图容器的id，初始化地图
        // 该地图实例的生命周期在一个page2中
        // 跳页后失效，重新加载page2后重新实例化
        // TODO:跳页后如何释放
        this.map = new BMap.Map(this.id);

        this.hunterTalkOnce = false;

        this.talkingShit = {
            self: ['穿好衣服出发找鹿吧', '接近鹿周围'+this.huntRange+'米</br>就可以抓到它啦!', '可以沿推荐路线前往,</br>也可自行选择路线.', '天气真冷啦，</br>跑起来吧！'],
            deer: ['快来找我啊!','在我附近'+this.huntRange+'米</br>就能抓到我!'],
            selfDeer: ['快跑吧！</br>别被抓到啦！', '是不是跑错方向拉!', '他们越来越近啦！'],
            hunter: ['别跑！把鹿留下！', '我们就快抓到你啦！']
        };

        this.timers = {
            self: null,
            deer: null,
            selfDeer: null,
            hunter: null
        };


        

        if (window.__initData.isIP6P) {
            // this.talkingShit.deer.push('快沿着路线找我吧！');
            this.talkingShit.self[2] = '走任意路线,</br>抓住驯鹿!';
        }

        // 新建icon的实例,该实例只用创建一次，将来重绘只需要重新构建marker实例
        // 只有三种类型的icon，我，鹿，竞争者
        // this.data.icons.myIcon = this.makeIcon(this.myIcon);
        // this.data.icons.deerIcon = this.makeIcon(this.deerIcon);
        // this.data.icons.hunterIcon = this.makeIcon(this.hunterIcon);

        if (isNaN(parseInt(APP.data.self.lon)) || isNaN(parseInt(APP.data.self.lat))) {
            this.updatePositionByMercator(APP.data.self.x, APP.data.self.y);
        }

        this.callmap();
    }


    function _initOptions(options) {
        var defaultOptions = {
            // 地图容器的id
            id: null,
            // （必须）我的icon图标的初始化参数
            myIcon: {
                // 我的icon的地址
                url: null,
                size: {
                    // 宽度
                    x: null,
                    // 高度
                    y: null
                }
            },
            // （必须）鹿icon的参数
            deerIcon: {
                url: null,
                size: {
                    x: null,
                    y: null
                }
            },
            // （必须）竞争者icon的参数
            hunterIcon: {
                url: null,
                size: {
                    x: null,
                    y: null
                }
            },
            selfDeerIcon: {
                url: null,
                size: {
                    x: null,
                    y: null
                }
            },
            // 低于此距离将会发起抢鹿
            huntRange: 50,
            // 定时任务执行的间隔，单位为秒，默认5秒
            updateTimeGap: 5
        };

        for (var i in defaultOptions) {
            if (defaultOptions.hasOwnProperty(i)) {
                if (i in options) {
                    this[i] = options[i];
                } else {
                    this[i] = defaultOptions[i];
                }
            }
        }

        // 过滤必须的选项
        if (!this.id || !this.myIcon.url || !this.deerIcon.url) return false;

        return true;
    }

    // 调起定位跟随协议
    MapMaker.prototype.callmap = function() {
        if (window.__initData.version) {
            // 此接口只调起一次！
            if (!APP.hasCallMap) {
                APP.hasCallMap = true;
                window.location.href = 'bdapi://reg_loc';
            }
        }
        return this;
    };

    /**
     *   开始追鹿
     */
    MapMaker.prototype.startAsHunter = function() {

        var map = this.map;
        // 先清除可能遗留的数据
        this.clear();


        var firstDistance = Utils.getFlatternDistance({
            lon: APP.data.self.lon,
            lat: APP.data.self.lat
        }, {
            lon: APP.data.deer.lon,
            lat: APP.data.deer.lat
        });

        if (!isNaN(parseInt(firstDistance))) {
            mediator.trigger('distanceChange', this, firstDistance);
        }
        //  else {
        //     throw new Error("距离错误！");
        // }



        var self = this,
            myMarker = {
                lon: APP.data.self.lon,
                lat: APP.data.self.lat,
                icon: this.makeIcon(this.myIcon)
            },
            deerMarker = {
                lon: APP.data.deer.lon,
                lat: APP.data.deer.lat,
                icon: this.makeIcon(this.deerIcon)
            };


        // 添加这两个点
        myMarker = this.handleOverlay(myMarker, 'add');
        deerMarker = this.handleOverlay(deerMarker, 'add');


        //     // </br>沿着路线（根据箭头指示）找到驯鹿，就能赢得奖品啦！！</br>如果想换只鹿,点击“附近的鹿”</br>天气真冷啦，跑起来吧！
        //     deerLabel = makeDearLabel('快来找我啊!');        
        // deerMarker.marker.setLabel(deerLabel);

        myMarker.marker.setZIndex(2);

        // -- 移除身份标签，换成轮播
        // setTimeout(function() {
        //     if (self.map && self.map.removeOverlay) {
        //         self.map.removeOverlay(myLabel);
        //         self.map.removeOverlay(deerLabel);
        //     }
        // 移除说话后，添加`我`的标签，因为一个marker只能打一个label
        // if (myMarker && myMarker.marker && myMarker.marker.setLabel) {
        //     myMarker.marker.setLabel(makeMyLabel());
        // }
        // if (deerMarker && deerMarker.marker && deerMarker.marker.setLabel) {
        //     deerMarker.marker.setLabel(makeMyLabel('驯鹿', {}, -2));
        // }
        // 驯鹿
        // }, 10 * 1000);

        // 初始化地图
        if (!this.hasShown) {
            this.hasShown = true;
            this.map.centerAndZoom(myMarker.point, 15);
            // 添加缩放控件
            this.map.addControl(new BMap.NavigationControl());
        }

        this.nowInView.myPoint = myMarker.point;
        this.nowInView.deerPoint.push(deerMarker.point);

        this.data.overlays.myMarker = myMarker.marker;
        this.data.overlays.deerMarker.push({
            did: APP.data.deer.did,
            marker: deerMarker.marker
        });




        if (!window.__initData.isIP6P) {
            this.startGetRoute();
        }


        this.seeThemAll(true);

        this.getNearBy();

        this.selfTalkingIndex = 0;
        makeSelfTalking();
        this.timers.self = setInterval(makeSelfTalking, 10 * 1000);

        function makeSelfTalking() {
            // debugger
            if (!self.data.overlays.myMarker) return;

            var oldLabel = self.data.overlays.myMarker.getLabel(),
                newLabel;

            if (oldLabel) {
                self.map.removeOverlay(oldLabel);
            }

            switch (self.selfTalkingIndex) {
                case 0:
                    newLabel = makeSelfLabel(self.talkingShit.self[self.selfTalkingIndex], {}, -55);
                    break;
                case 1:
                    newLabel = makeSelfLabel(self.talkingShit.self[self.selfTalkingIndex], {
                        padding: '5px 10px 13px'
                    }, -47, -54);
                    break;
                case 2:
                    if(window.__initData.isIP6P) {
                        newLabel = makeSelfLabel(self.talkingShit.self[self.selfTalkingIndex], {
                            padding: '5px 10px 13px'
                        }, -31, -53);    
                    }
                    else {
                        newLabel = makeSelfLabel(self.talkingShit.self[self.selfTalkingIndex], {
                            padding: '5px 10px 13px'
                        }, -61, -53);       
                    }
                    
                    break;
                case 3:
                    newLabel = makeSelfLabel(self.talkingShit.self[self.selfTalkingIndex], {
                        padding: '5px 10px 13px'
                    }, -37, -53);
                    break;
            }

            self.data.overlays.myMarker.setLabel(newLabel);

            self.selfTalkingIndex++;
            if (!self.talkingShit.self[self.selfTalkingIndex]) self.selfTalkingIndex = 0;
        }

        this.deerTalkingIndex = 0;
        makeDeerTalking();
        this.timers.deer = setInterval(makeDeerTalking, 15 * 1000);

        function makeDeerTalking() {


            if (!self.data.overlays.deerMarker[0].marker) return;

            var oldLabel, newLabel;

            if (oldLabel = self.data.overlays.deerMarker[0].marker.getLabel()) {
                self.map.removeOverlay(oldLabel);
            }

            switch (self.deerTalkingIndex) {
                case 0:
                    newLabel = makeDearLabel(self.talkingShit.deer[self.deerTalkingIndex], {}, -35);
                    break;
                case 1:
                    newLabel = makeDearLabel(self.talkingShit.deer[self.deerTalkingIndex], {
                        padding: '5px 5px 13px'
                    }, -36, -50);
                    break;
            }

            self.data.overlays.deerMarker[0].marker.setLabel(newLabel);

            self.deerTalkingIndex++;
            if (!self.talkingShit.deer[self.deerTalkingIndex]) self.deerTalkingIndex = 0;
        }

        return this;
    };

    // 我是鹿，开始逃跑
    MapMaker.prototype.startAsDeer = function() {

        // 先清除可能遗留的数据
        this.clear();
        // if (!this.data.icons.selfDeerIcon) {
        //     this.data.icons.selfDeerIcon = this.makeIcon(this.selfDeerIcon);
        // }

        var self = this,
            myMarker = {
                lon: APP.data.self.lon,
                lat: APP.data.self.lat,
                icon: this.makeIcon(this.selfDeerIcon)
            };



        myMarker = this.handleOverlay(myMarker, 'add');

        // 初始化地图
        if (!this.hasShown) {
            this.hasShown = true;
            this.map.centerAndZoom(myMarker.point, 15);
            this.map.addControl(new BMap.NavigationControl());
        }

        this.nowInView['myPoint'] = myMarker.point;

        this.data.overlays.myMarker = myMarker.marker;

        myMarker.marker.setZIndex(2);

        this.seeThemAll(true);

        // 添加缩放控件


        this.getNearBy();

        this.selfDeerTalkingIndex = 0;
        makeSelfdeerTalking();
        this.timers.selfDeer = setInterval(makeSelfdeerTalking, 15 * 1000);

        function makeSelfdeerTalking() {
            // debugger
            if (!self.data.overlays.myMarker) return;

            var oldLabel, newLabel;

            if (oldLabel = self.data.overlays.myMarker.getLabel()) {
                self.map.removeOverlay(oldLabel);
            }

            switch (self.selfDeerTalkingIndex) {
                case 0:
                    newLabel = makeDearLabel(self.talkingShit.selfDeer[self.selfDeerTalkingIndex], {
                        padding : '5px 5px 11px'
                    }, -5, -50);
                    break;
                case 1:
                    newLabel = makeDearLabel(self.talkingShit.selfDeer[self.selfDeerTalkingIndex], {
                        padding: '5px 5px 13px'
                    }, -22, -38);
                    break;
                case 2:
                    newLabel = makeDearLabel(self.talkingShit.selfDeer[self.selfDeerTalkingIndex], {
                        padding: '5px 5px 13px'
                    }, -18, -38);
                    break;
            }

            self.data.overlays.myMarker.setLabel(newLabel);

            self.selfDeerTalkingIndex++;
            if (!self.talkingShit.selfDeer[self.selfDeerTalkingIndex]) self.selfDeerTalkingIndex = 0;
        }

        return this;
    }

    /************************************************\
                        基础功能封装
    \************************************************/

    // 将nowInView中的所有点调整视野范围中
    MapMaker.prototype.seeThemAll = function(show) {
        // return;
        if (!this.map) return;

        if (show) {

            var cacheArr,
                allPointArr = [],
                self = this;

            if(this.nowInView.myPoint) {
                allPointArr.push(this.nowInView.myPoint);
            }

            this.nowInView.deerPoint.forEach(function(deer, index) {
                allPointArr.push(deer);
            });

            // this.nowInView.hunterPoint.forEach(function(hunter, index) {
            //     allPointArr.push(hunter);
            // });

            // 调整视区，可见所有传入的点
            this.map.setViewport(allPointArr);
        }
        //  else {
        //     // this.map.panTo(this.nowInView.myPoint);
        // }
    };

    /**
     *----------------------------------------------
     *               生成Marker实例
     *----------------------------------------------
     *
     *  @param: point(Point): Point实例
     *  @param: icon(Icon) : Icon实例
     *  @param: ratation(Number) : 生成marker展示的角度，顺时针递增,默认为0
     *
     *  @return: (Marker): Marker实例
     *
     */
    MapMaker.prototype.makeMarker = function(point, icon, rotation) {
        rotation = rotation || 0;
        return new BMap.Marker(point, {
            icon: icon,
            rotation: rotation
        });
    };

    /**
     *----------------------------------------------
     *               生成Icon实例
     *----------------------------------------------
     *  @param: icon(Object): icon的参数
     *          icon : {
     *              url : icon的url,
     *              size : {
     *                  x : 宽度，单位像素,
     *                  y : 高度,单位像素
     *              }
     *          };
     *  @return: (Icon): Icon实例
     */
    MapMaker.prototype.makeIcon = function(icon) {
        return new BMap.Icon(icon.url, new BMap.Size(icon.size.x, icon.size.y));
    };

    /**
     *----------------------------------------------
     *               生成Point实例
     *----------------------------------------------
     *   @param : 参数为经纬度或百度墨卡托坐标
     *       x,y : 经纬度/墨卡托坐标
     *       isMercator(Boolean) : 是否是墨卡托
     *   @retrun :
     *       (Point)返回BMap.Point类型点
     */
    MapMaker.prototype.makePoint = function(lon, lat, isMercator) {
        var point;
        // 如果为false/undefined,是经纬度
        if (!isMercator) {
            point = new BMap.Point(lon, lat);
        } else {
            point = new BMap.MercatorProjection().pointToLngLat({
                x: lon,
                y: lat
            });
        }

        if (point.lng === 0 && point.lat === 0) {
            // throw new Error("错误的坐标或墨卡托值!");
            return null;
        }

        return point;
    };

    /**
     *----------------------------------
     *          处理overlay
     *----------------------------------
     *
     *  @param marker(Object) : {
     *              lon(Number): lon,
     *              lat(Number): lat,
     *              icon(Icon) : Icon实例,
     *              marker(Marker) : Marker的实例，如果需要更新/重置/清楚，需带此参数
     *         }
     *
     *  @param action(String) : ['add','update','reset','deer']
     *
     */
    MapMaker.prototype.handleOverlay = function(marker, action) {

        var _point, _marker,
            self = this;

        switch (action) {

            // add 需要lon,lat
            case 'add':
                _point = this.makePoint(marker.lon, marker.lat);
                _marker = this.makeMarker(_point, marker.icon);
                this.map.addOverlay(_marker);
                break;

                // 传入marker,lon,lat,更新位置
            case 'update':
                if (marker.marker) {
                    if (Utils.isFunction(marker.marker.setPosition)) {
                        _point = this.makePoint(marker.lon, marker.lat);
                        _marker = marker.marker;
                        marker.marker.setPosition(_point);
                    }
                } else {
                    // throw new Error("handlerOverlay:update:没有传入marker!");
                }
                break;
            case 'reset':
                break;

                // 仅需要传入marker
            case 'remove':
                if (marker.marker) {
                    this.map.removeOverlay(marker);
                } else {
                    // throw new Error("handlerOverlay:remove:没有传入marker!");
                }
                break;

                // 传入一个marker组成的数组，全部清除
            case 'clear':
                marker.forEach(function(m, i) {
                    self.map.removeOverlay(m);
                });
                break;
        }

        // 如果是add，返回生成该marker的point和marker实例
        return {
            point: _point,
            marker: _marker
        };
    };

    // 查看更多的鹿
    MapMaker.prototype.getDeer = function() {

        var self = this;

        this.task.stop();

        this.clear();

        var number = window.__initData.isIP6P ? 5 : 10;

        // 如果当前不是鹿，直接调getDeer
        if (APP.data.catch_status === 0) {
            Utils.sendRequest(Utils.getUrl('getDeer'), Utils.param({
                    num: number
                }), 'get', 'jsonp')
                .then(function(data) {
                    if (data && data.errno === 0) {
                        sendlog('展示附近鹿的数量' + data.data.length);
                        self.showDeer(data.data);
                    } else {
                        // alert('获取附近的鹿失败！错误码:' + data.errno);
                        Utils.handleError(data.errno);
                        // console.log(data.errno, data.data);
                    }
                }, function(xhr) {
                    if(sendlog) sendlog('timeout');
                    alert('亲，请求超时了!可能您当前的网络不佳，请查看您的网络状况或稍后再试!');
                });
        }
        // 如果当前是鹿，先调abandon，成功再调getDeer
        else {
            Utils.sendRequest(Utils.getUrl('abandon'), Utils.param(), 'get', 'jsonp')
                .then(function(data) {

                    if (data && data.errno === 0) {

                        APP.updateData({
                            catch_status: 0
                        });

                        return true;
                    } else {
                        Utils.handleError(data.errno);
                        self.cancelGetDeer();
                        return false;
                    }
                }, function(xhr) {
                    if(sendlog) sendlog('timeout');
                    alert('亲，请求超时了!可能您当前的网络不佳，请查看您的网络状况或稍后再试!');
                })
                .then(function(goon) {
                    if (goon) {
                        Utils.sendRequest(Utils.getUrl('getDeer'), Utils.param({
                                num: number
                            }), 'get', 'jsonp')
                            .then(function(data) {


                                if (data && data.errno === 0) {
                                    sendlog('展示附近鹿的数量' + data.data.length);
                                    self.showDeer(data.data);
                                } else {
                                    // alert('获取附近的鹿失败！错误码:' + data.errno);
                                    Utils.handleError(data.errno);
                                    self.cancelGetDeer();
                                    // console.log(data.errno, data.data);
                                }
                            }, function(err) {
                                sendlog && sendlog("timeout");
                                alert("亲，请求超时了!可能您当前的网络不佳，请查看您的网络状况或稍后再试!");
                            });
                    }
                });
        }
    }

    // 取消查看更多的鹿， 删除所有屏幕上的鹿，解绑所有事件，重新开始
    MapMaker.prototype.cancelGetDeer = function() {
        // debugger
        var data = this.data.overlays.deerMarker;

        for (var i = 0, l = data.length; i < l; i++) {
            data[i].marker.removeEventListener("click", this.handleSelectDeer);
        }

        this.clear();

        if (APP.data.catch_status == 0) {
            this.startAsHunter();
        } else if (APP.data.catch_status == 1) {
            this.startAsDeer();
        }
    }

    MapMaker.prototype.restartAsAnotherDeer = function() {

        var self = this;

        this.clear();

        Utils.sendRequest(Utils.getUrl('getDeer'), Utils.param({
                num: 5
            }), 'get', 'jsonp')
            .then(function(data) {
                if (data && data.errno == 0) {
                    sendlog('展示附近鹿的数量' + data.data.length);
                    if (data.data.length > 0) {

                        var distanceArr = [];

                        data.data.forEach(function(deer, index) {
                            distanceArr.push({
                                did: deer.did,
                                distance: Utils.getFlatternDistance({
                                    lon: APP.data.self.lon,
                                    lat: APP.data.self.lat
                                }, {
                                    lon: deer.lon,
                                    lat: deer.lat
                                }),
                                lon: deer.lon,
                                lat: deer.lat
                            });
                        });

                        // console.log(distanceArr);
                        distanceArr.sort(function(x, y) {
                            return x.distance - y.distance
                        });

                        var randLock = distanceArr[Utils.rand(1, 3)];



                        // console.log(randLock);

                        Utils.sendRequest(Utils.getUrl('lock'), Utils.param({
                            did: randLock.did
                        }), 'get', 'jsonp').then(function(data) {
                            if (data && data.errno == 0) {

                                APP.updateData({
                                    deer: {
                                        did: randLock.did,
                                        lon: randLock.lon,
                                        lat: randLock.lat,
                                    },
                                    catch_status: 0
                                });

                                self.startAsHunter();
                            } else {
                                Utils.handleError(data.errno);
                                // console.log(data.errno, data.data);
                            }

                        }, function(error) {
                            sendlog && sendlog("timeout");
                            alert("亲，请求超时了!可能您当前的网络不佳，请查看您的网络状况或稍后再试!");
                        });
                        // console.log(distanceArr);
                    } else {
                        // console.log("no deer nearby")
                        self.startAsHunter();
                    }
                } else {
                    // alert('获取附近的鹿失败！错误码:' + data.errno);
                    Utils.handleError(data.errno);
                    // console.log(data.errno, data.data);
                }
            }, function(xhr) {
                sendlog && sendlog("timeout");
                alert("亲，请求超时了!可能您当前的网络不佳，请查看您的网络状况或稍后再试!");
            });
    }


    // 调getNearBy接口，分为我是鹿和不是鹿两种情况
    MapMaker.prototype.getNearBy = function() {
        var self = this;
        start();
        // window.task = this.task;
        // 设置定时任务，定时执行回调
        this.task.set(start);

        // 启动任务
        this.task.start();

        function start() {
            // console.log("running");
            Utils.sendRequest(Utils.getUrl('getNearBy'), Utils.param({
                    did: APP.data.deer.did
                }), 'get', 'jsonp')
                .then(function(data) {
                    if (data && data.errno == 0) {

                        // 收到的数据有nearbys数组，以及lockdeer的新位置，还有catch_status
                        data = data.data;

                        // 如果我当前状态是鹿
                        if (APP.data.catch_status == 1) {
                            // 服务器返回状态也是1，说明鹿未被抢
                            if (data.catch_status == 1) {


                                // if (data.nearbys && data.nearbys.length == 0 && !self.robotEnable) {
                                // 无论多少竞争者都增加机器人
                                if (!self.robotEnable) {
                                    self.robotEnable = true;
                                    robot.setUserLoc();
                                }

                                // 更换为同时展示两个数组
                                // var nearB = self.robotEnable ? APP.data.robots : data.nearbys;

                                var nearB = APP.data.robots.concat(data.nearbys);

                                // 我的位置即是鹿的位置，只展示竞争者
                                // 重构功能，加点的时候，计算每一个点距离我的距离，返回距离最近的距离
                                var distanceObj = self.updateNearby(nearB, true);
                                // todo: 展示最近的竞争者距离
                                var nearestRobot = self.getNearestNearbyDistance(APP.data.robots);


                                // 当机器人模式启动，且机器人距离小于30米，且尚未发过机器人请求
                                if (self.robotEnable && typeof nearestRobot.distance === 'number' && nearestRobot.distance < 30 && !self.robotFireHunt) {

                                    Utils.sendRequest(Utils.getUrl('hunt'), Utils.param({
                                            lon: distanceObj.lon,
                                            lat: distanceObj.lat,
                                            cuid: Utils.encrypt('88888888'),
                                            did: APP.data.deer.did
                                        }), 'get', 'jsonp')
                                        .then(function(data) {
                                            if (data && data.errno == 0) {
                                                // console.log(data);
                                                // 需要确保机器人只会发一次请求
                                                self.robotFireHunt = true;
                                            } else {
                                                // console.log(data.errno, data);
                                            }
                                        }, function(err) {
                                            // console.log(err)
                                        });

                                    robot.terminate();
                                }

                                mediator.trigger("distanceChange", this, distanceObj.distance);
                            }
                            // 说明鹿已被抢，提示，并重新开始抢
                            else if (data.catch_status == 0) {
                                // todo
                                // alert("被抢了");
                                APP.updateData({
                                    catch_status: 0
                                });

                                mediator.trigger("beHunted", this);
                                APP.mapMaker.task.stop();
                                // APP.data.catch_status = 0;
                                // self.startAsHunter();
                            }
                        }
                        // 当前不是鹿
                        else if (APP.data.catch_status == 0) {
                            if (data.catch_status == 1) {
                                // throw new Error("鹿状态未同步！");
                            } else {

                                // 更新鹿的信息
                                APP.updateData({
                                    deer: {
                                        did: data.lockdeer.did,
                                        lon: data.lockdeer.lon,
                                        lat: data.lockdeer.lat
                                    }
                                });

                                self.handleOverlay({
                                    lon: data.lockdeer.lon,
                                    lat: data.lockdeer.lat,
                                    marker: self.data.overlays.deerMarker[0].marker
                                }, 'update');

                                // if(window.__initData.isIP6P) {
                                //     var angle =this.getAngle(this.nowInView['myPoint'],this.nowInView['deerPoint'][0]);

                                //     this.data.overlays.myMarker.setRotation(angle);
                                // }

                                // self.updateNearby(data.nearbys, false);
                                self.updateNearby([], false);

                                // 判断距离，如果满足，触发hunt事件
                                if (!APP.mapMaker.hasTriggerHunt && APP.mapMaker.isNearEnough()) {
                                    // trigger hunt now!
                                    APP.mapMaker.hasTriggerHunt = true;

                                    // 停止定时任务
                                    // APP.mapMaker.task.stop();
                                    APP.mapMaker.clear();

                                    mediator.trigger('hunt', APP.mapMaker);
                                }
                            }
                        }
                    } else {
                        // lock的deer已被清
                        // if(data.errno == 50407) {
                        //     alert("您的鹿跑丢拉！再重新选一只吧！");
                        //     self.getDeer();
                        // }
                        // else {
                        Utils.handleError(data.errno);
                        // }
                    }
                }, function(xhr) {
                    // console.log(xhr);
                    sendlog && sendlog("timeout");
                    alert("亲，请求超时了!可能您当前的网络不佳，请查看您的网络状况或稍后再试!");
                    self.task.restart();
                });
        }
    }

    /** 
     *----------------------------------------------
     *          调getDeer接口后更新地图
     *----------------------------------------------
     *   @param :
     *       传入deer数组,内包含did,lon,lat
     */
    MapMaker.prototype.showDeer = function(deerArr) {

        var overlay,
            self = this,
            myMarker = {
                lon: APP.data.self.lon,
                lat: APP.data.self.lat,
                icon: this.makeIcon(this.myIcon)
            };

        overlay = this.handleOverlay(myMarker, 'add');

        this.nowInView.myPoint = overlay.point;

        var myLabel = makeSelfLabel('点击你想追赶的驯鹿，</br>马上开始游戏！', {
            padding: '5px 10px 12px'
        }, -66, -53);

        this.data.overlays.myMarker = overlay.marker;

        this.data.overlays.myMarker.setLabel(myLabel);

        this.data.overlays.myMarker.setZIndex(2);

        var _deerIcon = this.makeIcon(this.deerIcon);

        deerArr.forEach(function(deer, i) {

            deer.icon = _deerIcon;

            // 返回point,marker
            overlay = self.handleOverlay(deer, 'add');
            overlay.marker.setZIndex(10);
            // 给每个鹿的marker绑定事件
            overlay.marker.addEventListener('click', self.handleSelectDeer);

            self.nowInView.deerPoint.push(overlay.point);
            self.data.overlays.deerMarker.push({
                did: deer.did,
                marker: overlay.marker
            });
        });


        this.seeThemAll(true);
    }

    /** 
     *----------------------------------------------
     *          getNearBy接口后调封装接口更新地图
     *----------------------------------------------
     *   @param (Array) nearbys - 传入nearbys数组
     *   @param (Boolean) 是否计算距离,设置未true时说明我是鹿，需要计算距离
     *
     *   //先清除所有marker，再重新添加
     *
     *   优化性能，仅当nearbyNumber与之前nearby数不同时，才进行remove/add操作
     *   否则，仅update
     */
    MapMaker.prototype.updateNearby = function(nearbys, count) {
        // return;
        if (!(Utils.typeOf(nearbys, 'array') && nearbys.length > 0)) return false;

        // debugger
        var hunterMarker,
            self = this,
            newNumber = nearbys.length,
            markersContainer = this.data.overlays.huntersMarker,
            oldNumber = markersContainer.length,
            // 末尾释放局部变量

            // 添加功能，计算每个点距离我的距离，返回最近的距离
            distanceArr = [];

        // self.data.overlays.huntersMarker

        // 需要添加
        if (newNumber > oldNumber) {
            // console.log('1')
            // 按照老数目，
            for (var i = 0; i < oldNumber; i++) {
                dealWithMarker(nearbys[i].lon, nearbys[i].lat, 'update', markersContainer[i]);
            }
            for (var i = oldNumber; i < newNumber; i++) {
                dealWithMarker(nearbys[i].lon, nearbys[i].lat, 'add');
            }
        }
        // 需要减少
        else if (newNumber < oldNumber) {
            // console.log('2')
            var removeArr = markersContainer.splice(0, oldNumber - newNumber);

            // 删除多余的
            removeArr.forEach(function(marker) {
                // console.log("remove");
                self.handleOverlay({
                    marker: marker
                }, 'remove');
            });

            // 更新剩下的数目
            for (var i = 0; i < newNumber; i++) {
                dealWithMarker(nearbys[i].lon, nearbys[i].lat, 'update', markersContainer[i]);
            }
        }
        // 数目不变
        else if (newNumber == oldNumber) {
            // console.log('3')
            nearbys.forEach(function(nearby, index) {
                dealWithMarker(nearby.lon, nearby.lat, 'update', markersContainer[index]);
            });
        }

        // var oldArr = nearbys.splice(0,oldNumber);




        // this.clearHunters();



        // nearbys.forEach(function(hunter, index) {

        //     hunterMarker = self.handleOverlay({
        //         lon: hunter.lon,
        //         lat: hunter.lat,
        //         icon: self.data.icons.hunterIcon
        //     }, 'add');

        //     self.data.overlays.huntersMarker.push(hunterMarker.marker);
        //     self.nowInView.hunterPoint.push(hunterMarker.point);

        //     if (count) {
        //         var distance = Utils.getFlatternDistance({
        //             lon: APP.data.self.lon,
        //             lat: APP.data.self.lat
        //         }, {
        //             lon: hunter.lon,
        //             lat: hunter.lat
        //         });
        //         distanceArr.push({
        //             distance: distance,
        //             lon: hunter.lon,
        //             lat: hunter.lat
        //         });
        //         hunterMarker.marker.setLabel(makeHunterDistanceLabel('距离你' + distance + '米', true));

        //         if (!self.hunterTalkOnce) {
        //             var label = makeHunterTalkLabel('别跑!把鹿留下!');
        //             hunterMarker.marker.setLabel(label);

        //             setTimeout((function(l) {
        //                 return function() {
        //                     if (self.map && self.map.removeOverlay) {
        //                         self.map.removeOverlay(l);
        //                     }
        //                 }
        //             })(label), 5000);
        //         }
        //     } else {
        //         hunterMarker.marker.setLabel(makeHunterDistanceLabel(''));
        //     }
        // });

        this.seeThemAll();

        // 当我是鹿
        if (count) {

            // 仅说一次话
            // if (!self.hunterTalkOnce) {

            // self.hunterTalkOnce = true;

            // var myLabel = makeSelfLabel(APP.mapMaker.talkingShit.hunter[Utils.rand(0,1)]);

            // self.data.overlays.myMarker && self.data.overlays.myMarker.setLabel(myLabel);

            // setTimeout(function() {
            //     if (self.map && self.map.removeOverlay) {
            //         self.map.removeOverlay(myLabel);
            //     }
            //     if (self.data.overlays.myMarker && self.data.overlays.myMarker.setLabel)
            //         self.data.overlays.myMarker.setLabel(makeMyLabel());
            // }, 5000);
            // }

            // 排序，找到最近的距离
            distanceArr.sort(function(x, y) {
                return x.distance - y.distance;
            });

            markersContainer = null;
            // 返回距离
            return distanceArr[0];
        }
        markersContainer = null;

        // @param (String) type : 'add/update'
        function dealWithMarker(lon, lat, type, marker) {

            // console.log(type,lon,lat);

            var hunterMarker;
            if (type == 'update') {
                if (marker) {
                    hunterMarker = self.handleOverlay({
                        lon: lon,
                        lat: lat,
                        marker: marker
                    }, 'update');
                } else {
                    // console.log("need marker");
                }
            } else if (type == 'add') {
                hunterMarker = self.handleOverlay({
                    lon: lon,
                    lat: lat,
                    icon: self.makeIcon(self.hunterIcon)
                }, 'add');

                markersContainer.push(hunterMarker.marker);
            } else {
                // console.log("error type");
            }


            if (count) {
                var distance = Utils.getFlatternDistance({
                    lon: APP.data.self.lon,
                    lat: APP.data.self.lat
                }, {
                    lon: lon,
                    lat: lat
                });
                distanceArr.push({
                    distance: distance,
                    lon: lon,
                    lat: lat
                });

                // if(type == 'add') {

                // }


                if (!self.hunterTalkOnce) {
                    if (Utils.rand(0, 100) > 80) {
                        // var label = makeHunterTalkLabel('别跑!把鹿留下!');
                        var randIndex = Utils.rand(0, 1),
                            // var randIndex = 1,
                            label;

                        switch (randIndex) {
                            case 0:
                                label = makeHunterTalkLabel(APP.mapMaker.talkingShit.hunter[randIndex], {}, -48, -40);
                                break;
                            case 1:
                                label = makeHunterTalkLabel(APP.mapMaker.talkingShit.hunter[randIndex], {}, -55, -40);
                                break;
                        }
                        var oldLabel;

                        if (oldLabel = hunterMarker.marker.getLabel()) {
                            self.map.removeOverlay(oldLabel);
                        }

                        hunterMarker.marker.setLabel(label);

                        setTimeout((function(l) {
                            return function() {
                                if (self.map && self.map.removeOverlay) {
                                    self.map.removeOverlay(l);
                                    hunterMarker.marker.setLabel(makeHunterDistanceLabel('距离你' + distance + '米', true));
                                }
                            }
                        })(label), 5000);
                    }else {
                        // hunterMarker.marker.setLabel(makeHunterDistanceLabel('距离你' + distance + '米', true));
                        var oldLabel;

                        if (oldLabel = hunterMarker.marker.getLabel()) {
                            self.map.removeOverlay(oldLabel);
                        }
                        hunterMarker.marker.setLabel(makeHunterDistanceLabel('距离你' + distance + '米', true));
                    }
                } else {
                    if (type === 'add') {
                        hunterMarker.marker.setLabel(makeHunterDistanceLabel('距离你' + distance + '米', true));
                    } else {
                        var _label = hunterMarker.marker.getLabel();
                        if (_label) {
                            _label.setContent('抢鹿者</br>距离你' + distance + '米');
                        }
                    }
                }
            } else {
                if (type == 'add') {
                    hunterMarker.marker.setLabel(makeHunterDistanceLabel(''));
                }
                // else {
                //     var label = hunterMarker.marker.getLabel();
                //     if(label) 
                // }

            }
        }
    }

    // 移除所有竞争者
    // MapMaker.prototype.clearHunters = function() {
    //     var self = this;
    //     this.handleOverlay(this.data.overlays.huntersMarker, 'clear');
    //     this.data.overlays.huntersMarker.length = 0;
    //     this.nowInView.hunterPoint.length = 0;
    // }

    /** 
     *----------------------------------------------
     *          清空所有markers
     *----------------------------------------------
     *      首先从地图上移除所有marker,
     *      然后清除包括this.data.overlays中的所有marker，
     *      及nowInView中的所有内容
     */
    MapMaker.prototype.clear = function() {

        var cacheArr = [],
            self = this,
            clearArr = [];

        this.task.reset();
        this.hasTriggerHunt = false;
        this.robotFireHunt = false;

        for (var i in this.timers) {
            clearInterval(this.timers[i]);
        }

        if (this.map) {

            this.map.clearOverlays();

            // 清空data.overlays中缓存的Marker实例
            this.data.overlays.myMarker = null;
            this.data.overlays.deerMarker.length = 0;
            this.data.overlays.huntersMarker.length = 0;

            // 清空nowInView
            this.nowInView.myPoint = null;
            this.nowInView.deerPoint.length = 0;
            // this.nowInView.hunterPoint.length = 0;

            clearInterval(this.routeTimer);
        } else {
            // throw new Error("Map实例未初始化？");
        }
    }

    /** 
     *----------------------------------------------
     *                   获取路线坐标点
     *----------------------------------------------
     *   @param : from/to : {lon:lon,lat:lat}
     *   @param: callback(Function) : 回调，回调接收一个参数，为坐标点数组
     *
     */
    MapMaker.prototype.getRoutes = function(fromPoint, toPoint, callback) {

        if (!this.map) return;

        var self = this;

        // 调路线接口，拼接参数
        var data = {
            origin: fromPoint.lat + ',' + fromPoint.lon,
            destination: toPoint.lat + ',' + toPoint.lon,
            region: APP.data.self.cid
        }

        var url = this.routesUrl + $.param(data);

        url = makeProxyUrl(url);

        Utils.sendRequest(url, {
                _t: Date.now()
            }, 'get', 'jsonp')
            .then(function(data) {
                if (data && data.status == 0) {
                    // console.log('success');

                    var steps = data.result.routes[0]['steps'];
                    Utils.isFunction(callback) && callback.call(self, steps);
                } else {
                    Utils.handleError(data.errno);
                    // console.log('error', data);
                }
            }, function(xhr) {
                sendlog && sendlog("timeout");
                alert("亲，请求超时了!可能您当前的网络不佳，请查看您的网络状况或稍后再试!");
            });
    }

    /**
     *----------------------------------------------
     *          根据传入的点画线
     *----------------------------------------------
     *
     *    根据传入点，规划两点路线，在地图上画出路线
     *
     *    @param: fromPoint(Point) 出发点Point实例
     *    @param: toPoint(Point) 终点Point实例
     *
     */
    MapMaker.prototype.addRouter = function(fromPoint, toPoint) {

        var stepArray = [],
            self = this;

        if (this.map && this.route) {
            this.map.removeOverlay(this.route);
        }

        this.getRoutes({
            lon: fromPoint.lng,
            lat: fromPoint.lat
        }, {
            lon: toPoint.lng,
            lat: toPoint.lat
        }, function(stepsArray) {
            stepArray.push(new BMap.Point(fromPoint.lng, fromPoint.lat));
            if (stepsArray && stepsArray.length > 0) {
                for (var i = 0; i < stepsArray.length; i++) {
                    stepArray.push(new BMap.Point(stepsArray[i].stepDestinationLocation.lng, stepsArray[i].stepDestinationLocation.lat));
                }
            }

            var mp = new BMap.Polyline(stepArray, {
                strokeColor: "#5c9ced",
                strokeWeight: 5,
                strokeOpacity: 1
            });

            self.route = mp;

            self.map.addOverlay(mp);
        })
    }

    MapMaker.prototype.startGetRoute = function() {

        var running = (function() {
            if (this.nowInView['myPoint'] && this.nowInView['deerPoint'].length > 0) {
                // console.log("run")
                this.addRouter(this.nowInView['myPoint'], this.nowInView['deerPoint'][0]);
            }
        }).bind(this);

        running();
        clearInterval(this.routeTimer);

        this.routeTimer = setInterval(running, 30 * 1000);

    }

    /**
     *----------------------------------------------
     *          从point1->point2的角度
     *----------------------------------------------
     *
     *    注意！一定要在设置完视区以后调用，否则像素坐标将出错！
     *
     *    @param: point1(Point) 第一个点Point实例
     *    @param: point2(Point) 第二个点Point实例
     *
     *    @return: (Number) 两个点角度，以x轴正方向为轴以x轴正方象为轴，顺时针递增
     *                      单位为角度
     */
    // MapMaker.prototype.getAngle = function(point1, point2) {
    //     if (!this.map) return;
    //     // debugger
    //     var pixP1 = this.map.pointToPixel(point1),
    //         pixP2 = this.map.pointToPixel(point2),
    //         x1 = pixP1.x,
    //         y1 = pixP1.y,
    //         x2 = pixP2.x,
    //         y2 = pixP2.y,
    //         angle = 0;


    //     // x轴正方向为0，逆时针为减，顺时针为增
    //     angle = 180 * Math.atan2(y2 - y1, x2 - x1) / Math.PI;
    //     console.log(angle >= 0 ? angle : (360 + angle));
    //     return angle >= 0 ? angle : (360 + angle);
    // }

    // 判断我和鹿的距离是否小于huntRange/distance
    MapMaker.prototype.isNearEnough = function(distance) {
        distance = distance || this.huntRange;

        var dif = Utils.getFlatternDistance({
            lon: APP.data.self.lon,
            lat: APP.data.self.lat
        }, {
            lon: APP.data.deer.lon,
            lat: APP.data.deer.lat
        });

        // console.log(dist)
        mediator.trigger("distanceChange", this, dif);

        return dif < distance;
    }

    MapMaker.prototype.destroy = function() {
        this.clear();
        this.task.reset();
        this.task = null;
        this.map = null;
        this.data = null;
        this.nowInView = null;
        this.robotEnable && robot.terminate();

    }

    // MapMaker.prototype.checklot = function() {
    //     Utils.sendRequest(Utils.getUrl('checkLot'), Utils.param(), 'get', 'jsonp')
    //         .then(function(data) {
    //             console.log(data);
    //         }, function(err) {
    //             console.log(err);
    //             alert("当前网络不佳，请稍后再试!");
    //         });
    // }

    // MapMaker.prototype.getPrize = function() {
    //     Utils.sendRequest(Utils.getUrl('prize'), Utils.param(), 'get', 'jsonp')
    //         .then(function(data) {
    //             console.log(data);
    //         }, function(err) {
    //             console.log(err);
    //             alert("当前网络不佳，请稍后再试!");
    //         });
    // }

    // MapMaker.prototype.claimPrize = function(pName, phone) {
    //     switch (pName) {
    //         case 'fee':

    //             if (!phone) {
    //                 alert("请填写您的手机号!");
    //                 return;
    //                 // throw new Error("缺少手机号");
    //             }

    //             Utils.sendRequest(Utils.getUrl('claimfee'), {
    //                     cuid: APP.data.self.cuid,
    //                     lon: APP.data.self.lon,
    //                     lat: APP.data.self.lat,
    //                     cid: APP.data.self.cid,
    //                     phone: phone,
    //                     sign: Utils.calcMD5(APP.data.self.cuid, APP.data.self.cid, APP.data.self.lon, APP.data.self.lat, phone)
    //                 }, 'get', 'jsonp')
    //                 .then(function(data) {
    //                     console.log(data);
    //                 }, function(err) {
    //                     console.log(err);
    //                     alert("当前网络不佳，请稍后再试!");
    //                 });
    //             break;
    //         case 'dicos':
    //             Utils.sendRequest(Utils.getUrl('claimdicos'), Utils.param(), 'get', 'jsonp')
    //                 .then(function(data) {
    //                     console.log(data);
    //                 }, function(err) {
    //                     console.log(err);
    //                     alert("当前网络不佳，请稍后再试!");
    //                 });
    //             break;
    //     }
    // }

    // 更改功能，计算所有点距离，排序后返回数组
    MapMaker.prototype.getNearestNearbyDistance = function(nearbyArr) {

        if (!(Utils.typeOf(nearbyArr, 'array') && nearbyArr.length > 0)) return false;

        var target = getNearest({
            lon: APP.data.self.lon,
            lat: APP.data.self.lat
        }, nearbyArr);

        if (!target) return '>2000';

        return {
            distance: Utils.getFlatternDistance({
                lon: APP.data.self.lon,
                lat: APP.data.self.lat
            }, {
                lon: target.lon,
                lat: target.lat
            }),
            lon: target.lon,
            lat: target.lat
        }
    }

    /**
     *----------------------------------------------
     *          根据墨卡托x,y更新lon,lat位置
     *----------------------------------------------
     *   @param (Number) x - Mercator x
     *   @param (Number) y - Mercator y
     */
    MapMaker.prototype.updatePositionByMercator = function(x, y) {
        if (x && y) {
            var newPosition = this.makePoint(x, y, true);

            // 注意，point实例的经度是lng,此处先转换避免出错
            var lon = newPosition.lng,
                lat = newPosition.lat;

            APP.updateData({
                self: {
                    lon: lon,
                    lat: lat
                }
            });
            return {
                lon: lon,
                lat: lat
            }
        }
    }



    /** 
     *----------------------------------------------
     *                  客户端回调
     *----------------------------------------------
     *   当用户位置发生变化，由客户端调起该函数
     *
     *   调起协议后，每隔一段时间由客户端调起该回调
     *   返回的数据将储存在APP.data.self内
     *   仅存，不错任何操作
     */
    window.onLocationChange = function(data) {
        // 回传的是墨卡托
        // data会回传{"x":'123',"y":"123"}回来
        // alert(JSON.stringify(data));
        if (!data) return;

        // 确认地图控件已初始化，并且已经展示
        if (APP.mapMaker && APP.mapMaker.map && APP.mapMaker.hasShown) {

            if (data.x && data.y) {
                var newPosition = APP.mapMaker.makePoint(data.x, data.y, true);

                // 注意，point实例的经度是lng,此处先转换避免出错
                var lon = newPosition.lng,
                    lat = newPosition.lat;

                // 先同步APP.data中的数据
                APP.updateData({
                    self: {
                        lon: lon,
                        lat: lat
                    }
                });

                if (APP.data.catch_status == 1) {
                    APP.updateData({
                        deer: {
                            lon: lon,
                            lat: lat
                        }
                    });
                }
                // APP.data.self.lon = lon;
                // APP.data.self.lat = lat;

                var overlay = APP.mapMaker.handleOverlay({
                    marker: APP.mapMaker.data.overlays.myMarker,
                    lon: lon,
                    lat: lat
                }, 'update');

                APP.mapMaker.nowInView['myPoint'] = overlay.point;

                // 判断距离，如果满足，触发hunt事件
                if (APP.data.catch_status == 0 && !APP.mapMaker.hasTriggerHunt && APP.mapMaker.isNearEnough()) {
                    // trigger hunt now!
                    APP.mapMaker.hasTriggerHunt = true;

                    // 停止定时任务
                    APP.mapMaker.task.stop();

                    mediator.trigger('hunt', APP.mapMaker);
                }
            }
        }
    }

    /** 
     *----------------------------------------------
     *                 测试脚本
     *----------------------------------------------
     *  根据初始位置与鹿的终点，移动位置，看是否触发抢鹿
     */
    // setInterval(testLocationChange(), 5000);
    // window.testFunc = testLocationChange;

    // function testLocationChange() {

    //     APP.updateData({
    //         self: {
    //             lon: APP.data.deer.lon,
    //             lat: APP.data.deer.lat
    //         }
    //     });

    //     var overlay = APP.mapMaker.handleOverlay({
    //         marker: APP.mapMaker.data.overlays.myMarker,
    //         lon: APP.data.deer.lon,
    //         lat: APP.data.deer.lat
    //     }, 'update');

    //     APP.mapMaker.nowInView['myPoint'] = overlay.point;

    //     // 判断距离，如果满足，触发hunt事件
    //     if (APP.data.catch_status == 0 && !APP.mapMaker.hasTriggerHunt && APP.mapMaker.isNearEnough()) {
    //         // trigger hunt now!
    //         APP.mapMaker.hasTriggerHunt = true;

    //         // 停止定时任务
    //         APP.mapMaker.task.stop();

    //         mediator.trigger('hunt', APP.mapMaker);
    //     }
    // }




    /** 
     *----------------------------------------------
     *                 基础工具函数
     *----------------------------------------------
     *
     */


    /**
     *   @param: selfPosition{lon:123,lat:321}
     */
    function getNearest(selfPosition, targetArr) {
        if (!targetArr) return null;

        var dif, minIndex;
        // 试了5种算法:http://jsperf.com/two-array-min-acm/2
        var min2 = targetArr.reduce(function(p, v, i) {
            // 采用两值相减之和的近似
            dif = v.lon - selfPosition.lon + v.lat - selfPosition.lat;

            if (p < dif) {
                return p;
            } else {
                minIndex = i;
                return dif;
            }

        }, targetArr[0].lon - selfPosition.lon + targetArr[0].lat - selfPosition.lat);

        return targetArr[minIndex];
    }



    // 通过map.baidu.com的proxy服务转发，传入实际url拼接后返回
    function makeProxyUrl(url) {
        return 'http://map.baidu.com/?qt=proxy&url=' + encodeURIComponent(url);
    }

    // 选择鹿后的回调实体，上下文为map实例
    function onSelectDeer(e) {
        var selectDid, matchPoint,
            // 点击的鹿的Point实例
            point = e.target.getPosition(),
            data = this.data.overlays.deerMarker,
            self = this;
        // debugger
        for (var i = 0, l = data.length; i < l; i++) {

            data[i].marker.removeEventListener("click", this.handleSelectDeer);

            matchPoint = data[i].marker.getPosition();
            if (point.equals(matchPoint)) {
                selectDid = data[i].did;
                break;
            }
        }

        if (!selectDid) {
            // if(true) {
            // throw new Error("onSelectDeer:没有符合的did?");
            alert("这只鹿很调皮的躲开了!重新选一只吧~");
            APP.mapMaker && APP.mapMaker.map && APP.mapMaker.cancelGetDeer();
            return;
        }

        Utils.sendRequest(Utils.getUrl('lock'), Utils.param({
            did: selectDid
        }), 'get', 'jsonp').then(function(data) {
            if (data && data.errno == 0) {
                // debugger
                APP.updateData({
                    deer: {
                        did: selectDid,
                        lon: matchPoint.lng,
                        lat: matchPoint.lat,
                    },
                    catch_status: 0
                });

                mediator.trigger('changedeer');

                setTimeout(function() {
                    self.startAsHunter();
                }, 0);

            } else {
                Utils.handleError(data.errno);
                // console.log(data.errno, data.data);
            }

        }, function(error) {
            sendlog && sendlog("timeout");
            alert("亲，请求超时了!可能您当前的网络不佳，请查看您的网络状况或稍后再试!");
        });
    }

    function makeSelfLabel(word, style, x, y) {

        var styleObj = {
            fontSize: '10px',
            padding: '10px',
            lineHeight: '16px',
            border: "0",
            color: '#323232',
            background: getTalkBg() + ' no-repeat center center',
            "background-size": "100% 100%"
        };

        x = x || -30;
        y = y || -40;

        var label = new BMap.Label(word, {
            offset: new BMap.Size(x, y)
        });

        for (var i in style) {
            styleObj[i] = style[i];
        }

        label.setStyle(styleObj);
        return label;
    }

    function makeDearLabel(word, style, x, y) {
        x = x || -25;
        y = y || -36;
        var styleObj = {
            fontSize: '10px',
            padding: '10px',
            lineHeight: '16px',
            border: "0",
            color: '#323232',
            background: getTalkBg() + ' no-repeat center center',
            "background-size": "100% 100%"
        };

        var label = new BMap.Label(word, {
            offset: new BMap.Size(x, y)
        });

        for (var i in style) {
            styleObj[i] = style[i];
        }

        label.setStyle(styleObj);
        return label;
    }

    function makeMyLabel(word, style, x, y) {

        word = word || '我的位置';
        x = x || -13;
        y = y || 49;

        var styleObj = {
            textAlign: 'center',
            fontSize: '10px',
            padding: '1px 5px',
            lineHeight: '14px',
            // border: "0",
            color: '#323232',
            background: ' #fff no-repeat center center',
            "background-size": "100% 100%"
        };

        for (var i in style) {
            styleObj[i] = style[i];
        }

        var label = new BMap.Label(word, {
            offset: new BMap.Size(x, y)
        });

        label.setStyle(styleObj);

        return label;
    }

    function makeHunterTalkLabel(word, style, x, y) {
        var styleObj = {
            fontSize: '10px',
            padding: '10px',
            lineHeight: '16px',
            border: "0",
            color: '#323232',
            background: getHunterTalkBg() + ' no-repeat center center',
            "background-size": "100% 100%"
        };

        for (var i in style) {
            styleObj[i] = style[i];
        }

        x = x || -25;
        y = y || -36;

        var label = new BMap.Label(word, {
            offset: new BMap.Size(x, y)
        });
        label.setStyle(styleObj);
        return label;
    }


    function makeHunterDistanceLabel(word, isHuntingMe) {

        var offsetLeft = isHuntingMe ? -36 : -4;

        var label = new BMap.Label('抢鹿者</br>' + word, {
            offset: new BMap.Size(offsetLeft, 49)
        });
        label.setStyle({
            textAlign: 'center',
            fontSize: '10px',
            padding: '1px 5px',
            lineHeight: '16px',
            border: "0",
            color: '#238517',
            background: getDistanceBg() + ' no-repeat center center',
            "background-size": "100% 100%"
        });
        return label;
    }

    function getHunterTalkBg() {
        return 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAN4AAABMCAMAAAA1F/nNAAAAA3NCSVQICAjb4U/gAAAA3lBMVEX///9r2Fxr2Fxr2Fxr2Fxr2Fxr2Fxr2Fxr2Fxr2Fxk1lNl1lRf1U5e1Uxd1Exa00hZ00eN4YGL4X+I4HuE33d/3XCA3XJ83W163Gx43Gl43Gp222du2V5v2WBr2Fxq2Fpm11Vk1lNl1lRi1lFh1VCd5ZGb5Y+Z5I2Z5I+V44qR4oVp2Flr2Fxq2Fpo11jK8cXL8cXF8L/A77m37K+17K3i997c9tjZ9dXX9dLZ9dPS883Q88vP88rL8sXL8cXz/fH1/PTx++/y+/Hu+u3q+ujm+OP////7/vv5/fj3/fa+GYCwAAAASnRSTlMAESIzRFVmd4iZmZmZmZmZmaqqqqqqqqqqqqqqqqqqqqqqqqqqu7u7u7u7u7u7u8zMzMzMzN3d3d3d3d3d3d3u7u7u7u7u/////1VPhWwAAAAJcEhZcwAACxIAAAsSAdLdfvwAAAAYdEVYdENyZWF0aW9uIFRpbWUAMjAxNC4xMi4yMBLVr00AAAAcdEVYdFNvZnR3YXJlAEFkb2JlIEZpcmV3b3JrcyBDUzbovLKMAAABxUlEQVR4nO3c2VLCMBSA4XShNooLKuJSoqi4KwoqbmgBBXz/F7JJbSXeMA7JhBPPf6Uz2DnfNBdcnEhImuMHIaUMfpSGge8QKS80PZXiQu8H59qG44Vu9ur4b5XWY380sKFRv92qcFL6At3kp63G0PRUShs2thOVeH/JyVztmp5Hed1Scj7To1npmR5GQ3FZHM+ARa+mR9FSJ2IBIZRFselJtBRXGSWEscj0IJqqMoY8sCEPcsiDHPIghzzIIQ9yyIMc8iCHPMghD3LIgxzyIIc8yCEPcsiDHPIghzzIIQ9yyIMc8iCHPMj9B57lK3MBi15MT6KlZ7Hw6DFWtnJddSPdpubLxvb5et/Lxnauil/nq+LZon/bzkV/s9c0lo+lLfzPkyVFD86vaZi9ZCP73k4XlTx1/JJNfkVKyZP/muTrnxWnfR6/IuWSGcmjku+9dBg6k/8KTrLvY+1gziqe8B1lvrv1mmU8yXdfrgWW8cZ9D5v71vGEry58Tzt7gelp1Jf7OtWrgulhNJT4VrjvZtdKXuZrLpz7pkfRkvANmsVLO3nET3y39fkLb/JHQeaL77x0Zr4vqo77qKVnk+cUfv87hGn7Arvcpp9DRcHYAAAAAElFTkSuQmCC)';
    }

    function getTalkBg() {
        return 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJsAAABMCAMAAABNhDUpAAAAA3NCSVQICAjb4U/gAAAA3lBMVEX////dNDTdNDTdNDTdNDTdNDTbKCjaIyPZHBzZGxvZGBjYFxfWCAjVBgbjWlrjWFjjUlLiUVHhSEjfQEDfPj7ePDzeOjreODjdNDTdMjLdMDDcLy/dLCzcKyvbKCjbJyfaIyPaISHaHx/pfn7pe3voeHjodnbncHDmaWnlYmLlYGDkXFzulZXtk5PtkZHtj4/sjY3si4vriorqhITzt7f2ycn0wcH0urrzubn41tb409P30dH3z8/3zc375ub64uL53Nz98/P88PD86+v++vr99/f99fX98/P////++vqUXZrtAAAASnRSTlMAESIzRFVVVVVVVVVVVWZmZmZmZmZmZmZmZmZmZmZmZmZmZnd3d3d3d3d3d4iIiIiIiIiImaqqqqq7u7u7u8zMzN3d3e7u7u7//zv1PXoAAAAJcEhZcwAACxIAAAsSAdLdfvwAAAAYdEVYdENyZWF0aW9uIFRpbWUAMjAxNC4xMi4yMBLVr00AAAAcdEVYdFNvZnR3YXJlAEFkb2JlIEZpcmV3b3JrcyBDUzbovLKMAAABoklEQVRoge3aaU/CQBCAYbrseiKKomy98ELF+6gXooJSwP//h9zdiu1SE+skZefDvJ8gKeFJJ4EmO4VClMe4ENJ5QnDmFawYAlacYLHMQyXTidG9Y/rdYtDp9obO63U7QVl7olvnqVeVl0/XqkTtJUUyd04N9HDgmmPXb6ixRhMt911jxgtPzFS5rLVdU9K11yTXI10NXUvShVU9VCmrriG/teJLsgEiGyyywSIbLLLBIhssssEiGyyywSIbLLLBIhssssEiGyyywSIbLLLBIhssssEiGyyywUJvw3zWxmWt5VqSrmXOKJmUp/jOdpvRib0+E0eGCw+iM3HUuwSYdzBy210pXVvrE+HtfOaPisTeTz47P6WrJG6wP5dVltj5yW1XysK9N2YzsNK7UrmkhpHEfRzt8Ul8bbYUbuHyB/d6vIvIZuPemjuYbAZ38Y3rlOvctcfK4KJ/nadKveiaY6dx5wb3vLyNzBbj7qpb2GwGd6Zw9/4mOtsI9zC1wf6+eNIZ3PBxZh2hzeCCm2kfo230LIHppzdO48YfL9DkFf8v+wKiVptPIy3ryQAAAABJRU5ErkJggg==)';
    }

    function getDistanceBg() {
        return 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAALUAAAAmBAMAAABwj8d3AAAAA3NCSVQICAjb4U/gAAAAIVBMVEX///+P0IaP0IaP0IaP0IbO+cjF9L++77et5KWR0YiP0IYf9O2MAAAAC3RSTlMAEVV33f////////0r/r8AAAAJcEhZcwAACxIAAAsSAdLdfvwAAAAYdEVYdENyZWF0aW9uIFRpbWUAMjAxNC4xMi4yMBLVr00AAAAcdEVYdFNvZnR3YXJlAEFkb2JlIEZpcmV3b3JrcyBDUzbovLKMAAAAYklEQVRIiWNgEPZaRQvgLMDAwDQjNZQWIGMSA4NkKU2MDg2tFGCwoJHRoREGDG60MjvMgWEprcwOXTBq9qjZo2aPmj1q9qjZo2aPmj1q9hAwm5ZtTVq2kWnZtqdln4SGfSkAgnLB6db7XFgAAAAASUVORK5CYII=)';
    }


    return MapMaker;
});
