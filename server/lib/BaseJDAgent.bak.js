module.exports = function(controlPage, moduleName){
    var captchaImgSelector = 'img#imgCode';
    var that = require('./BaseAgent')(controlPage, moduleName);

    var sendCaptchaImage = function(){
        that.page.clipRect = that.page.evaluate(function(captchaImgSelector){
            return document.querySelector(captchaImgSelector).getBoundingClientRect();
        }, captchaImgSelector);

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
    };

    var checkCaptcha = function(){
        that.waitFor(
            function(){
                return that.page.evaluate(function(captchaImgSelector){
                    var captchaImg = document.querySelector(captchaImgSelector);//console.log('standardCode:'+ standardCode.src);
                    if(captchaImg == null) return false;
                    var isVisible = (captchaImg.offsetWidth > 0 || captchaImg.offsetHeight > 0);
                    return isVisible && (captchaImg.src.indexOf('/cgi-bin/m/authcode?mod=login') >= 0);
                }, captchaImgSelector);
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
    
    that.onCaptcha = onCaptcha;
    that.login = login;

    return that;
};
