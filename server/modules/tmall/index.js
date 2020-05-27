module.exports = function(controlPage) {
    var moment = require('moment');
    var isBuyNowing = false;
    var isMiaoing = false;
    var endTime;
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
            var userName = document.querySelector('input[name=TPL_username]');
            userName.focus();
            userName.value = 'xxx';

            var password = document.querySelector('input[name=TPL_password]');
            password.focus();
            password.value = 'xxx';
        });

        checkCaptcha();
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
        endTime = moment().add(2, 'seconds');
        isMiaoing = true;
        that.page.reload();
    }

    var onOrderPageFinished = function() {
        if(isMiaoing) {
            if('expectedPrice' in that.request) {//check price
                that.waitFor(function () {
                    return that.page.evaluate(function () {
                        var priceElem = Zepto('.order-item .main-price');
                        if (priceElem.length <= 0) return false;
                        return true;
                    });
                }, function () {
                    var price = that.page.evaluate(function () {
                        return parseInt(Zepto('.order-item .main-price').text());
                    });
                    that.condLog('Current price is ' + price);
                    if (price * 100 <= that.request.expectedPrice) {
                        console.log(that.request.expectedPrice);
                        that.condLog('Price matched. Submitting order...');
                        buy();
                    } else if (moment() < endTime) {
                        that.page.reload();
                    }
                }, function (){
                    that.page.reload();
                }, 2000);
            } else {//do not check price
                buy();
            }
            return;
        }
        if(that.request.startDate) {
            var seconds = moment(that.request.startDate).diff(moment(), 'seconds') - 1;
            if(seconds > 0) {
                setTimeout(miaoBuy, seconds*1000);
                return;
            }
        }
        buy();
    };

    var buy = function() {
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
                if(isMiaoing) that.page.reload();
            },
            isMiaoing? 1000: 5000
        );
    };

    var submitLogin = function() {
        that.page.evaluate(function () {//console.log("Clicking login submit button");
            document.querySelector('input[type=submit]').click();
        });
    };

    var onPayPageLoaded = function() {
        if(that.request.isPay){
            that.page.injectJs('simulator.js');
            that.page.evaluate(function(){
                var spwd = document.querySelector('#spwd_unencrypt');
                simulator.click(spwd);
                spwd.value = '731248';
                simulator.input(spwd);
                simulator.click(document.querySelector('.J-button-submit'));
            });
        }
    };

    var onPageCreated = function() {
        that.page.onLoadFinished = function () {
            if(that.config.log) {
                that.log("onLoadFinished:" + that.page.url);
                that.render('load-finished.png');
            }
            if (that.page.url.indexOf('http://h5.m.taobao.com/awp/core/detail.htm') == 0) {
                if(!isBuyNowing) buyNow();
            } else if (that.page.url.indexOf('https://buy.m.tmall.com/order/confirmOrderWap.htm') == 0) {
                that.page.injectJs('simulator.js');
                onOrderPageFinished();
            } else if (that.page.url.indexOf('https://login.m.taobao.com/login.htm') == 0) {
                that.condLog("login page shown.");
                login();
            } else if(that.page.url.indexOf('http://mclient.alipay.com/w/trade_pay.do') == 0){
                //that.send('back', ['success']);
                onPayPageLoaded();
            }
        };

        isMiaoing = false;
        var itemUrl = 'https://buy.m.tmall.com/order/confirmOrderWap.htm?&quantity=1&itemId=' + that.request.params.itemId + '&buyNow=true';
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
    };

    that.onPageCreated = onPageCreated;
    that.onCaptcha = onCaptcha;

    return that;
};
