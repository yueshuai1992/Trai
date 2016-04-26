 /*!
  * author:jieyou
  * contacts:baidu hi->youyo1122
  */
 /*!
  * author:zhaolei
  * contacts:baidu hi->zllongzero
  */
 /*!
  * author:xiaoyuze
  * contacts:baidu hi->xiaoyuze88@gmail.com
  */
 ;
 (function(window, document, navigator, location) {
     var util = {},
         nativeAppAdapter = {}

     ;
     (function(util) {
         var keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
         util.decode64 = function(input) {
             var output, i
             var chr1, chr2, chr3
             var enc1, enc2, enc3, enc4
             if (/[^A-Za-z0-9\+\/\=]/g.test(input)) {
                 return
             }
             input = input.replace(/[^A-Za-z0-9\+\/\=]/g, '')
             i = 0
             output = ''
             do {
                 enc1 = keyStr.indexOf(input.charAt(i++))
                 enc2 = keyStr.indexOf(input.charAt(i++))
                 enc3 = keyStr.indexOf(input.charAt(i++))
                 enc4 = keyStr.indexOf(input.charAt(i++))

                 chr1 = (enc1 << 2) | (enc2 >> 4)
                 chr2 = ((enc2 & 15) << 4) | (enc3 >> 2)
                 chr3 = ((enc3 & 3) << 6) | enc4

                 output += String.fromCharCode(chr1)

                 if (enc3 != 64) {
                     output += String.fromCharCode(chr2)
                 }
                 if (enc4 != 64) {
                     output += String.fromCharCode(chr3)
                 }
             } while (i < input.length)

             return unescape(output)
         }
     })(util)

     // ;(function(util){
     // var url = location.href
     util.getParam = function(key) {
             var reg = new RegExp('(^|&|\\?|#)' + key + '=([^&#]*)(&|\x24|#)', ''),
                 match = location.href.match(reg)
             if (match) {
                 return decodeURIComponent(match[2])
             }
             return null;
         }
         // })(util)

     util.isFunction = function(func) {
         return typeof(func) == 'function'
     }

     // util中，下划线开头的是属性，否则为方法，后同
     ;
     (function() {
         var android = navigator.userAgent.match(/(Android);?[\s\/]+([\d.]+)?/),
             version
         util._isAndroid = util._isAndroid2P3AndBelow = false
         if (android) {
             util._isAndroid = true
                 // 判断是否为安卓2.3及以下，这种情况下，在客户端内，打开passport页面，进行第三方登录有问题
             version = parseFloat(android[2])
             util._isAndroid2P3AndBelow = !isNaN(version) && version <= 2.3
         }
     })()

     // util._isIos = !util._isAndroid && /iphone|ipod/i.test(navigator.userAgent)

     util._isInApp7 = navigator.userAgent.indexOf('baidumap_IPHO') != -1 || navigator.userAgent.indexOf('baidumap_ANDR' ) != -1  || !!util.getParam('cuid');
     // 即，只有7.0.0版本以上，给userAgent做了特殊处理，才返回true

     // 是否在7版本以上的app中
     nativeAppAdapter.isInApp7 = function() {
         return util._isInApp7
     }

     util.isPlainObject = function(obj) {
         return (typeof(obj) == 'object' && Object.getPrototypeOf(obj) == Object.prototype)
     }

     ;
     (function(util) {
         var head = document.head || document.getElementsByTagName('HEAD')[0],
             callbackIndex = 0
         util.jsonp = function(url, callback, onErrorCallback) {
             var script = document.createElement('SCRIPT'),
                 callbackName = 'yyfm_nativeAppAdapter_jsonp_' + callbackIndex++
                 window[callbackName] = function(data) {
                     callback(data)
                     delete window[callbackName]
                 }
             url = url.replace('callback=?', 'callback=' + callbackName)
             script.src = url + (url.indexOf('?') == -1 ? '?' : '&') + 't=' + new Date().getTime()
             if (onErrorCallback) {
                 script.onerror = function() {
                     onErrorCallback()
                 }
             }
             head.appendChild(script)
         }
     })(util)

     util.removeSignAndSplit = function(str) {
         return str.replace(/\(|\)/g, '').split(',')
     }

     ;
     (function(util, nativeAppAdapter) {
         var citiesHash = {
             '1': {
                 c: '全国'
                     // ,p:'全国'
             },
             '131': {
                 c: '北京市'
                     // ,p:'北京市'
             },
             '289': {
                 c: '上海市'
                     // ,p:'上海市'
             },
             '332': {
                 c: '天津市'
                     // ,p:'天津市'
             },
             '340': {
                 c: '深圳市',
                 p: '广东省'
             },
             '257': {
                 c: '广州市',
                 p: '广东省'
             },
             '233': {
                 c: '西安市',
                 p: '陕西省'
             },
             '218': {
                 c: '武汉市',
                 p: '湖北省'
             },
             '75': {
                 c: '成都市',
                 p: '四川省'
             },
             '268': {
                 c: '郑州市',
                 p: '河南省'
             },
             '132': {
                 c: '重庆市'
                     // ,p:'重庆市'
             },
             '288': {
                 c: '济南市',
                 p: '山东省'
             },
             '179': {
                 c: '杭州市',
                 p: '浙江省'
             },
             '58': {
                 c: '沈阳市',
                 p: '辽宁省'
             },
             '224': {
                 c: '苏州市',
                 p: '江苏省'
             },
             '315': {
                 c: '南京市',
                 p: '江苏省'
             }
         }
         nativeAppAdapter.getCity = function(callback) {
             var id,
                 name,
                 province
             if (util.isFunction(callback)) {
                 id = util.getParam('c')
                 if (id && citiesHash[id]) {
                     callback.call(nativeAppAdapter, {
                         id: id,
                         name: citiesHash[id].c,
                         province: citiesHash[id].p || citiesHash[id].c,
                         otherData: null
                     })
                 } else {
                     // 这个key在百度账号youyo1122下
                     util.jsonp('http://api.map.baidu.com/location/ip?ak=x78oVekBLBQQ6VIvPoX7eNDj&callback=?', function(data) {
                         if (data.status == 0 && data.content && data.content.address_detail) {
                             if (data.content.address_detail.city) {
                                 name = data.content.address_detail.city
                             }
                             if (data.content.address_detail.city_code) {
                                 id = data.content.address_detail.city_code
                             }
                             if (data.content.address_detail.province) {
                                 province = data.content.address_detail.province
                             }
                         }
                         callback.call(nativeAppAdapter, {
                             id: id || null,
                             name: name || null,
                             province: province || null,
                             otherData: data
                         })
                     })
                 }
             }
             return nativeAppAdapter
         }
     })(util, nativeAppAdapter)

     util.throwErr = function(err) {
         throw new Error(err || '参数错误')
     }

     util.toArray = function(obj) {
         // only convert plainObject or string
         if (util.isPlainObject(obj) || typeof(obj) == 'string' || obj instanceof String) {
             return [obj]
         } else {
             return obj
         }
     }

     nativeAppAdapter.getBaiduMercator = function(callback, timeout) {
         var x, y,
             loc, locArr, failedXYObj, geolocationCallbackCalled
         if (util.isFunction(callback)) {
             loc = util.getParam('loc')
             failedXYObj = {
                 x: null,
                 y: null
             }
             if (loc) {
                 locArr = util.removeSignAndSplit(loc)
                 if (locArr.length == 2) {
                     x = parseFloat(locArr[0], 10)
                     y = parseFloat(locArr[1], 10)
                 }
                 if (x && y) { // 1406254更新：安卓客户端定位失败可能传0.000000，parseFloat后为0
                     callback.call(nativeAppAdapter, {
                         x: x,
                         y: y
                     })
                     return nativeAppAdapter
                 }
             }

             if ('geolocation' in navigator) {
                 if (typeof(timeout) !== 'number') {
                     timeout = 10 * 1000
                 }
                 geolocationCallbackCalled = false
                 setTimeout(function() {
                     if (!geolocationCallbackCalled) {
                         geolocationCallbackCalled = true
                         callback.call(nativeAppAdapter, failedXYObj)
                     }
                 }, timeout)
                 navigator.geolocation.getCurrentPosition(function(geoData) {
                     if (geoData.coords.latitude && geoData.coords.longitude) {
                         util.jsonp('http://api.map.baidu.com/ag/coord/convert?from=2&to=5&x=' + geoData.coords.longitude + '&y=' + geoData.coords.latitude + '&callback=?', function(data) {
                             if (data.error == 0) {
                                 if (!geolocationCallbackCalled) {
                                     geolocationCallbackCalled = true
                                     callback.call(nativeAppAdapter, {
                                         x: util.decode64(data.x),
                                         y: util.decode64(data.y)
                                     })
                                 }
                             }
                         })
                     }
                 }, function() {
                     if (!geolocationCallbackCalled) {
                         geolocationCallbackCalled = true
                         callback.call(nativeAppAdapter, failedXYObj)
                     }
                 }, {
                     enableHighAccuracy: true,
                     timeout: timeout - 500,
                     maximumAge: 2 * 60 * 1000
                 })
             } else {
                 callback.call(nativeAppAdapter, failedXYObj)
             }
         }
         return nativeAppAdapter
     }

     ;
     (function(util, nativeAppAdapter) {
         var hash = {
             '99': 'offline',
             '100': 'unknown',
             '101': 'online_but_connection_type_unknown',
             '102': '2G',
             '103': '3G_or_above_3G',
             '104': 'ethernet',
             '199': 'wifi'
         }
         nativeAppAdapter.getNetStatus = function() {
             var net = util.getParam('net'),
                 num = '100'
                 // ,html5ConnectionType
             if (net) {
                 switch (net) {
                     case '-1':
                         num = '99'
                         break;
                     case '0':
                         num = '101'
                         break;
                     case '2':
                     case '5':
                     case '6':
                         num = '102'
                         break;
                     case '3':
                     case '4':
                     case '7':
                     case '8':
                     case '9':
                     case '10':
                         num = '103'
                         break;
                     case '1':
                         num = '199'
                         break;
                 }
             }
             if (num == '100') {
                 if ('connection' in navigator) {
                     // html5ConnectionType = navigator.connection.type
                     // see http://davidbcalhoun.com/2010/using-navigator-connection-android/
                     switch (navigator.connection.type + '') {
                         // case '0':
                         //  num = '100'
                         //  break;
                         case '1':
                             num = '104'
                             break;
                         case '2':
                             num = '199'
                             break;
                         case '3':
                             num = '102'
                             break;
                         case '4':
                             num = '103'
                             break;
                     }
                 }
             }
             if (num == '100') {
                 if ('onLine' in navigator) {
                     if (navigator.onLine) {
                         num = '101'
                     } else {
                         num = '99'
                     }
                 }
             }
             return {
                 code: num,
                 describe: hash[num]
             }
         }
     })(util, nativeAppAdapter)

     // removed at 140303
     // nativeAppAdapter.getScreenCssPixels = function(){
     //  var screen$ = util.getParam('screen'),
     //      dpi = util.getParam('dpi'),
     //      width,
     //      height,
     //      devicePixelRatio,
     //      screen$Arr,
     //      dpiArr
     //  if(screen$){
     //      screen$Arr = util.removeSignAndSplit(screen$)
     //      if(dpi){ // only Android has `dpi` param 
     //          dpiArr = util.removeSignAndSplit(dpi)
     //          width = (Number(screen$Arr[0])*160/Number(dpiArr[0]))+''
     //          height = (Number(screen$Arr[1])*160/Number(dpiArr[1]))+''
     //      }else{
     //          width = screen$Arr[0]
     //          height = screen$Arr[1]
     //      }
     //  }else{
     //      // iOS returns css pixels
     //      // but Android returns physics pixels
     //      width = window.screen.width
     //      height = window.screen.height
     //      if(util._isAndroid){
     //          devicePixelRatio = window.devicePixelRatio
     //          width = width/devicePixelRatio
     //          height = height/devicePixelRatio
     //      }
     //  }
     //  return {
     //      width:width,
     //      height:height
     //  }
     // }
     util.getUrlSv = function() {
         return util.getParam('sv')
     }
     nativeAppAdapter.getSv = function(callback) {
         var sv
         if (util.isFunction(callback)) {
             sv = util.getUrlSv()
             if (sv) {
                 callback.call(nativeAppAdapter, sv)
             } else {
                 if (util._isAndroid) {
                     util.jsonp('http://127.0.0.1:6259/getpackageinfo?mcmdf=inapp_lbs_basicservice&packagename=com.baidu.BaiduMap&callback=?', function(data) {
                         var sv$
                         if (data.error == 0 && data.package_infos[0].package_name == 'com.baidu.BaiduMap') {
                             sv$ = data.package_infos[0].version_name
                         } else {
                             sv$ = null
                         }
                         callback.call(nativeAppAdapter, sv$)
                     }, function() {
                         callback.call(nativeAppAdapter, null)
                     })
                 } else {
                     callback.call(nativeAppAdapter, null)
                 }
             }
         }
         return nativeAppAdapter
     }

     // 140414，登录互通后移除
     // nativeAppAdapter.getBduss = function(callback){
     //  var bduss
     //  if(util.isFunction(callback)){
     //      bduss = util.getParam('bduss')
     //      if(bduss){
     //          callback.call(nativeAppAdapter,bduss)
     //      }else{
     //          util.jsonp('http://map.baidu.com/maps/interfaces/passport/getbduss?callback=?',function(data){
     //              var bduss$
     //              if(data && data.bduss){
     //                  bduss$ = data.bduss
     //              }else{
     //                  bduss$ = null
     //              }
     //              callback.call(nativeAppAdapter,bduss$)
     //          },function(){
     //              callback.call(nativeAppAdapter,null)
     //          })
     //      }
     //  }
     //  return nativeAppAdapter
     // }

     ;
     ['mb', 'os', 'cuid', 'sign', 'pot'].forEach(function(e, i) {
         nativeAppAdapter['get' + e[0].toUpperCase() + e.substr(1)] = function() {
             return util.getParam(e)
         }
     })

     // 调用native接口分享
     // see：http://wiki.babel.baidu.com/twiki/bin/view/Ps/Ns/ShareCost
     // native通过截取发起的请求，src、text、url、title、height、haveQr必填，否则报错，不予发起
     // 140325移除，统一采用multiShare接口
     // nativeAppAdapter.share = function(options,doNotAutoShare){
     //  var nativeUrlArray,nativeUrl
     //  // options is plain object
     //  if(!util.isPlainObject(options)){
     //      util.throwErr()
     //      return
     //  }
     //  nativeUrlArray = []
     //  // src
     //  if(options.hasOwnProperty('src') && (options.src == 'weibo' || options.src == 'friend' || options.src == 'weixin')){
     //      nativeUrlArray.push('src='+options.src)
     //  }else{
     //      util.throwErr()
     //      return
     //  }
     //  // text
     //  if(options.hasOwnProperty('text')){
     //      nativeUrlArray.push('text='+encodeURIComponent(options.text))
     //  }else{
     //      util.throwErr()
     //      return
     //  }
     //  // url
     //  if(options.hasOwnProperty('url')){
     //      nativeUrlArray.push('url='+encodeURIComponent(options.url))
     //  }else{
     //      util.throwErr()
     //      return
     //  }
     //  // others need encode. 140324 added 'imageSource'
     //  ;['title','qrTitle','content','imageSource'].forEach(function(e,i){
     //      var value
     //      if(options.hasOwnProperty(e)){
     //          value = encodeURIComponent(options[e])
     //      }else{
     //          if(e == 'title'){
     //              value = encodeURIComponent('分享百度地图')
     //          }
     //      }
     //      if(value){
     //          nativeUrlArray.push(e+'='+value)
     //      }
     //  })
     //  // others no need encode. 140324 added 'contentType'
     //  ;['height','haveQr','bgColor','frColor','fontSize','color','margin','contentType'].forEach(function(e,i){
     //      var value
     //      if(options.hasOwnProperty(e)){
     //          value = options[e]
     //      }else{
     //          switch(e){
     //              case 'height':
     //                  value = 100
     //                  break;
     //              case 'haveQr':
     //                  value = '0'
     //                  break;
     //              case 'contentType':
     //                  value = 'text'
     //                  break;
     //              default:
     //                  value = null
     //                  break;
     //          }
     //      }
     //      if(value){
     //          nativeUrlArray.push(e+'='+value)
     //      }
     //  })
     //  nativeUrl = 'bdapi://shareCost?'+nativeUrlArray.join('&')
     //  // alert(nativeUrl)
     //  if(!doNotAutoShare){
     //      try{
     //          location.replace(nativeUrl)
     //      }catch(e){}
     //  }

     //  return nativeUrl
     // }

     // 安卓或iOS 地图客户端版本6.9.0以上可用multiShare方法 和 支持签名验证
     // 140627 大部分用户的客户端都已经升级到了7.x及以上，而且这个方法是从url判断的，不准，移除；统一认为7以上支持
     // util._isAbove690 = (function(){
     //  var sv = util.getUrlSv()
     //  if(sv){
     //      sv = sv.split('.')
     //      if(sv.hasOwnProperty(0) && sv.hasOwnProperty(1) && sv.hasOwnProperty(2)){
     //          // if(util._isAndroid && (sv[0] > 6 || (sv[0] == 6 && sv[1] > 8) || (sv[0] == 6 && sv[1] == 8 && sv[2] >= 4))){
     //          //  return true
     //          // }
     //          if((util._isAndroid || /iphone|ipod/i.test(navigator.userAgent)) && (sv[0] > 6 || (sv[0] == 6 && sv[1] >= 9))){
     //              return true
     //          }
     //      }
     //  }
     //  return false
     // })()

     // nativeAppAdapter.isMultiShareAvailable = function(){
     //  return util._isInApp7 || util._isAbove690
     // }

     nativeAppAdapter.isSignAvailable = function() {
         return !!(util._isInApp7 && nativeAppAdapter.getPot() && nativeAppAdapter.getSign())
     }

     ;
     (function() {
         var isArray = Array.isArray || function(arr) {
                 return arr instanceof Array
             }
             // 调用native接口，调起分享到微博、微信的弹出选框
             // 在这种情况下分享到微博或微信只用在页面中做一个按钮，点击这个按钮后由客户端从底部弹起遮罩层，在层中有具体分享到各个社交平台的按钮
             // see：http://wiki.babel.baidu.com/twiki/bin/view/Ps/Ns/ShareCost
         nativeAppAdapter.multiShare = function(optionsArr, doNotAutoShare) {
             var nativeUrl, nativeUrlArr = []
             if (!util._isInApp7) {
                 return null
             }
             // optionsArr is plain object, let it be an array
             optionsArr = util.toArray(optionsArr)
             if (!isArray(optionsArr)) {
                 util.throwErr()
                 return
             }
             // check loop
             optionsArr.some(function(e, i) {
                 var srcArr, formattedObj = {},
                     shareToCorrect = false,
                     title, contentType, pic
                     // weibo need add url to text(content)
                     , isSrcWeibo = false,
                     isSrcFriend = false,
                     contentOk = false
                     // src -> shareTo   value weibo -> sina_weibo friend -> weixin_friend weixin
                 if (e.hasOwnProperty('src')) {
                     if (e.src == 'weibo' || e.src == 'sina_weibo') {
                         formattedObj.shareTo = 'sina_weibo'
                         isSrcWeibo = true
                         shareToCorrect = true
                     } else if (e.src == 'friend' || e.src == 'weixin_friend') {
                         formattedObj.shareTo = 'weixin_friend'
                         isSrcFriend = true
                         shareToCorrect = true
                     } else if (e.src == 'weixin') {
                         formattedObj.shareTo = 'weixin'
                         shareToCorrect = true
                     }
                 }
                 if (!shareToCorrect) {
                     util.throwErr()
                     return true
                 }
                 // text -> content
                 if (e.hasOwnProperty('text')) {
                     formattedObj[isSrcFriend ? 'title' : 'content'] = e.text
                     contentOk = true
                 } else {
                     util.throwErr()
                     return true
                 }
                 // url
                 if (e.hasOwnProperty('url')) {
                     if (isSrcWeibo && contentOk) {
                         formattedObj.content += e.url
                     } else {
                         formattedObj.url = e.url
                     }
                 } else {
                     util.throwErr()
                     return true
                 }
                 // title
                 if (!isSrcFriend) {
                     if (e.hasOwnProperty('title')) {
                         title = e.title
                     } else {
                         title = '分享百度地图'
                     }
                     formattedObj.title = title
                 }
                 // contentType
                 if (e.hasOwnProperty('contentType') && e.contentType == 'media' && !isSrcWeibo) {
                     contentType = 'media' // 大图
                 } else {
                     contentType = 'text' // icon加文字
                 }
                 formattedObj.contentType = contentType
                     // pic -> imageSource
                     //  http://xxxxxxx.png 某个具体url
                     //  icon 百度地图的小图标
                     //  capture_screen 截图，目前客户端已至此，我们暂时用不上，前端js组件暂未支持
                 if (e.hasOwnProperty('pic') && /http:\/\/[A-Za-z0-9\.-]{3,}\.[A-Za-z]{3}/.test(e.pic)) {
                     pic = e.pic
                 } else {
                     pic = 'icon'
                 }
                 formattedObj.imageSource = pic

                 nativeUrlArr.push(formattedObj)
                 return false
             })

             if (nativeUrlArr.length) {
                 nativeUrl = 'bdapi://openSharePrompt?' + encodeURIComponent(JSON.stringify({
                         'shareList': nativeUrlArr
                     }))
                     // console.log(nativeUrl)
             }

             if (!doNotAutoShare) {
                 try {
                     location.replace(nativeUrl)
                 } catch (e) {}
             }

             return nativeUrl
         }

         nativeAppAdapter.smartShare = function(optionsArr, doNotAutoShare) {
             // 活动专区再进入一层达到的页面，ios可以调用native分享，安卓不行，短期内都是这种情况，故在引入了sinaWeiboShare组件的基础上，提供一个快捷方式
             // if(util._isIos && util._isInApp7){
             // 140709：经过测试安卓最新版客户端已经支持活动专区再进入一级后到达的二级页面的native分享
             var optionsArr = optionsArr;
             for (var i = 0; i < optionsArr.length; i++) {
                 optionsArr[i].url = _filterUrl(optionsArr[i].url);
             }
             if (util._isInApp7) {
                 return nativeAppAdapter.multiShare(optionsArr, doNotAutoShare);
             } else if (window.sinaWeiboShare && isArray(optionsArr)) {
                 optionsArr.forEach(function(e, i) {
                     if (e.hasOwnProperty('src') && (e.src == 'weibo' || e.src == 'sina_weibo')) {
                         return window.sinaWeiboShare[doNotAutoShare ? 'getUrl' : 'action'](e)
                     }
                 })
             }
             return null
         }

     })()

     // 获取所有querystring，不包括sign，兼容某些客户端版本有BUG，url中出现两个以上问号的情况
     nativeAppAdapter.getQs = function() {
         var urlQArr = location.href.split('?'),
             urlArr, urlArrWithoutSign = []
         urlQArr.shift()
         urlArr = urlQArr.join('&').split('&')
         urlArr.forEach(function(e, i) {
             if (e && e.split('=')[0] != 'sign') {
                 urlArrWithoutSign.push(e)
             }
         })

         return urlArrWithoutSign.join('&')
     }

     // 获取登录状态
     // 接口 see ：http://man.baidu.com/app/search/lbs-webapp/operation/odp/webroot/sign/#接口_用户登录状态检查
     nativeAppAdapter.getLoginStatus = function(callback) {
         var loginUrl,
             notLoggedObj
         if (util.isFunction(callback)) {
             loginUrl = (/android|webos|ip(hone|ad|od)|opera (mini|mobi|tablet)|iemobile|windows.+(phone|touch)|mobile|fennec|kindle (Fire)|Silk|maemo|blackberry|playbook|bb10\; (touch|kbd)|Symbian(OS)|Ubuntu Touch/i.test(navigator.userAgent) ? 'http://wappass.baidu.com/passport/?' : 'https://passport.baidu.com/v2/?login&') + (util._isAndroid2P3AndBelow ? '' : 'authsite=1&') + 'u=' + encodeURIComponent(location.href)
             notLoggedObj = {
                 err_no: 1,
                 loginUrl: loginUrl
             }
             util.jsonp('http://map.baidu.com/opn/service/checkuser?callback=?', function(data) {
                 // util.jsonp('http://i.map.baidu.com/api/page/integral/maininfo?callback=?',function(data){
                 // if(data.err_no == 0){
                 //  callback.call(nativeAppAdapter,data)
                 // }else{
                 // if(data.err_no == 0){
                 //  util.loginStatusToNative()
                 // }
                 data = data || notLoggedObj
                 data.loginUrl = loginUrl
                 callback.call(nativeAppAdapter, data)
                     // }
             }, function() {
                 callback.call(nativeAppAdapter, notLoggedObj)
             })
         }
         return nativeAppAdapter
     }

     // 登录成功后，将登录状态写入到客户端
     nativeAppAdapter.writeLoginStatusToNative = function() {
         var referrer = document.referrer
         if ((referrer.indexOf('wappass.baidu.com') != -1 || referrer.indexOf('passport.baidu.com') != -1) && (util._isInApp7 || navigator.userAgent.indexOf('baidumap_IPAD') != -1)) {
             try {
                 location.replace('bdapi://wappass_login.sync')
             } catch (e) {}
         }
     }

     // 140415，自动调用风险太大，改为手动调用，移除
     // ;(function(util){
     //  var referrer = document.referrer
     //  if((referrer.indexOf('wappass.baidu.com') != -1 || referrer.indexOf('passport.baidu.com') != -1) && util._isInApp7){
     //      setTimeout(function(){
     //          // 确保所有都加载完，否则页面跳转会截断所有请求，而使用img\script\iframe的形式，客户端都监听不到
     //          // 其实这样还是有请求被截断的风险
     //          window.addEventListener('load',function(){
     //              try{
     //                  location.replace('bdapi://wappass_login.sync')
     //              }catch(e){}
     //          },false)
     //      },5*1000)
     //  }
     // })(util)

     //

     util._isInWeixin = (function() {
         var ua = window.navigator.userAgent;
         var weixin = ua.match(/MicroMessenger/g);
         if (!!weixin) {
             var dom = document.querySelectorAll('.yyfm-adapter-weixin');
             for (var i = 0; i < dom.length; i++) {
                 dom[i].style.display = '';
             }
         }
         return !!weixin
     })();

     nativeAppAdapter.isInWeixin = function() {
         return util._isInWeixin;
     };

     //url过滤，目前过滤字段为BDUSS、cuid
     function _filterUrl(url) {
         var filterArr = ['BDUSS', 'cuid'];
         var filteredUrl = url;
         for (var i = 0; i < filterArr.length; i++) {
             var fliterKey = filterArr[i];
             var reg = new RegExp("[&]*" + fliterKey + "=([^&]*)", "g");
             filteredUrl = filteredUrl.replace(reg, '');
         }
         return filteredUrl
     };
     //微信内置分享按钮
     // nativeAppAdapter.weixinShare = function(opt) {
     //     var opt = opt;
     //     var timelineOpt, friendOpt;
     //     nativeAppAdapter.useWeixinShare = true;
     //     for (var i = 0; i < opt.length; i++) {
     //         opt[i].url = _filterUrl(opt[i].url);
     //         if (opt[i].src == 'friend' || opt[i].src == 'weixin_friend') {
     //             timelineOpt = opt[i];
     //         } else if (opt[i].src == 'weixin') {
     //             friendOpt = opt[i];
     //         }
     //     }
     //     nativeAppAdapter.shareFriend = function() {
     //         WeixinJSBridge.invoke("sendAppMessage", {
     //             "img_url": friendOpt.pic,
     //             "link": friendOpt.url,
     //             "desc": friendOpt.text,
     //             "title": friendOpt.title
     //         }, function(res) {
     //             switch (res.err_msg) {
     //                 // send_app_msg:cancel 用户取消
     //                 case 'send_app_msg:cancel':
     //                     friendOpt.cancel && friendOpt.cancel(res);
     //                     break;
     //                     // send_app_msg:confirm 发送成功
     //                 case 'send_app_msg:confirm':
     //                 case 'send_app_msg:ok':
     //                     friendOpt.confirm && friendOpt.confirm(res);
     //                     break;
     //                     // send_app_msg:fail　发送失败
     //                 case 'send_app_msg:fail':
     //                 default:
     //                     friendOpt.fail && friendOpt.fail(res);
     //                     break;
     //             }
     //             // 无论成功失败都会执行的回调
     //             friendOpt.all && friendOpt.all(res);
     //         });
     //     }
     //     nativeAppAdapter.shareTimeline = function() {
     //         WeixinJSBridge.invoke("shareTimeline", {
     //             "img_url": timelineOpt.pic,
     //             "link": timelineOpt.url,
     //             "title": timelineOpt.text,
     //             "desc": timelineOpt.text
     //         }, function(res) {
     //             switch (res.err_msg) {
     //                 // share_timeline:cancel 用户取消
     //                 case 'share_timeline:cancel':
     //                     timelineOpt.cancel && timelineOpt.cancel(res);
     //                     break;
     //                     // share_timeline:confirm 发送成功
     //                 case 'share_timeline:confirm':
     //                 case 'share_timeline:ok':
     //                     timelineOpt.confirm && timelineOpt.confirm(res);
     //                     break;
     //                     // share_timeline:fail　发送失败
     //                 case 'share_timeline:fail':
     //                 default:
     //                     timelineOpt.fail && timelineOpt.fail(res);
     //                     break;
     //             }
     //             // 无论成功失败都会执行的回调
     //             timelineOpt.all && timelineOpt.all(res);
     //         });
     //     }
     // }

     // document.addEventListener("WeixinJSBridgeReady", function onBridgeReady() {
     //     if (!nativeAppAdapter.useWeixinShare) return;
     //     WeixinJSBridge.on("menu:share:appmessage", function(argv) {
     //         nativeAppAdapter.shareFriend();
     //     });

     //     WeixinJSBridge.on("menu:share:timeline", function(argv) {
     //         nativeAppAdapter.shareTimeline();
     //     });
     // }, false);

    // xiaoyuze at 2015.2.10
     // 微信分享改为官方api

     ~(function (util, nativeAppAdapter) {

         // 微信api的参数
         var appId, timestamp, nonceStr, signature,
             // 分享内容选项
             timelineOpt, friendOpt, weiboOpt,
             weixinApiReady = false,
             // config失败，尝试次数
             tryConfigTime = 0,
             maxTryConfigTime = 5,
             weixinApiUrl = 'http://res.wx.qq.com/open/js/jweixin-1.0.0.js',
             // weixinApiUrl = 'http://cq01-rdqa-dev038.cq01.baidu.com:800/weixin/ticket?',
             jsApiList = [
                 // 所有要调用的 API 都要加到这个列表中
                 'onMenuShareTimeline', // 朋友圈
                 'onMenuShareAppMessage', // 分享好友
                 'onMenuShareWeibo',
             ],
             onLoadError = function () {},
             onInitError = function () {},
             onConfigError = function () {};

         /**
          * opt增加初始化失败回调，一共有三种情况：
          *     1： getScript拉weixinApi失败,onloadError
          *     2： getJsonp请求失败, onInitError
          *     3： config失败， onConfigError
          *
          */
         // 
         nativeAppAdapter.weixinShare = function (opt, callbackOptions) {
             // debugger
             // useWeixinShare = true;
             // if (!util._isInWeixin) return;
             // 过滤选项
             for (var i = 0; i < opt.length; i++) {
                 opt[i].url = _filterUrl(opt[i].url);
                 if (opt[i].src == 'friend' || opt[i].src == 'weixin_friend') {
                     timelineOpt = opt[i];
                 } else if (opt[i].src == 'weixin') {
                     friendOpt = opt[i];
                 } else if (opt[i].src == 'weibo') {
                     weiboOpt = opt[i];
                 }
             }

             callbackOptions = callbackOptions || {};

             callbackOptions.loadError && (onLoadError = callbackOptions.loadError);
             callbackOptions.initError && (onInitError = callbackOptions.initError);
             callbackOptions.configError && (onConfigError = callbackOptions.configError);

             // 先拉取weixinApi
             if ('wx' in window) {
                 if (weixinApiReady) {

                     setWeixinOptions();
                 } else {

                     initWeixinApi(setWeixinOptions);
                 }
             } else {

                 getScript(weixinApiUrl, function () {
                     // alert("script ready");
                     initWeixinApi(setWeixinOptions);
                 }, onLoadError);
             }
         };


         function initWeixinApi(callback) {
             // alert('try config');
             // 然后拉取token
             // getJsonp('http://172.22.97.126/weixin/sample/php/test.php?url=' + location.href.split('#')[0] + '&callback=?', function (data) {
             getJsonp('http://zt.baidu.com/weixin/ticket?url=' + encodeURIComponent(location.href.split('#')[0]) + '&callback=?', function (data) {
                     // getJsonp('http://cq01-rdqa-dev038.cq01.baidu.com:8003/weixin/ticket?url=' + encodeURIComponent(location.href.split('#')[0]) + '&callback=?', function (data) {
                     if (data && data.errno === 0) {
                         appId = data.data.appId;
                         timestamp = data.data.timestamp;
                         nonceStr = data.data.nonceStr;
                         signature = data.data.signature;
                         // console.log(data.data);
                         // alert(JSON.stringify(data.data));
                         wx.config({
                             debug: false,
                             appId: data.data.appId,
                             timestamp: data.data.timestamp,
                             nonceStr: data.data.nonceStr,
                             signature: data.data.signature,
                             jsApiList: jsApiList
                         });

                         // config验证通过后，会执行wx.ready，将验证通过标识放入回调
                         // weixinApiReady = true;

                         callback && callback();
                     }
                 },
                 // error callback
                 onInitError);
         }

         function setWeixinOptions() {

             wx.ready(configSucceedCB);
             wx.error(configFailedCB);
         }

         function configSucceedCB() {
             // alert("config succeed");
             // 验证通过标识  
             weixinApiReady = true;

             // alert("initoption");
             // 朋友圈
             wx.onMenuShareTimeline({
                 title: timelineOpt.text, // 分享标题
                 link: timelineOpt.url, // 分享链接
                 imgUrl: timelineOpt.pic, // 分享图标
                 success: function () {
                     // 用户确认分享后执行的回调函数
                     timelineOpt.confirm && timelineOpt.confirm();
                 },
                 cancel: function () {
                     // 用户取消分享后执行的回调函数
                     timelineOpt.cancel && timelineOpt.cancel();
                 }
             });

             // 好友
             wx.onMenuShareAppMessage({
                 title: friendOpt.title, // 分享标题
                 desc: friendOpt.text, // 分享描述
                 link: friendOpt.url, // 分享链接
                 imgUrl: friendOpt.pic, // 分享图标
                 type: 'link', // 分享类型,music、video或link，不填默认为link
                 dataUrl: '', // 如果type是music或video，则要提供数据链接，默认为空
                 success: function () {
                     // 用户确认分享后执行的回调函数
                     friendOpt.confirm && friendOpt.confirm();
                 },
                 cancel: function () {
                     // 用户取消分享后执行的回调函数
                     friendOpt.cancel && friendOpt.cancel();
                 }
             });

             // 微博
             wx.onMenuShareWeibo({
                 title: '', // 分享标题
                 desc: weiboOpt.text, // 分享描述
                 link: weiboOpt.url, // 分享链接
                 imgUrl: weiboOpt.pic, // 分享图标
                 success: function () {
                     // 用户确认分享后执行的回调函数
                     weiboOpt.confirm && weiboOpt.confirm();
                 },
                 cancel: function () {
                     // 用户取消分享后执行的回调函数
                     weiboOpt.cancel && weiboOpt.cancel();
                 }
             });
         }

         function configFailedCB() {

             tryConfigTime++;
             // alert('config failed for time ' + tryConfigTime);
             if (tryConfigTime > maxTryConfigTime) {
                 tryConfigTime = 0;
                 onConfigError && onConfigError();
                 return;
             }

             initWeixinApi(setWeixinOptions);
         }


         function getJsonp(url, callback, onError) {
             var time = 0,
                 maxTime = 5,
                 timeoutTimer;

             function _call() {
                 // alert('get jsonp try for ' + time);
                 util.jsonp(url, function (data) {
                     clearTimeout(timeoutTimer);
                     callback(data);
                 }, errorCallback);

                 timeoutTimer = setTimeout(errorCallback, 5000);
             }

             function errorCallback() {
                 // alert('error');
                 clearTimeout(timeoutTimer);
                 time++;
                 if (time > maxTime) {
                     onError && onError();
                     time = 0;
                     return;
                 }

                 setTimeout(function () {
                     _call();
                 }, 1000);
             }
             _call();
         }

         function getScript(url, callback, onError, maxTime) {

             var time = 0,
                 timeoutTimer;

             maxTime = maxTime || 5;

             function _call() {
                 time++;
                 // alert('try times : ' + time);
                 // console.log('call time:' + time);
                 var script = document.createElement('script');

                 var errorCallback = (function (t) {
                         return function () {
                             clearTimeout(timeoutTimer);
                             // console.log('error time ' + t);
                             // debugger
                             if (t > maxTime) {
                                 util.isFunction(onError) && onError();
                                 t = 0;
                                 _clear(script, loadCallback, errorCallback);
                                 return;
                             }

                             _clear(script, loadCallback, errorCallback);

                             setTimeout(function () {
                                 _call();
                             }, 1000);
                         };
                     })(time),

                     loadCallback = function () {
                         // console.log('succeed');
                         clearTimeout(timeoutTimer);
                         util.isFunction(callback) && callback();
                         _clear(script, loadCallback, errorCallback);
                     };


                 script.addEventListener("load", loadCallback);
                 script.addEventListener("error", errorCallback);

                 script.setAttribute('src', url + '?v=' + time);
                 // script.setAttribute('id', 'testId' + time);
                 document.body.appendChild(script);

                 // 增加了一个5秒过期时间
                 timeoutTimer = setTimeout(errorCallback, 5000);
                 // console.log('append ' + time);
                 // debugger

             }

             _call();

             function _clear(script, loadCallback, errorCallback) {
                 script.removeEventListener("load", loadCallback);
                 script.removeEventListener("error", errorCallback);
                 script.parentNode.removeChild(script);
             }
         }

         nativeAppAdapter.getScript = getScript;

     })(util, nativeAppAdapter);

     // add by Xiaoyuze 2015.1.7
     ;
     (function(util) {

         // 解析url参数
         util.parseUrl = function() {
             var oldUrl, uri;
             return (function() {
                 if (window.location.href != oldUrl) {
                     oldUrl = window.location.href;
                     uri = _parseUrl(oldUrl);
                 }
                 return uri;
             })();
         }

         function _parseUrl(url) {
             var url_array = url.match(/^(?:([A-Za-z]+):)?(\/{0,3})([0-9.\-A-Za-z]+)(?::(\d+))?(?:\/([^?#]*))?(?:\?([^#]*))?(?:#(.*))?$/);

             if (!url_array) return null;

             var uri = {
                 'href': url_array['0'],
                 'protocol': url_array['1'],
                 'slash': url_array['2'],
                 'host': url_array['3'],
                 'port': url_array['4'],
                 'path_name': url_array['5'],
                 'query': parse_query(url_array['6']),
                 'hash': url_array['7']
             }

             function parse_query(query) {
                 var _cache,
                     res = {};

                 if (query) {

                     var querys = query.split("&");

                     querys.forEach(function(query, index) {
                         _cache = query.split("=");
                         res[_cache[0]] = decodeURIComponent(_cache[1]);
                     });
                 }

                 return res;
             }
             return uri;
         }

     })(util);


     // 获取客户端链接基本参数，包括cuid,sv,city,loc_x,loc_y,mb,net,os
     nativeAppAdapter.initParam = function(needParam, callback, failed, timeout) {
        var loc, os,
        uri = util.parseUrl(),
        data = {
            cuid: '',
            version: '',
            city: '',
            loc_x: '',
            loc_y: '',
            mb: '',
            net: '',
            // 操作系统，ios/android
            os: '',
            // 操作系统版本ios:8.1.x/7.x.x    android: xx
            ov: ''
        };

        timeout = timeout || 5;

        needParam = needParam.split(" ");

         for (var i in data) {
             switch (i) {
                 case 'cuid':
                     data.cuid = uri.query.cuid || '';
                     break;
                 case 'version':
                     data.version = uri.query.sv || '';
                     break;
                 case 'city':
                     data.city = uri.query.c || uri.query.city || '';
                     break;
                 case 'loc_x':
                     loc = _parseLoc(uri.query.loc);
                     data.loc_x = loc.loc_x;
                     data.loc_y = loc.loc_y;
                     break;
                     // case 'loc_y':
                     //     if (!loc) loc = _parseLoc(uri.query.loc);

                     //     break;
                 case 'mb':
                     data.mb = uri.query.mb || '';
                     break;
                 case 'net':
                     data.net = uri.query.net || '';
                     break;
                 case 'os':
                     os = _parseOs(uri.query.os);
                     data.os = os.os;
                     data.ov = os.ov;
                     break;
             }
         }

         var isParamReady = (function() {

             for (var i = 0, l = needParam.length; i < l; i++) {
                 if (!(needParam[i] in data && data[needParam[i]])) return false;
             }
             return true;
         })();

         if (isParamReady) {
             return util.isFunction(callback) && callback(data);
         }

         var timer = setTimeout(function() {
             util.isFunction(failed) && failed();
         }, timeout * 1000);

         window.setInfo = function(infoData) {
             // alert(infoData)
             clearTimeout(timer);

             infoData = infoData.replace(/\'/g, '"');

             infoData = JSON.parse(infoData);
             for (var i in data) {
                 if (!data[i]) {
                     switch (i) {
                         case 'cuid':
                             data.cuid = infoData.cuid;
                             break;
                         case 'version':
                             data.version = infoData.sv;
                             break;
                         case 'city':
                             data.city = infoData.c;
                             break;
                         case 'loc_x':
                             data.loc_x = infoData.loc_x;
                             break;
                         case 'loc_y':
                             data.loc_y = infoData.loc_y;
                             break;
                         case 'mb':
                             data.mb = infoData.mb;
                             break;
                         case 'net':
                             data.net = infoData.net;
                             break;
                         case 'os':
                             data.os = infoData.os;
                             break;
                         case 'ov':
                             data.ov = infoData.ov;
                             break;
                     }
                 }
             }
             util.isFunction(callback) && callback(data);
         }

         function _parseLoc(loc) {
             var out = {
                 loc_x: '',
                 loc_y: ''
             }

             if (!loc) return out;

             loc = loc.replace(/\(|\)/g, '').split(',');
             out.loc_x = loc[0];
             out.loc_y = loc[1];

             return out;
         }

         function _parseOs(os) {
             var out = {
                 os: '',
                 ov: ''
             }

             if (!os) return out;

             os = os.match(/([a-z]+)([\d\.]*)/i);

             if (os) {
                 out.os = os[1];
                 out.ov = os[2];
             }
             return out;
         }
     }

     nativeAppAdapter.parseUrl = util.parseUrl;

     window.nativeAppAdapter = nativeAppAdapter

 })(window, document, navigator, location)
