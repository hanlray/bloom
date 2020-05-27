module.exports = function(controlPage) {
    var moment = require('moment');
    var isBuyNowing = false;
    var isMiaoing = false;
    var endTime;
    var isPosting = false;
    var that = require('../../lib/BaseBuyer')(controlPage, '58');

    var onPageCreated = function(){
        that.page.onLoadFinished = function (){
            if(that.config.log) {
                that.log("onLoadFinished:" + that.page.url);
                that.render('load-finished.png');
            }

            if (that.page.url.indexOf('http://m.58.com/luoyang/') == 0) {
                openPostPage();
            }else if(that.page.url.indexOf('http://m.m.58.com/login/?&path=index') == 0){
                doLogin();
            }else if(that.page.url.indexOf('http://m.m.58.com/login/?path=') == 0) {
                var isNormalLogin =  that.page.evaluate(function(){
                    return $('#logRegTabCon').css('display')=='block';
                });
                if(!isNormalLogin){
                    that.page.open('http://m.m.58.com/login/?&path=index&post=true');
                }else{
                    doLogin();
                }
            }else if (that.page.url.indexOf('http://p.m.58.com/556') == 0) {
                setTimeout(beginPost, 1000);//wait 1 sec in case that page redirected to login page
            }else if(that.page.url.indexOf('http://m.m.58.com/index') == 0){
                openPostPage();
            }else if(that.page.url.indexOf('http://p.m.58.com/postsuccess/') == 0){
                that.finished();
            }
        };

        that.page.open('http://m.58.com/luoyang/');
    };

    var openPostPage = function(){
        that.page.open('http://p.m.58.com/556/' + that.request.category + '/s5?ClickID=1&guide=true');
    };

    var sendCaptchaImage = function() {
        that.page.clipRect = that.page.evaluate(function () {
            return document.querySelector('#yzm_img').getBoundingClientRect();
        });

        that.send('back', ['captcha', that.page.renderBase64('jpg'), that.sessionId]);
        that.page.clipRect = { left:0, top:0, width:0, height:0 };
    }

    var login = function() {
/*        that.page.evaluate(function(){
            $('.login_tapname').click();
        });

        that.waitFor(function(){
            return that.page.evaluate(function(){
                return $('#logRegTabCon').is(":visible");
            });
        },function(){
            doLogin();
        },function(){
            that.log('login tab is not shown');
        }, 1000);*/
    };

    var doLogin = function(){
        that.page.evaluate(function(){
            $('#pptmobile').val('xxx');
            $('#pptmobilepassword').val('xxx').trigger('input');
            $('#mobileLoginButton').trigger('click');
        });
    };

    var isBuyNowButtonReady = function() {
        return that.page.evaluate(function () {
            if(Zepto('.buy-now').length == 0) {
                return false;
            }
            return true;
        });
    }

    var buyNow = function(){
        if(!isBuyNowButtonReady()) return;
        isBuyNowing = true;
        this.page.evaluate(function () {console.log('Clicking buy now button');
            Zepto('.buy-now').click();
        });
    }

    var isSubmitEnabled = function() {
         return this.page.evaluate(function(){
            if(Zepto('.J_submit').attr('disabled')){
                return false;
            } else {
                return true;
            }
        });
    }

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

    var beginPost = function(){
        if (that.page.url.indexOf('http://p.m.58.com/556') != 0) return;
        if(isPosting) return;

        isPosting = true;
        that.log('begin post');
        that.condRender('beginPost.png');

        if (that.request.image){
            var args = ['download.js', that.request.image];
            require('child_process').execFile('node', args, null, function (err, stdout, stderr){
                if (err) that.log('download file error:' + err);
                else{//that.log('download.js terminates:stdout is:' + stdout);
                    doPost(stdout.toString().trim());
                    /*
                    setTimeout(function(){
                        doPost(stdout.toString().trim());
                    }, 10000);
                    */
                }
            });
        }else{
            doPost(null);
        }
    };

    var doPost = function(imagePath){
        that.log('doPost');
        if(imagePath) {
            //that.log('imagePath:typeof=' + typeof imagePath + ' value=' + imagePath);
            //that.log('size:' + require('fs').size(imagePath));
/*            that.page.onFilePicker = function(oldFile) {
                that.log('onFilePicker');
                //return imagePath;
                //return 'D:\\ray\\stove.jpg';
                return "D:\\ray\\workspace\\hanraysoft\\bloom\\server\\Downloads\\11621-8032-guqj9e.jpg";
            };*/
            that.page.uploadFile('input[name=img]',
                imagePath
                //'D:\\ray\\workspace\\hanraysoft\\bloom\\server\\Downloads\\11621-14000-1kzzqda.jpg'
            );
/*            that.page.evaluate(function(){
                Zepto('input[name=img]').trigger('click');
            });*/
            setTimeout(function(){
                require('fs').remove(imagePath);
                submitPost();
            }, 10000);//need to wait some seconds for file uploaded
        }else{
            submitPost();
        }
    };

    var submitPost = function(){
        that.log('submitPost');
        that.condRender('submitPost.png');
        that.page.evaluate(function(request){
            Zepto('input[name=Title]').val(request.title);
            Zepto('textarea[name=Content]').val(request.description);
            Zepto('.tm_itemtext input[name=MSObjectType]').val(request.catLevel2);
            Zepto('input[name=MinPrice]').val(request.price);
            Zepto('input[name=localArea]').val('557');
            Zepto('input[name=localDiduan]').val('13124');

            Zepto('#btn_post').trigger('click');
        }, that.request);
    };

    var checkCaptcha = function(){
        waitFor(
            function () {
                return this.page.evaluate(function () {
                    var captchaImg = document.querySelector('#captcha-img img');//console.log('standardCode:'+ standardCode.src);
                    if(captchaImg == null) return false;
                    var isVisible = (captchaImg.offsetWidth > 0 || captchaImg.offsetHeight > 0);
                    return isVisible && (captchaImg.src.indexOf('/cgi-bin/m/authcode?mod=login') == 0);
                });
            },
            function () {
                sendCaptchaImage.apply(this);
            },
            function () {
                submitLogin();
            },
            2000
        );
    };

    var submitVerify = function() {
        that.condRender('before-submit-login.png');
        that.page.evaluate(function () {
            Zepto('#but03').click();
        });
    };

    var onCaptcha = function(data) {
        that.condLog('received captcha code:' + data);

        that.page.evaluate(function(code){
            Zepto('input#tkyzm_text').val(code).trigger('input');
        }, data);

        submitVerify();
    }

    that.onPageCreated = onPageCreated;
    that.onCaptcha = onCaptcha;

    return that;
}
