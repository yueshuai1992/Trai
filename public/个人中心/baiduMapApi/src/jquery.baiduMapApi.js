/**
 *  Author: Xiaoyuze88
 *  Contact: xiaoyuze88@gmail.com
 *  Description: An jQuery pluggin let baidu map api more easier to use.
 *  GitHub link: https://github.com/xiaoyuze88/jQuery.baiduMapApi
 *  License: MIT
 *  Version: 0.10
 *  Update date: 5/15/2015
 *
 */
+(function (factory) {
    if (typeof define === "function" && define.amd) {
        return define(['jquery'], factory);
    }
    else {
        return factory($);
    }
})(function ($) {
    'use strict';


    function BDMapApi(element, options) {
        if (!'BMap' in window) throw new Error('Need to load baidu map first!');

        var $element = $(element);

        this._position = {};

        this._filtOption(options);
        this.base = new BMap.Map(element);
        this._currentPoint = null;
        this._init();
    }

    BDMapApi.prototype = {
        version: '0.10',

        _filtOption: function (options) {

            // 当无center输入，或者center非法，调用geolocation，失败使用默认
            // 有center且合法，覆盖
            if (options.center) {

                if (typeof options.center === 'object') {
                    options.center.lat = +options.center.lat;
                    options.center.lng = +options.center.lng;
                    // 有center，但非法
                    if (!(options.center.lat || options.center.lng)) {
                        options.center = false;
                    }
                }
                // 如果是字符串，仅支持"lat,lng"的格式
                else if (typeof options.center === 'string') {
                    var center = options.center.split(',');
                    if (center.length >= 2) {
                        center.splice(0, 2);

                        center[0] = +center[0];
                        center[1] = +center[1];

                        if (center[0] && center[1]) {
                            options.center = {
                                lat: center[0],
                                lng: center[1]
                            };
                        }
                        else {
                            options.center = false;
                        }
                    }
                }

            }
            // 也就是merge进来的center，只要是obejct都合法

            this.options = $.extend({}, BDMapApi.DEFAULT_OPTION, options);
        },
        _init: function () {

            var that = this;

            if (typeof this.options.center === 'object') {

                _initMap(that.base, that.options.center, that.options.zoom);
            }
            // 
            else {
                // 尝试geolocation,成功使用，失败使用默认
                _getGeolocation(function (position) {
                    that.options.center.lat = position.latitude;
                    that.options.center.lng = position.longitude;
                    // debugger
                    _initMap(that.base, that.options.center, that.options.zoom);
                }, function (err) {

                    that.options.center = {
                        lat: BDMapApi.DEFAULT_POSITION.lat,
                        lng: BDMapApi.DEFAULT_POSITION.lng
                    };

                    // 使用北京天安门坐标
                    _initMap(that.base, that.options.center, that.options.zoom);

                });
            }
            // 可能是一个地址
            // else if (typeof this.options.center === 'string') {
            //     _initMap(that.base, that.options.center, that.options.zoom);
            // }
            // else 
        }
    };

    BDMapApi.prototype.Constructor = BDMapApi;

    BDMapApi.DEFAULT_POSITION = {
        lat: 39.542637,
        lng: 116.232922
    };

    BDMapApi.DEFAULT_OPTION = {
        center: false,
        /**
         *  需要初始化的控件
         */
        controller: {
            // 平移缩放控件,默认开启
            navigation: true,
            // 缩略地图控件
            overview: false,
            // 比例控件
            scale: false,
            // 切换地图类型
            MapTypeControl: false,
            // 切换全景地图控件
            PanoramaControl: false
        },
        styles: false,
        zoom: 13,
        control: true,
        timeout: 3000,
        disableDoubleClickZoom: false
    };



    // BMap helper
    // #################

    function _initMap(map, position, zoom) {
        if (map instanceof BMap.Map) {

            var desc = typeof position === 'string' ? position : _makePoint(position);
            map.centerAndZoom(desc, zoom);
        }
        else {
            console.error('传入的不是Map实例！');
        }
    }

    function _makePoint(position) {
        if (position) {

            // turn to number
            position.lng = +position.lng;
            position.lat = +position.lat;

            if (position.lng && position.lat) {
                return new BMap.Point(position.lng, position.lat);
            }
        }
        return false;
    }


    // Functional helper
    // #################

    // This could be slow
    function _getGeolocation(success, error) {
        if (!'geolocation' in navigator) {
            return;
        }

        navigator.geolocation.getCurrentPosition(function (position) {
            success && success(position.coords);
        }, function (err) {
            error && error(err);
        }, {
            'maximumAge': 600000,
            'timeout': 10000,
            'enableHighAccuracy': false
        });
    }

    function toArray(arrayLikeObject) {
        if ([].slice) {
            return [].slice.call(arrayLikeObject);
        }
        else {
            throw new Error('Do not support Array.prototype.slice method!');
        }
    }



    // JQuery pluggin setting
    // ######################

    function Pluggin(option) {

        var options = typeof option === 'object' && option;

        var args, methodName;

        // call for a function
        if (typeof option === 'string') {

            args = utils.toArray(arguments);
            methodName = args.splice(0, 1).toString();
        }

        return this.each(function () {
            var $this = $(this);
            var data = $this.data('bdmap');


            if (!data) {
                // debugger
                $this.data('bdmap', (data = new BDMapApi(this, options)));
            }

            // call for a function
            if (methodName) {

                if (data[methodName] && typeof data[methodName] === 'function') {
                    data[methodName].apply(data, args);
                }
            }
        });
    }

    var old = $.fn.bdmap = Pluggin;
    $.fn.bdmap.Constructor = BDMapApi;

    //NO CONFLICT
    $.fn.bdmap.noConflict = function () {
        $.fn.bdmap = old;
        return this;
    };
});