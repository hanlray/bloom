const gcm = require('node-gcm');

// An agent does a job
//This agent implementation starts a job by opening a page
module.exports = function (browser, logger, moduleName, io) {
    var fsExtra = require('fs-extra');
    var path = require('path');
    var wait = require('wait-promise');
    const util = require('util')

    var modulePath = '../modules/' + moduleName;
    var config = require(modulePath + '/config.json');
    var page, request, logDir;

    var gcmSender = new gcm.Sender('xxx');

    var that = {};

    var setupLogdir = async function () {
        var prefix = '';
        var dir = path.join(prefix, 'modules', moduleName, 'log', that.sessionId);
        fsExtra.ensureDir(dir);
        logDir = dir;
    };

    var render = function (fileName) {
        page.render(logDir + '/' + fileName);
    };

    var condRender = function (fileName) {
        if (config.log) render(fileName);
    };

    var renderInterval = function (fileName, maxTimeout, delay) {
        var start = new Date().getTime();
        var extName = fileName.substr(fileName.lastIndexOf('.'));
        var baseName = fileName.substring(0, fileName.lastIndexOf(extName));
        var index = 1;
        var intervalId = setInterval(function () {
            if ((new Date().getTime() - start) < maxTimeout) {
                render(baseName + (index++) + extName);
            } else {
                clearInterval(intervalId);
            }
        }, delay);
    };

    var write = function (fileName) {
        fs.write(logDir + '/' + fileName, page.content, 'w');
    };

    var writeFrame = function (fileName) {
        fs.write(logDir + '/' + fileName, page.frameContent, 'w');
    };

    var send = function (action, params) {
        controlPage.evaluate('function(){socket.emit("' + action + '",' + JSON.stringify(params) + ');}');
    };

    var emit = function (event, data) {
        var payload = [event, that.sessionId, data];
        controlPage.evaluate('function(){socket.emit("back",' + JSON.stringify(payload) + ');}');
    };

    var finished = function () {//call this when agent finished
        if(io){
            io.to(that.sessionId).emit('done');
        }
        closePage();
    };

    var log = function (msg) {
        logger.log('info', '['+moduleName+']msg');
    };

    var condLog = function (msg) {
        if (config.debug) {
            log(msg);
        }
    };

    var closePage = function () {
        if(that.page){
            that.page.close();
            that.page = null;
        }
    };

    var gcmNotify = function (msg, topic) {
        var message = new gcm.Message();

        message.addNotification('title', msg.title);

        if (msg.body) message.addNotification('body', msg.body);
        message.addNotification('icon', 'ic_launcher');
        var sound = 'beat.ogg';
        if (msg.sound) sound = msg.sound;
        message.addNotification('sound', sound);

        let click_action = 'com.hanraysoft.intent.OPEN_MSG_SOURCE';
        if(msg.click_action)
            click_action =  msg.click_action;
        message.addNotification('click_action', click_action);

        message.addData(msg.data);
        gcmSender.send(message, { topic: topic }, function (err, response) {
            if (err) log('error', 'gcm send error:' + err);
        });
    };

    var condScreenshot = async function(name) {
        if(config.debug){
            that.page.screenshot({'path': path.join(logDir, name)});
        }
    }

    var start = async function (req, sid) {
        logger.log('info', 'got a request:' + util.inspect(req));
        that.request = req;
        that.sessionId = sid;//save the session id that this buyer is currently deal with

        if(config.debug){
            await setupLogdir();
        }

        logger.log('info', 'Starting, sessionId is:' + sid);
        that.onStart && that.onStart();

        that.page = page = await browser.newPage();

        page.setUserAgent(config.userAgent ||
            'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.76 Mobile Safari/537.36');

        //that.log('ua is:'+page.settings.userAgent);
        if (config.log) {
            var self = this;
            page.onConsoleMessage = function (msg) {
                self.log('[console] ' + msg);
            };
            page.onError = function (msg, trace) {
                var wholeMsg = msg;
                trace.forEach(function (item) {
                    wholeMsg += '  ' + item.file + ':' + item.line;
                });
                self.log(wholeMsg);
            };
            page.onResourceError = function (resourceError) {
                var msg = 'Unable to load resource (#' + resourceError.id + ' URL:' + resourceError.url + ')';
                msg += 'Error code: ' + resourceError.errorCode + '. Description: ' + resourceError.errorString;
                self.log('Resource Error:' + msg);
            };
            page.onUrlChanged = function (targetUrl) {
                self.log('onUrlChanged:' + targetUrl);
            };
        }

        that.onPageCreated();
        page.goto(req.startUrl);
    };

    //require.paths.push('../node_modules/');
    //var fs = require('fs');
    //console.log('workingDirectory is:'+fs.workingDirectory);
    //var extendPath = fs.absolute(fs.workingDirectory + '/node_modules/extend/index');
    var extend = 'extend';
    //if(slimer) extend = '../node_modules/extend/index';
    require(extend)(that, {
        config: config,
        closePage: closePage,
        emit: emit,
        finished: finished,
        start: start,
        log: log,
        condLog: condLog,
        render: render,
        renderInterval: renderInterval,
        condRender: condRender,
        write: write,
        writeFrame: writeFrame,
        gcmNotify: gcmNotify,
        condScreenshot: condScreenshot
    });
    return that;
};
