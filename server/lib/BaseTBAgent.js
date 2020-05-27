module.exports = function(controlPage, moduleName){
    //console.log('[phantomjs]constructing a BaseTBAgent instance for ' + moduleName);
    var that = require('./BaseAgent')(controlPage, moduleName);
    //console.log('[phantomjs]constructed a BaseAgent instance for ' + moduleName);

    var login = function(){
        //ensure we are actually on the login page to prevent redirect issue
        /*var isLoginPage = that.page.evaluate(function(){
            return (document.querySelector('input[name=TPL_username]') != null);
        });
        if(!isLoginPage) return;*/

        //that.page.injectJs('simulator.js');
        /*
        that.page.evaluate(function(username){
            var usernameEl = document.querySelector('input[name=TPL_username]');
            usernameEl.focus();
            usernameEl.value = username;
        }, that.config.username);*/
        var userNameElem = that.page.evaluate(function() {
            return document.querySelector('input[name=TPL_username]');
        });
        //that.page.sendEvent('click', userNameElem.offsetLeft+10, userNameElem.offsetTop+5, 'left');
        that.click(userNameElem);
        that.wait.sleep(1111).then(function(){
            that.page.sendEvent('keypress', that.config.username);
        }).then(function(){
            return that.wait.sleep(1100).then(function(){
                fillPassword();
            });
        }).then(function(){
            //in slimerjs we need to wait enough time (1 second does not work) for the submit button to be enabled
            that.wait.sleep(2100).then(function(){
                submitLogin();
            });
        });
        /*
        setTimeout(function(){
            that.keyInput(that.config.username, function(){//This keyInput method does not work in slimerjs
                setTimeout(function(){
                    that.render('userNameInput.jpg');
                    fillPassword();
                }, 1100);
            });
        }, 1111);*/
    };

    var fillPassword = function() {
        //that.log('Filling password');
        var passwordElem = that.page.evaluate(function() {
            return document.querySelector('input[name=TPL_password]');
        });
        //that.page.sendEvent('click', passwordElem.offsetLeft+10, passwordElem.offsetTop+5, 'left');
        that.click(passwordElem);
        return that.wait.sleep(1112).then(function(){
            that.page.sendEvent('keypress', that.config.password);
        });
    };
    /*
    var fillPassword = function() {
        that.log('Filling password');
        var passwordElem = that.page.evaluate(function() {
            return document.querySelector('input[name=TPL_password]');
        });
        that.page.sendEvent('click', passwordElem.offsetLeft+10, passwordElem.offsetTop+5, 'left');
        setTimeout(function(){
            that.keyInput(that.config.password, function(){
                that.render('keyPressed.jpg');
                setTimeout(function(){
                    submitLogin();
                }, 1103);
            });
        }, 1112);
    };*/

    var checkCaptcha = function(){
        that.condLog('Checking if captach show');
        that.waitFor(
            function(){
                return that.page.evaluate(function (){
                    var dialog = document.querySelector('.km-dialog-alert');//console.log('standardCode:'+ standardCode.src);
                    if(dialog == null) return false;
                    return window.getComputedStyle(dialog).visibility == 'visible';
                });
            },
            function(){
                handleCaptcha();
            },
            function () {
                that.condLog('captcha did not show, we have logged in already');
            },
            2000
        );
    };

    var handleCaptcha = function(){
        that.log('Captcha alert dialog shown');
        that.render('Captcha.jpg');

        //while we're handling captcha, a page load could happen, we may be in the process of loading of another page
        //so we should do some necessary check and if this is not the page we expected, we stops.

        that.page.injectJs('simulator.js');

        //close the alert dialog
        that.page.evaluate(function(){
            document.querySelector('.km-dialog-alert .km-dialog-btn').click();
        });
        that.log('Clicked captcha alert dialog');
        //that.render('clicked_captcha_alert.jpg');
        //that.write('before_fill_password.html');

        if(fillPassword()){
            that.page.clipRect = that.page.evaluate(function () {
                return document.querySelector('.checkcode-img').getBoundingClientRect();
            });
            setTimeout(function () {//wait some seconds to load the captcha image and for the overlay to disappear
                that.condLog('Sending captcha screenshot to client');
                that.emit('captcha', that.page.renderBase64('jpg'));
                that.page.clipRect = {left: 0, top: 0, width: 0, height: 0};
            }, 1000);
        }
    };

    var submitLogin = function(){
        var button = that.page.evaluate(function() {
            var button = document.querySelector('button[type=submit]');
            //console.log('submit button is disabled:'+button.disabled);
            return button;
        });
        that.click(button);
        that.log('Login button clicked');
        //that.render('login_button_clicked.jpg');
    };

    var onSmscode = function(data){
        that.page.evaluate(function(code){
            document.querySelector('.auth-code-txt').value = code;
            document.querySelector('.auto-code-btn').click();
        }, data);
    };

    var onCaptcha = function(data) {
        that.condLog('received captcha code:'+ data);
        that.page.evaluate(function(code){
            var checkCodeEl = document.querySelector('input[name=TPL_checkcode]');
            simulator.click(checkCodeEl);
            checkCodeEl.value = code;
            simulator.input(checkCodeEl);
        }, data);
        submitLogin();
    };
    
    that.onCaptcha = onCaptcha;
    that.login = login;
    that.checkCaptcha = checkCaptcha;

    return that;
};
