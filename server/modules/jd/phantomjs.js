module.exports = function(controlPage) {
    var moment = require('moment');
    var isBuyNowing = false;
    var isMiaoing = false;
    var endTime;
    var captchaImgSelector = 'img#imgCode';
    var that = require('../../lib/BaseBuyer')(controlPage, 'jd');

    var onPageCreated = function(){
        that.page.onLoadFinished = function (){
            if(that.config.log) {
                that.log("onLoadFinished:" + that.page.url);
                that.render('load-finished.png');
            }

            if (that.page.url.indexOf('http://item.m.jd.com/ware/view.action') == 0 || that.page.url.indexOf('http://item.m.jd.com/product/') == 0) {
                if(!isBuyNowing) buyNow();
            } else if (that.page.url.indexOf('http://p.m.jd.com/norder/order.action') == 0) {
                onOrderPageFinished();
            } else if (that.page.url.indexOf('https://plogin.m.jd.com/user/login.action') == 0){
                login();
            }else if(that.page.url.indexOf('https://pay.m.jd.com/pay/index.html')==0){
                that.finished();
            }
        };

        isMiaoing = false;
        var itemUrl = 'http://p.m.jd.com/norder/order.action?wareId=' + this.request.params.itemId + '&enterOrder=true';
        that.condLog('loading ' + itemUrl);
        that.page.open(itemUrl);
    };

    var sendCaptchaImage = function(){
        that.page.clipRect = that.page.evaluate(function (){
            return document.querySelector(captchaImgSelector).getBoundingClientRect();
        });

        //that.send('back', ['captcha', that.page.renderBase64('jpg'), that.sessionId]);
        that.emit('captcha', that.page.renderBase64('jpg'));
        that.condLog('Captcha sent');
        that.page.clipRect = { left:0, top:0, width:0, height:0 };
    };

    var login = function(){
        that.page.evaluate(function(config){
            Zepto('input.txt-username').val(config.username).trigger('input');
            Zepto('input.txt-password').val(config.password).trigger('input');
        }, that.config);
        that.condLog('finished user name and password input');

        checkCaptcha();
        //sendCaptchaImage();
    };

    var isBuyNowButtonReady = function() {
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
        this.page.evaluate(function () {console.log('Clicking buy now button');
            Zepto('.buy-now').click();
        });
    };

    var isSubmitEnabled = function(){
         return this.page.evaluate(function(){
            if(Zepto('.J_submit').attr('disabled')){
                return false;
            } else {
                return true;
            }
        });
    };

    var submitOrder = function() {
        that.condRender('before_submit_order.png');
        that.page.evaluate(function () {
            var submitBtn = Zepto('#pay-bar .payb-btn').click();//console.log(submitBtn.html());
        });
    };

    var miaoBuy = function(){
        endTime = moment().add(2, 'seconds');
        isMiaoing = true;
        that.page.reload();
    };

    var onOrderPageFinished = function() {
        if(isMiaoing) {
            var price = that.page.evaluate(function(){
                return parseInt(Zepto('#yunfeeList .sitem-r').text().replace('.', ''));
            });
            that.condLog('Current price is '+price/100);
            if(price <= that.request.expectedPrice) {
                that.condLog('Price matched. Submitting order...');
                submitOrder();
            }
            else if(moment() < endTime){
                that.page.reload();
            } else {
                that.condLog('miao failed');
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
        submitOrder();
    };

    var checkCaptcha = function(){
        that.waitFor(
            function(){
                return that.page.evaluate(function (){
                    var captchaImg = document.querySelector(captchaImgSelector);//console.log('standardCode:'+ standardCode.src);
                    if(captchaImg == null) return false;
                    var isVisible = (captchaImg.offsetWidth > 0 || captchaImg.offsetHeight > 0);
                    return isVisible && (captchaImg.src.indexOf('/cgi-bin/m/authcode?mod=login') >= 0);
                });
            },
            function(){
                sendCaptchaImage();
            },
            function(){
                submitLogin();
            },
            2000
        );
    };

    var submitLogin = function(){
        that.condRender('before-submit-login.png');
        that.page.evaluate(function () {
            Zepto('a.btn-login').click();
        });
        that.condLog('Clicked the login button');
    };

    var onCaptcha = function(data){
        that.condLog('received captcha code:' + data);

        that.page.evaluate(function(code){
            Zepto('input.txt-captcha').val(code).trigger('input');
        }, data);

        submitLogin();
    };

    that.onPageCreated = onPageCreated;
    that.onCaptcha = onCaptcha;

    return that;
}
