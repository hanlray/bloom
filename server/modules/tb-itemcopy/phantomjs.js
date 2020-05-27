module.exports = function(controlPage){//console.log('[phantomjs]constructing an agent instance for tb-itemcopy');
    var that = require('../../lib/BaseTBAgent')(controlPage, 'tb-itemcopy');
    //console.log('[phantomjs]constructed an BaseTBAgent instance for tb-itemcopy');

    var isFillingForm = false,
        isUploadFrameLoaded = false;

    var system = require('system');
    var fs = require('fs');

    var uploadPrimaries = function(){
        that.log('Uploading primary images');

        var timeout = 10;
        for(var i=0;i<that.request.primaryImages.length;i++) {
            that.log('Uploading file:'+that.request.primaryImages[i]);
            that.page.uploadFile('.moxie-shim-html5 input[type=file]', that.request.primaryImages[i]);
            timeout += 5;
        }
        that.page.switchToMainFrame();
        return that.wait.every(250).before(timeout*1000).until(function(){
            return that.page.evaluate(function(primaryCount){
                var root = modulex.require('xsell/base/control/root');
                return root.getControl('multiMedia.image').value.length >= primaryCount;
            }, that.request.primaryImages.length);
        }).catch(function(){
            that.log('Primary images upload not completed.');
            throw 'Primary images upload not completed.';
        });
    };

    var switchToUploadFrame = function(){
        return that.wait.every(250).before(4000).until(function(){
            return isUploadFrameLoaded;
        }).catch(function(){
            that.log('upload frame not loaded');
            throw 'upload frame not loaded';
        }).then(function(){
            /*
            var framePosition = that.page.evaluate(function () {
                return document.getElementsByTagName('iframe').length;
            });
            that.page.switchToFrame(framePosition - 1);*/

            //use page.framesCount to get the upload frame position
            //because for slimerjs framesCount (5) is not equal with the number of iframe elements (7) on this page
            //that.log('framesCount:'+that.page.framesCount);
            that.page.switchToFrame(that.page.framesCount - 1);//the last frame
            that.log('switched to the upload iframe');
        });
    };

    var fillSkuProps = function(){
        that.page.evaluate(function() {//close the upload dialog first
            root.getControl('multiMedia.image').imageUpload.tip.hide();
        });
        var promise = Promise.resolve();
        that.request.skuProps.propIds.forEach(function (propId){
            var controlType = that.page.evaluate(function(propId){
                var controlId = 'prop_' + propId;
                var propControl = root.getControl(controlId);
                return propControl.type;
            }, propId);
            if(controlType == 'sku_listbox'){
                promise = promise.then(function() {
                    that.page.evaluate(function (request, propId) {
                        var controlId = 'prop_' + propId;
                        var propControl = root.getControl(controlId);
                        request.skuProps[propId].forEach(function (propValue) {
                            var checkbox = propControl.$list.find('input[value=' + propValue + ']');
                            checkbox.get(0).checked = 1;
                            checkbox.change();
                        });
                    }, that.request, propId);
                    that.log('sku listbox has been filled');
                });
            }else if (controlType == 'sku_color_new'){
                that.request.skuProps[propId].forEach(function(propValue){
                    promise = promise.then(function(){
                        var colorInfo = that.request.colorsInfo[propValue];
                        isUploadFrameLoaded = false;
                        that.page.evaluate(function(propId, colorInfo){
                            var controlId = 'prop_' + propId;
                            var propControl = root.getControl(controlId);
                            var row = propControl.$container.find('.row:last-child');
                            var pickerText = row.find('.picker-text');
                            pickerText.val(colorInfo.text).trigger('keyup').trigger('blur');
                            console.log('row id is:'+ row.data('id'));
                            row.find('.upload-img').trigger('click');
                        }, propId, colorInfo);
                        //that.log('row id is:'+rowId);
                        return switchToUploadFrame().then(function(){
                            return setUploadFolder('宝贝图片/' + that.request.itemId + '/colors');
                        }).then(function(){
                            that.log('uploading color file:' + colorInfo.image);
                            that.page.uploadFile('.moxie-shim-html5 input[type=file]', colorInfo.image);
                        }).then(function(){
                            that.page.switchToMainFrame();
                            return that.wait.every(250).before(3000).until(function(){
                                /*
                                return that.page.evaluate(function(rowId){
                                    return jquery('.row[data-id='+rowId+']').hasClass('has-img');
                                }, rowId);*/
                                return !isVisible('.xwindow');
                            });
                        });
                    });
                });
            }
        });
        return promise;
    };

    var fillPriceCombine = function(){
        that.page.evaluate(function(){
            var root = modulex.require('xsell/base/control/root');
            root.getControl('price').$input.val('100').trigger('change');
            root.getControl('quantity').$input.val('10').trigger('change');
        });
        afterUploaded();
    };

    var fillSkuControl = function(){
        that.page.evaluate(function(){
            var root = modulex.require('xsell/base/control/root');
            var $ = modulex.require('sell').jquery;
            var skuControl = root.getControl('sku');
            /*
            skuControl.$table.find('tr[sku_val_key]').each(function(){
                $(this).find('td input[sku_name=price]').val('100').trigger('change');
                $(this).find('td input[sku_name=quantity]').val('10').trigger('change');
            });*/

            skuControl.$batchUpdateArea.find('#batch-price').val('100');
            skuControl.$batchUpdateArea.find('#batch-quantity').val('10');
            skuControl.$batchUpdateArea.find('.batch-submit').click();
        });
        /*
        setTimeout(function(){
            that.render('after_sku_props.jpg');
        }, 10000);*/
        //very important to do this delay
        setTimeout(function(){
            afterUploaded();
        }, 5000);
        //afterUploaded();
    };

    var afterUploaded = function(){
        that.page.evaluate(function(request){
            require(['node', 'xsell/base/control/root', 'formhelper'], function($, root, formHelper){
                //root.getControl('price').value = request.price;
                //root.getControl('quantity').value = request.quantity;
                root.getControl('purchaseLocation.isGlobalStock').value= 'false';
                /*
                var descForPC = root.getControl('descForPC');
                descForPC.editor.insertHtml('<p>test</p>');
                descForPC.editor.fire('blur');*/

                //formHelper.setCombobox(root.getControl('deliverTemplate').combobox, request.deliverTemplate);

                root.getControl('commitBtn').$btn.click();
            });
        }, that.request);
        //that.renderInterval('publishButtonClicked.jpg', 20000, 1000);

        setTimeout(function(){
            that.render('publishButtonClicked.jpg');
        }, 10000);
    };

    var injectFormHelper = function(){
        that.page.evaluate(function(){
            define('waitfor', function(require, exports, module){
                module.exports = function(testFx, onReady, onTimeout, timeOutMillis){
                    var maxtimeOutMillis = timeOutMillis ? timeOutMillis : 3000, //< Default Max Timout is 3s
                        start = new Date().getTime(),
                        condition = false,
                        ready = function(){
                            clearInterval(interval); //Stop this interval first to prevent the error from onReady function
                            typeof(onReady) === "string" ? eval(onReady) : onReady(); //< Do what it's supposed to do once the condition is fulfilled
                        },
                        interval = setInterval(function() {
                            if ((new Date().getTime() - start) < maxtimeOutMillis && !condition){
                                // If not time-out yet and condition not yet fulfilled
                                condition = (typeof(testFx) === "string" ? eval(testFx) : testFx()); //< defensive code
                                if(condition) ready();
                            }else{
                                if(!condition) {
                                    // If condition still not fulfilled (timeout but condition is 'false')
                                    //console.log("'waitFor()' timeout");
                                    typeof(onTimeout) === "string" ? eval(onTimeout) : onTimeout();
                                    clearInterval(interval); //< Stop this interval
                                } else ready();
                            }
                        }, 250); //< repeat check every 250ms
                };
            });
            define('formhelper', function(require, exports, module){
                var waitFor = require('waitfor');
                module.exports = {
                    setCombobox: function(combobox, textValue){
                        for(var i=0;i<combobox.opts.length;i++){
                            if(combobox.opts[i].text == textValue) break;
                        }
                        if(i < combobox.opts.length)
                            combobox.setValue(combobox.opts[i]);
                        else{//for large opts as combobox.opts will only contain the first page(50) of opts
                            combobox.$searchbox.val(textValue);
                            combobox.$searchbox.trigger('keyup');
                            waitFor(function(){
                                return (combobox.$searchbox.get(0)._cacheSerachData && (textValue in combobox.$searchbox.get(0)._cacheSerachData));
                            },function(){
                                combobox.setValue(combobox.$searchbox.get(0)._cacheSerachData[textValue][0]);
                            },function(){
                                console.log('Option '+textValue+' not found ');
                            },5000);
                        }
                    }
                }
            });
        });
    };

    var fillForm = function(){
        injectFormHelper();

        that.log('begin filling publish form');
        that.page.evaluate(function(request){
            require(['sell', 'xsell/base/control/root', 'formhelper'], function(sell, root, formHelper){
                window.jquery = sell.jquery;
                window.root = root;

                root.getControl('stuffStatus').value = 5;
                //$('#title').val(request.title);console.log('title is ' + request.title);
                root.getControl('title').value = request.title;

                for(var propKey in request.props){
                    formHelper.setCombobox(root.getControl(propKey)._cbox, request.props[propKey]);
                }
            });
        }, that.request);
        //that.render('after_props_filled.jpg');
        isUploadFrameLoaded = false;
        that.page.evaluate(function() {
            root.getControl('multiMedia.image').$container.find('.image-list').trigger('click');
        });
        switchToUploadFrame().then(function() {
            return setUploadFolder('宝贝图片/' + that.request.itemId);
        }).then(function(){
            //that.render('item_folder_ready.jpg');
            return uploadPrimaries();
        }).then(function(){
            that.log('Uploading primary images finished');
            return fillSkuProps();
        }).then(function(){
            that.log('sku properties have been filled');
            that.render('sku_props_filled.jpg');
            fillSkuControl();
        });
    };

    var isVisible = function(selector){
        return that.page.evaluate(function(selector) {
            var elem = document.querySelector(selector);
            if (!elem) return false;
            return (elem.offsetParent != null);
        }, selector);
    };

    var setUploadFolder = function(uploadPath){//set upload folder assumming iframe is loaded
        var _setUploadFolder = function(){//set upload folder assuming the upload tab is active
            var isFolderOpen = function(folderSelector, isRoot=false){
                return that.page.evaluate(function(folderSelector) {
                    var folderSwitch = $(folderSelector).parent().find('>.switch');
                    //return folderSwitch.hasClass(isRoot?'root_open':'center_open');
                    return folderSwitch.hasClass('center_open') || folderSwitch.hasClass('center_docu') ||
                        folderSwitch.hasClass('bottom_docu') || folderSwitch.hasClass('bottom_open') ||
                        folderSwitch.hasClass('root_open');
                }, folderSelector);
            };

            //set upload folder assuming current folder is not what we expected and the folder tree has shown up
            var _setUploadFolderReal = function() {
                var selectFolder = function(folder, level){
                    that.log('select folder '+folder);
                    var selector = '.mod-folder-tree a.level' + level + '[title="' + folder + '"]';
                    var isFolderSelected = that.page.evaluate(function(folderSelector){
                        return $(folderSelector).hasClass('curSelectedNode');
                    }, selector);
                    if(!isFolderSelected){
                        that.page.evaluate(function(folderSelector) {
                            $(folderSelector).click();
                            //$('.mod-modify-folder').click();
                        }, selector);
                        return true;
                    }
                    return false;
                };

                var expandFolder = function(folder, level){
                    that.log('Expand folder:'+folder);
                    var selector = '.mod-folder-tree a.level' + level + '[title="' + folder + '"]';
                    if(!isFolderOpen(selector)) {
                        //console.log('Clicking the + to expand the 宝贝图片');
                        that.page.evaluate(function(selector) {
                            var folderSwitch = $(selector).parent().find('>.switch');
                            folderSwitch.click();
                        }, selector);
                        return that.wait.every(250).before(2000).until(function () {
                            return isFolderOpen(selector);
                        }).then(function(){
                            return Promise.resolve(folder);
                        });
                    }else {
                        return Promise.resolve(folder);
                    }
                };

                var createFolder = function(folder, level, parent){
                    var _createFolder = function() {//create a folder when its parent folder is focused
                        var inputSelector = 'input.J_NewFolderName';
                        var dest = '.mod-folder-tree a.level' + level + '[title="' + folder + '"]';
                        var fillForm = function(){//fill create folder form and submit
                            that.log('filling create folder form');
                            that.page.evaluate(function(inputSelector, folder) {
                                $(inputSelector).val(folder);
                                $('.create-btn').click();
                            }, inputSelector, folder);

                            return that.wait.every(250).before(2000).until(function(){
                                return isVisible(dest);
                            });
                        };

                        if(!isVisible(inputSelector)) {
                            that.page.evaluate(function() {
                                console.log('Clicking 创建新文件夹');
                                $('.create-folder-wrap a.create-link').click();
                            });

                            return that.wait.every(250).before(2000).until(function() {
                                return isVisible(inputSelector);
                            }).then(function() {
                                return fillForm();
                            });
                        }else{
                            return fillForm();
                        }
                    };

                    //var parentSelector = '.mod-folder-tree a.level' + parent.level + '[title="' + parent.name + '"]';
                    if(selectFolder(parent, level-1)){//changed a selected folder will close the folder tree
                        that.page.evaluate(function(parentSelector) {
                            $('.mod-modify-folder').click();
                        });
                    }
                    return _createFolder();
                };

                var promise = Promise.resolve();
                arrUploadPath.forEach(function (folder, i) {
                    var level = i + 1;that.log('folder is:'+folder+' level is:'+level);
                    promise = promise.then(function (parentFolder) {
                        //expand parent folder first so that we can check if current folder exists in the next step
                        if (parentFolder)//first folder's parent folder(图片空间) always expanded
                            return expandFolder(parentFolder, level-1);
                    }).then(function (parentFolder) {//create folder if not exists
                        var folderSelector = '.mod-folder-tree a.level' + level + '[title="' + folder + '"]';
                        if (!isVisible(folderSelector)) {
                            return createFolder(folder, level, parentFolder);
                        }else{
                            that.log(folder + ' is already there');
                        }
                    }).then(function () {//select folder
                        if (i == (arrUploadPath.length - 1))//last folder
                            selectFolder(folder, level);
                        else {
                            that.log('return '+folder);
                            return folder;
                        }
                    });
                });
                return promise;
            };

            var arrUploadPath = fs.split(uploadPath);

            var currentFolder = that.page.evaluate(function () {
                return $('.current-folder').text();
                //return document.querySelector('.current-folder').text();
            });that.log('current upload folder is '+currentFolder);console.log('arrUploadPath.length:'+arrUploadPath.length);
            if(currentFolder == arrUploadPath[arrUploadPath.length - 1]) return Promise.resolve();

            if(!isVisible('.tree-wrap')){
                that.log('folder tree is not visible');
                that.page.evaluate(function () {
                    $('.mod-modify-folder').click();
                });
                return that.wait.every(250).before(3000).until(function(){
                    var tpkjFolderSelector = '.mod-folder-tree a.level0[title="图片空间"]';
                    return isFolderOpen(tpkjFolderSelector);
                }).catch(function() {
                    throw '图片空间 folder is not opened';
                }).then(function(){
                    that.log('图片空间 folder is expanded');
                    return _setUploadFolderReal();
                });
            }else{
                return _setUploadFolderReal();
            }
        };

        highlightUploadTab();
        return _setUploadFolder();
    };

    var highlightUploadTab = function() {
        that.log('Activating the upload tab');
        that.page.evaluate(function () {
            if (!document.querySelector('li.upload-tab-title.active')) {
                document.querySelector('li.upload-tab-title a').click();
            }
        });
    };

    var onPageCreated = function(){
        that.page.onLoadFinished = function(status, url, isFrame){
            if(that.config.log) {
                that.log("onLoadFinished:" + url + ' isFrame:'+isFrame);
                that.render('load-finished.png');
            }
            var match;
            if(isFrame && (url.indexOf('https://stream.taobao.com/plugin.htm') >= 0)){
                isUploadFrameLoaded = true;
            }else if(match = that.page.url.match(/(https:\/\/login\.m\.taobao\.com\/login\.htm\?.+)loginFrom=tb$/)){
                that.page.open(match[1]);
            }else if(that.page.url.indexOf('https://login.m.taobao.com/login.htm?_input_charset=utf-8&sid=')==0){
                //this is the login post url
                that.checkCaptcha();
            }else if(that.page.url.indexOf('https://login.m.taobao.com/login.htm') == 0){
                that.login();
            }else if(that.page.url.match(/https:\/\/upload\.taobao\.com\/auction\/container\/publish\.htm\?.+loginFrom$/)){
                //handle the wrong redirected url like https://upload.taobao.com/auction/container/publish
                //.htm?sid=1c791a970b5feeaab4d97b83bc0cf665&catId=50010850loginFrom
                that.page.open(getUrl());
            }else if(that.page.url.indexOf('https://upload.taobao.com/auction/container/publish.htm') == 0){
                //that.log('publish page load finised. url:'+url+' isFrame:'+isFrame);
                if(!isFrame && !isFillingForm) {
                    isFillingForm = true;
                    fillForm();
                }else if(isFrame && url.indexOf('https://stream.taobao.com/plugin.htm')>=0){
                    if(!isUploadFrameLoaded) isUploadFrameLoaded = true;
                    else isXWindowUploadFrameLoaded = true;
                }
            }else if(that.page.url.indexOf('https://upload.taobao.com/auction/publish/publishItemSuccess.htm' == 0)){
                that.log('info', 'publish succeed.');
            }else if(that.page.url.indexOf('https://login.m.taobao.com/send_code.htm?token=') == 0){
                that.page.evaluate(function(){
                    document.querySelector('.c-btn-oran-big').click();
                });
            }else if(that.page.url.indexOf('https://login.m.taobao.com/login_check.htm') == 0){
                that.emit('smsCode');
            }
        };
    };

    var onStart = function(){
        isUploadFrameLoaded = false;
    };

    var getUrl = function(){
        return 'https://upload.taobao.com/auction/container/publish.htm?catId=' + that.request.catId;
    };

    that.onPageCreated = onPageCreated;
    that.getUrl = getUrl;
    that.onStart = onStart;

    return that;
};
