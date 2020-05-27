module.exports = function (browser, logger, module, io) {
    var moment = require('moment');
    var isBuyNowing = false;
    var isMiaoing = false;
    var endTime;
    var captchaImgSelector = 'img#imgCode';

    var that = require('./BaseAgent')(browser, logger, module, io);

    var onPageCreated = function () {
        that.page.on('load', () => {
            if (that.page.url().indexOf('https://p.m.jd.com/norder/freeRegister.action') == 0) {
                onfreeRegisterPage();
            } else if (that.page.url().indexOf('https://plogin.m.jd.com/user/login.action') == 0) {
                login();
            } else if (that.page.url().indexOf('https://pay.m.jd.com/cpay/pay-index.html') == 0) {
                logger.log('info', 'We are in the pay page');
                that.finished();
            }
        });
    };

    var onfreeRegisterPage = async function () {
        logger.log('info', 'We are on freeRegister page now');
        await that.condScreenshot('freeRegister.png');

        //await that.page.waitFor(10000);
        //await that.condScreenshot('clicked_qudenglu_button.png');

        that.page.click('#gologinBtn');
        logger.log('info', 'clicked 去登录 button');
    }

    var sendCaptchaImage = async function () {
        logger.log('info', 'Captcha shown');
        let clipRect = that.page.evaluate(function () {
            return document.querySelector(captchaImgSelector).getBoundingClientRect();
        });
        let buffer = await that.page.screenshot({ clip: clipRect });

        that.gcmNotify(
            {
                title: 'JD login captcha',
                click_action: 'com.hanraysoft.intent.RESOLVE_CAPTCHA',
                data: {
                    captcha: buffer.toString('base64'),
                    sessionId: that.sessionId,
                }
            },
            '/topics/captcha'
        );
        that.condLog('Captcha sent');
    };

    var login = async function () {
        logger.log('info', 'We are on login page now');
        that.condScreenshot('login.png');

        await that.page.type('#username', that.config.username, { delay: 100 });
        await that.page.type('#password', that.config.password, { delay: 100 });

        logger.log('info', 'finished inputting user name and password');

        checkCaptcha();
    };

    var checkCaptcha = async function () {
        try {
            await that.page.waitForFunction(
                function (captchaImgSelector) {
                    var captchaImg = document.querySelector(captchaImgSelector);//console.log('standardCode:'+ standardCode.src);
                    if (captchaImg == null) return false;
                    var isVisible = (captchaImg.offsetWidth > 0 || captchaImg.offsetHeight > 0);
                    return isVisible && (captchaImg.src.indexOf('/cgi-bin/m/authcode?mod=login') >= 0);
                },
                {
                    polling: 500,
                    timeout: 3000
                },
                captchaImgSelector
            );
            sendCaptchaImage();
        } catch (err) {//timeout and captcha not show
            logger.log('info', 'err caught while checking captcha:' + err);
            submitLogin();
        }
    };

    var submitLogin = function () {
        that.condScreenshot('beforeSubmit.png');
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
