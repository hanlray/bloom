module.exports = function(controlPage) {
    var moment = require('moment');
    var isBuyNowing = false;
    var endTime;
    var isMiaoing = false;
    var that = require('../../lib/BaseBuyer')(controlPage, 'tmall');

    var sendCaptchaImage = function() {
        that.page.clipRect = that.page.evaluate(function () {
            return document.querySelector('#J_StandardCode').getBoundingClientRect();
        });
        setTimeout(function(){//wait some seconds to load the captcha image and for the overlay to disappear
            that.condLog('Sending captcha screenshot to client');
            that.send('back', ['captcha', that.page.renderBase64('jpg'), that.sessionId]);
            that.page.clipRect = { left:0, top:0, width:0, height:0 };
        }, 5000);
    };

    var login = function() {
        that.page.evaluate(function () {
            var userName = document.querySelector('input[name=username]');
            userName.focus();
            userName.value = 'xxx';

            var password = document.querySelector('input[name=password]');
            password.focus();
            password.value = 'xxx';
        });

        //checkCaptcha();
        submitLogin();
    };

    var checkCaptcha = function(){
        that.condLog('checking if captach show');
        that.waitFor(
            function () {
                return that.page.evaluate(function () {
                    var standardCode = document.querySelector('#J_StandardCode');//console.log('standardCode:'+ standardCode.src);
                    if(standardCode == null) return false;
                    var isVisible = (standardCode.offsetWidth > 0 || standardCode.offsetHeight > 0);
                    return isVisible && (standardCode.src.indexOf('http://pin.aliyun.com/get_img') == 0 ||
                        standardCode.src.indexOf('https://pin.aliyun.com/get_img') == 0);
                });
            },
            function () {
                sendCaptchaImage();
            },
            function () {
                that.condLog('captcha did not show, trying to submit');
                submitLogin();
            },
            2000
        );
    };

    var isBuyNowButtonReady = function(){
        return that.page.evaluate(function () {
            if(Zepto('.buy-now').length == 0) {
                return false;
            }
            return true;
        });
    };

    var buyNow = function(){
        if(!isBuyNowButtonReady()) return;
        isBuyNowing = true;
        that.page.evaluate(function () {//console.log('Clicking buy now button');
            Zepto('.buy-now').click();
        });
    };

    var isSubmitEnabled = function() {
        return that.page.evaluate(function(){
            if(Zepto('.J_submit').attr('disabled')){
                return false;
            } else {
                return true;
            }
        });
    };

    var miaoBuy = function() {
        endTime = moment().add(10, 'seconds');
        isMiaoing = true;

        function tryBuy() {

        }
        that.page.reload(tryBuy);
    };

    var submitOrder = function() {
        that.condRender('before_submit_order.png');
        that.page.evaluate(function () {
            var submitBtn = Zepto('#pay-bar .payb-btn').click();//console.log(submitBtn.html());
        });
    };

    var order = function() {
        if(that.request.startDate) {
            var seconds = moment(that.request.startDate).diff(moment(), 'seconds') - 1;
            if(seconds > 0) setTimeout(miaoBuy, seconds*1000);
            else buy();
        } else {
            buy();
        }
    };

    var buy = function() {
        that.waitFor(
            function() {
                return that.page.evaluate(function () {
                    var submitBtn = Zepto('.buy_cart .go_tmall');//console.log(submitBtn.html());
                    if(!submitBtn.hasClass('over'))
                        return true;
                    return false;
                });
            },
            function(){
                that.condRender('before_submit_order.png');
                that.page.evaluate(function(){//console.log('Clicking submit order button');
                    Zepto('.buy_cart .go_tmall').click();
                });
            },
            function(){
                that.condLog('submit order button not shown.');
                if(moment() < endTime) {
                    that.page.reload(tryBuy);
                } else {
                    that.condLog('miao failed');
                }
            },
            2000
        );

        that.waitFor(
            function() {
                return that.page.evaluate(function () {
                    var submitBtn = Zepto('#submitOrder_1 .action');//console.log(submitBtn.html());
                    if(submitBtn.length > 0)
                        return true;
                    return false;
                });
            },
            function(){
                that.condRender('before_submit_order.png');
                that.page.evaluate(function(){console.log('Clicking submit order button');
                    var submitBtn = document.querySelector('#submitOrder_1 .action');
                    simulator.tap(submitBtn);
                });
            },
            function(){
                //console.log('submit order button not shown.');
                that.condRender('order_page_timeout.png');
            },
            5000
        );
    };

    var submitLogin = function() {
        that.page.evaluate(function () {//console.log("Clicking login submit button");
            Zepto('#btn_login').click();
        });
    }

    var onPageCreated = function() {
        that.page.onLoadFinished = function () {
            if(that.config.log) {
                that.log("onLoadFinished:" + that.page.url);
                that.render('load-finished.png');
            }
            if (that.page.url.indexOf('http://m.juanpi.com/shop/') == 0) {
                buy();
            } else if (that.page.url.indexOf('https://buy.m.tmall.com/order/confirmOrderWap.htm') == 0) {
                that.page.injectJs('simulator.js');
                order();
            } else if (that.page.url.indexOf('http://m.juanpi.com/user/login') == 0) {
                that.condLog("login page shown.");
                login();
            } else if(that.page.url.indexOf('http://mclient.alipay.com/w/trade_pay.do') == 0){
                that.send('back', ['success']);
            }
        };

        isMiaoing = false;

        var itemUrl = 'http://m.juanpi.com/shop/' + this.request.params.itemId;
        if(that.request.params.skuId) {
            itemUrl += '&skuId=' + that.request.params.skuId;
        }
        that.condLog("Loading item page:" + itemUrl);
        that.page.open(itemUrl);
    };

    var onCaptcha = function(data) {
        that.condLog('received captcha code:'+ data);
        that.page.evaluate(function(code){
            var checkCode = document.querySelector('input[name=TPL_checkcode]');
            checkCode.focus();//console.log('data:'+code);
            checkCode.value = code;
        }, data);
        submitLogin();
    }

    that.onPageCreated = onPageCreated;
    that.onCaptcha = onCaptcha;

    return that;
};
