function Taobao(controlPage) {
    function send(action, params) {
        controlPage.evaluate('function(){socket.emit("'+action+'",'+JSON.stringify(params)+');}');
    }

    function waitFor(testFx, onReady, onTimeout, timeOutMillis) {
        var maxtimeOutMillis = timeOutMillis ? timeOutMillis : 3000, //< Default Max Timout is 3s
            start = new Date().getTime(),
            condition = false,
            interval = setInterval(function() {
                if ( ((new Date().getTime() - start) < maxtimeOutMillis) && !condition ) {
                    // If not time-out yet and condition not yet fulfilled
                    condition = (typeof(testFx) === "string" ? eval(testFx) : testFx()); //< defensive code
                } else {
                    if(!condition) {
                        // If condition still not fulfilled (timeout but condition is 'false')
                        //console.log("'waitFor()' timeout");
                        typeof(onTimeout) === "string" ? eval(onTimeout) : onTimeout(); //< Do what it's supposed to do once the condition is fulfilled
                        clearInterval(interval); //< Stop this interval
                    } else {
                        // Condition fulfilled (timeout and/or condition is 'true')
                        console.log("'waitFor()' finished in " + (new Date().getTime() - start) + "ms.");
                        typeof(onReady) === "string" ? eval(onReady) : onReady(); //< Do what it's supposed to do once the condition is fulfilled
                        clearInterval(interval); //< Stop this interval
                    }
                }
            }, 250); //< repeat check every 250ms
    }

    var page;
    var request;
    var isBuyNowing = false;
    var moment = require('moment');

    function loadOrderPage() {
        var itemUrl = 'http://h5.m.taobao.com/awp/base/order.htm?itemId=' + request.params.itemId + '&buyNow=true';
        console.log('loading ' + itemUrl);
        page.open(itemUrl, function (status) {console.log('status:'+status);
            if (status !== 'success') {
                console.log('open item page failed');
                return;
            }

            if(page.url.indexOf('http://login.m.taobao.com/')==0){
                login();
            }
        });
    }

    function sendCaptchaImage() {
        console.log('captcha shown');
        page.clipRect = page.evaluate(function () {
            return document.querySelector('#J_StandardCode').getBoundingClientRect();
        });
        setTimeout(function(){//wait 1 second to load the capatch image
            console.log('Sending captcha screenshot to client');
            send('back', ['captcha', page.renderBase64('jpg'), sessionId]);
        }, 1000);
    }

    function login() {
        page.evaluate(function () {
            var userName = document.querySelector('input[name=TPL_username]');
            userName.focus();
            userName.value = 'xxx';//console.log('useranme:'+userName.value);

            var password = document.querySelector('input[name=TPL_password]');
            password.focus();
            password.value = 'xxx';
        });

        checkCaptcha();
    }

    this.start = function(req, sid) {
        request = req;
        sessionId = sid;
        require('fs').removeTree('screenshots');

        page = webpage.create();//console.log('The default user agent is ' + page.settings.userAgent);
        //page.settings.userAgent = 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.57 Safari/537.36';
        page.settings.userAgent = 'Mozilla/5.0 (Linux; Android 4.3; Nexus 7 Build/JSS15Q) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2307.2 Mobile Safari/537.36';

        page.onConsoleMessage=function(msg){
            return console.log('console msg:'+msg);
        };
        page.onError = function (msg, trace) {
            console.log(msg);
            trace.forEach(function(item) {
                console.log('  ', item.file, ':', item.line);
            })
        };
        page.onResourceError = function(resourceError) {
            console.log('Unable to load resource (#' + resourceError.id + ' URL:' + resourceError.url + ')');
            console.log('Error code: ' + resourceError.errorCode + '. Description: ' + resourceError.errorString);
        };
        page.onUrlChanged = function (targetUrl) {
            console.log('onUrlChanged:' + targetUrl);
        };
        page.onLoadFinished = function () {
            console.log("onLoadFinished:" + page.url);
            page.render('screenshots/load-finished.png');
            if (page.url.indexOf('http://h5.m.taobao.com/awp/core/detail.htm') == 0) {
                if(!isBuyNowing) buyNow();
            } else if (page.url.indexOf('http://h5.m.taobao.com/awp/base/order.htm') == 0) {
                startBuy();
            } else if (page.url.indexOf('http://login.m.taobao.com/') == 0) {
                console.log("login page shown.");
                login();
            } else if(page.url.indexOf('https://login.m.taobao.com/login.htm?token=') == 0){
                console.log("login page with captcha shown.");
                login();
            } else if(page.url.indexOf('http://mclient.alipay.com/w/trade_pay.do') == 0){
                send('back', ['success']);
            }
        };
        var itemUrl = 'http://h5.m.taobao.com/awp/core/detail.htm?id='+request.params.itemId;console.log("Loading item page:"+itemUrl);
        page.open(itemUrl);
    }

    function isBuyNowButtonReady() {
        return page.evaluate(function () {
            if(Zepto('.buy-now').length == 0) {
                return false;
            }
            return true;
        });
    }

    function buyNow(){
        page.evaluate(function () {
            console.log(Zepto('.buy-now').attr('class'));
        });
        if(!isBuyNowButtonReady()) return;
        isBuyNowing = true;
        page.evaluate(function () {console.log('Clicking buy now button');
            Zepto('.buy-now').click();
        });
    }

    function isSubmitEnabled() {
         return page.evaluate(function(){
            if(Zepto('.J_submit').attr('disabled')){
                return false;
            } else {
                return true;
            }
        });
    }

    function miaoBuy() {
        var endTime = moment().add(10, 'seconds');

        if(isSubmitEnabled()) {
            buy();
            return;
        }

        function tryBuy() {
            if(isSubmitEnabled()) buy();
            else if(moment() < endTime){
                page.reload(tryBuy);
            } else {
                console.log('miao failed');
            }
        }
        page.reload(tryBuy);
    }

    function buy() {
        page.render('screenshots/before_submit_order.png');
        waitFor(
            function() {
                return page.evaluate(function () {
                    var submitBtn = Zepto('.J_submit');//console.log(submitBtn.html());
                    if(submitBtn.length > 0 && !submitBtn.attr('disabled'))
                        return true;
                    return false;
                });
            },
            function(){
                page.evaluate(function(){console.log('Clicking submit order button');
                    Zepto('.J_submit').click();
                });
            },
            function(){
                console.log('submit order button not shown.');
                page.render('screenshots/order_page_timeout.png');
            },
            5000
        );
    }

    function startBuy() {
        if(request.startDate) {
            var seconds = moment(request.startDate).diff(moment(), 'seconds') - 1;
            if(seconds > 0) setTimeout(miaoBuy, seconds*1000);
            else buy();
        } else {
            buy();
        }
    }

    function checkCaptcha() {
        console.log('checking if captach show');
        waitFor(
            function () {
                return page.evaluate(function () {
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
                console.log('captcha did not show, trying to submit');
                submitLogin();
            },
            2000
        );
    }

    function submitLogin() {
        page.evaluate(function () {console.log("Clicking login submit button");
            document.querySelector('input[type=submit]').click();
        });
    }

    this.onCaptcha = function(data) {
        console.log('received captcha code:'+data);
        page.clipRect = { left:0, top:0, width:0, height:0 };

        page.evaluate(function(code){
            var checkCode = document.querySelector('input[name=TPL_checkcode]');
            checkCode.focus();
            //console.log('data:'+code);

            checkCode.value = code;
        }, data);
        submitLogin();
    }
}

exports.create = function(controlPage) {
    return new Taobao(controlPage);
}
