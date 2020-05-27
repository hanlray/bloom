module.exports = function (browser, logger, io) {
    var moment = require('moment');
    var isBuyNowing = false;
    var isMiaoing = false;
    var endTime;
    var captchaImgSelector = 'img#imgCode';

    var that = require('../../lib/BaseAgent')(browser, logger, 'jd', io);

    var onPageCreated = function () {
        that.page.on('load', () => {
            if (that.config.log) {
                that.log("onLoadFinished:" + that.page.url);
                that.render('load-finished.png');
            }

            if (that.page.url().indexOf('https://item.m.jd.com/ware/view.action') == 0 || that.page.url().indexOf('https://item.m.jd.com/product/') == 0) {
                if (!isBuyNowing) buyNow();
            } else if (that.page.url().indexOf('https://p.m.jd.com/norder/order.action') == 0) {
                confirmOrder();
            } else if(that.page.url().indexOf('https://p.m.jd.com/norder/freeRegister.action') == 0){
                onfreeRegisterPage();
            } else if (that.page.url().indexOf('https://plogin.m.jd.com/user/login.action') == 0) {
                login();
            } else if (that.page.url().indexOf('https://pay.m.jd.com/cpay/pay-index.html') == 0) {
                logger.log('info', 'We are in the pay page');
                that.finished();
            }
        });

        isMiaoing = false;
        var itemUrl = 'https://p.m.jd.com/norder/order.action?wareId=' + that.request.skuId + '&enterOrder=true';
        logger.log('info', 'loading ' + itemUrl);
        that.page.goto(itemUrl);
    };

    var onfreeRegisterPage = async function(){
        logger.log('info', 'We are on freeRegister page now');
        await that.condScreenshot('freeRegister.png');

        //await that.page.waitFor(10000);
        //await that.condScreenshot('clicked_qudenglu_button.png');

        that.page.click('#gologinBtn');
        logger.log('info', 'clicked 去登录 button');
    }

    var sendCaptchaImage = function () {
        that.page.clipRect = that.page.evaluate(function () {
            return document.querySelector(captchaImgSelector).getBoundingClientRect();
        });

        //that.send('back', ['captcha', that.page.renderBase64('jpg'), that.sessionId]);
        that.emit('captcha', that.page.renderBase64('jpg'));
        that.condLog('Captcha sent');
        that.page.clipRect = { left: 0, top: 0, width: 0, height: 0 };
    };

    var login = async function () {
        logger.log('info', 'We are on login page now');
        that.condScreenshot('login.png');

        await that.page.type('#username', that.config.username, { delay: 100 });
        await that.page.type('#password', that.config.password, { delay: 100 });

        logger.log('info', 'finished inputting user name and password');

        checkCaptcha();
    };

    var isBuyNowButtonReady = function () {
        return that.page.evaluate(function () {
            if (Zepto('.buy-now').length == 0) {
                return false;
            }
            return true;
        });
    };

    var buyNow = function () {
        if (!isBuyNowButtonReady()) return;
        isBuyNowing = true;
        this.page.evaluate(function () {
            console.log('Clicking buy now button');
            Zepto('.buy-now').click();
        });
    };

    var isSubmitEnabled = function () {
        return this.page.evaluate(function () {
            if (Zepto('.J_submit').attr('disabled')) {
                return false;
            } else {
                return true;
            }
        });
    };

    var submitOrder = function () {
        that.page.click('#btnPayOnLine a');
        logger.log('info', '在线支付 button pressed');
    };

    var miaoBuy = function () {
        endTime = moment().add(2, 'seconds');
        isMiaoing = true;
        that.page.reload();
    };

    var confirmOrder = function () {
        logger.log('info', 'we are in the confirm order page');
        if (isMiaoing) {
            var price = that.page.$eval('#pageTotalPrice', el => {
                return parseInt(el.textContent.replace('.', ''));
            });
            that.condLog('Current price is ' + price / 100);
            if (price <= that.request.expectedPrice) {
                that.condLog('Price matched. Submitting order...');
                submitOrder();
            }
            else if (moment() < endTime) {
                that.page.reload();
            } else {
                that.condLog('miao failed');
            }
            return;
        }
        if (that.request.startDate) {
            var seconds = moment(that.request.startDate).diff(moment(), 'seconds') - 1;
            if (seconds > 0) {
                setTimeout(miaoBuy, seconds * 1000);
                return;
            }
        }
        submitOrder();
    };

    var checkCaptcha = async function () {
        try {
            await that.page.waitForFunction(
                function () {
                    return that.page.evaluate(function () {
                        var captchaImg = document.querySelector(captchaImgSelector);//console.log('standardCode:'+ standardCode.src);
                        if (captchaImg == null) return false;
                        var isVisible = (captchaImg.offsetWidth > 0 || captchaImg.offsetHeight > 0);
                        return isVisible && (captchaImg.src.indexOf('/cgi-bin/m/authcode?mod=login') >= 0);
                    });
                },
                {
                    polling: 500,
                    timeout: 3000
                }
            );
            sendCaptchaImage();
        } catch (err) {//timeout and captcha not show
            submitLogin();
        }
    };

    var submitLogin = function () {
        //that.condRender('before-submit-login.png');
        that.page.click('#loginBtn');
        logger.log('info', 'Clicked the login button');
    };

    var onCaptcha = function (data) {
        that.condLog('received captcha code:' + data);

        that.page.evaluate(function (code) {
            Zepto('input.txt-captcha').val(code).trigger('input');
        }, data);

        submitLogin();
    };

    that.onPageCreated = onPageCreated;
    that.onCaptcha = onCaptcha;

    return that;
}
