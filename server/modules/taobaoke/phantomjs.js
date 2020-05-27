module.exports = function(controlPage){
    var moment = require('moment');
    var isBuyNowing = false;
    var isMiaoing = false;
    var endTime;
    var isPosting = false;
    var that = require('../../lib/BaseBuyer')(controlPage, 'taobaoke');

    var onPageCreated = function(){
        that.page.onLoadFinished = function (){
            if(that.config.log) {
                that.log("onLoadFinished:" + that.page.url);
                that.render('load-finished.png');
            }

            if (that.page.url.indexOf('http://pub.alimama.com/promo/item/channel/index.htm') == 0) {
                openZoneDialog();
            }
        };

        var tmallUrl = 'https://detail.tmall.com/item.htm?id=' + that.request.id;
        that.page.open('http://pub.alimama.com/promo/item/channel/index.htm?channel=qqhd&q='+tmallUrl);
    };

    var openZoneDialog = function(){
        that.page.evaluate(function(){
            $('#J_search_results .block-search-box:first').find('.box-btn-group .box-btn-left').click();
        });
        that.waitFor(function(){
            return that.page.evaluate(function(){
                return $('.login-panel').is(":visible");
            });
        },function(){
            login();
        },function(){
            var isPromoteDialogShown = that.page.evaluate(function(){
                return $('.dialog .block-zone').is(":visible");
            });
            if(!isPromoteDialogShown) that.log('Zone Dialog is not shown');
            else openCodeDialog();
        }, 1000);
    };

    var sendCaptchaImage = function() {
        that.page.clipRect = that.page.evaluate(function () {
            return document.querySelector('#yzm_img').getBoundingClientRect();
        });

        that.send('back', ['captcha', that.page.renderBase64('jpg'), that.sessionId]);
        that.page.clipRect = { left:0, top:0, width:0, height:0 };
    };

    var openCodeDialog = function(){
        that.page.evaluate(function(){
            $('.dialog  .btn-brand').click();
        });

        that.waitFor(function(){
            return that.page.evaluate(function(){
                return $('.dialog .block-code').is(":visible");
            });
        },function(){
            getShortCode();
        },function(){
            that.log('code dialog is not shown');
        }, 1000);
    };

    var login = function(){
        that.page.evaluate(function(){
            $('#TPL_username_1').val('xxx');
            $('#TPL_password_1').val('xxx');
            $('#J_SubmitStatic').click();
        });
    };

    var getShortCode = function(){
        that.page.evaluate(function () {
            $('.dialog .block-code .tab-nav li:nth-child(2)').click();
        });
        that.waitFor(function(){
            return that.page.evaluate(function(){
                return $('.dialog .block-code #clipboard-target-2').is(":visible");
            });
        },function(){
            var code = $('#clipboard-target-2').val();
            that.emit('code', code);
        },function(){
            that.log('short code is not shown');
        }, 1000);
    };

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
