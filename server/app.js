var http2 = require('http2');
var config = require('./config');
var moment = require('moment');
var util = require('util');
var fs = require('fs');
var schedule = require('node-schedule');
const koa = require('koa');

function BloomServer() {
    var logger = (function () {
        var winston = require('winston');
        return new (winston.Logger)({
            transports: [
                new (winston.transports.Console)({
                    'timestamp': function () {
                        return new Date().toLocaleString();
                    }
                })
            ]
        });
    })();

    var io;
    var ioApi;
    var ioNamespaces = new Map();
    var db;
    var jobColl;
    var Promise = require('bluebird');

    var phantomSocket;
    var jobProcessor = JobProcessor();
    var publicServer = PublicServer();

    var browser;

    var server = {};

    function JobProcessor() {
        var checkEndTime = moment();//jobs in db before this time has been processed

        var isRunning = false;
        var that = {};

        var process = async function (request, sessionId, io) {
            if (request.data.startDate) {
                //TODO ignore this request if startDate less than current time
                //save this purchase request
                //do not need to wait save finished?
                request.startDate = request.data.startDate;
                delete request.data.startDate;
                var r = await db.collection('purchase').insertOne(request);
                if (sessionId) {
                    emitClient('status', sessionId, '请求已保存');
                }

                //we have to take care of this rush request if its start date less than
                //the end check time, otherwise the db records routine has no chance to process this record
                if (moment(request.startDate) < checkEndTime) {
                    scheduleRush(request, r.insertedId.toString());
                }
                return r.insertedId.toString();
            } else {//buy now request
                if (!sessionId) sessionId = require('node-uuid').v1();
                startRush(request, sessionId, io);
            }
        };

        var scheduleRush = function (rush, sessionId) {
            var diff = moment(rush.startDate).diff(moment(), 'minutes');
            if (diff <= 3) {
                startRush(rush, sessionId);
            } else {
                var schedule = require('node-schedule');
                schedule.scheduleJob(moment(rush.startDate).subtract(3, 'minutes').toDate(), function () {
                    startRush(rush, sessionId);
                });
            }
        };

        var startRush = function (job, sessionId, io) {
            logger.log('info', 'Starting a rush:' + util.inspect(job));

            var agent = require('./modules/' + job.module + '/agent')(browser, logger, io);
            logger.log('info', 'an agent created');
            //delete job.module;
            //pass session here to make possible to reuse existing agents in the future
            job.data.startDate = job.startDate;
            agent.start(job.data, sessionId);
        };

        var run = function () {
            if (isRunning) return;

            doJobs();
            isRunning = true;
        };        

        var doJobs = function () {//process purchase records in db
            var jobs = db.collection('purchase');

            var checkStartTime = checkEndTime;
            var nextCheckTime = checkStartTime.add(1, 'hours');
            var stream = jobs.find({
                startDate: {
                    $gte: checkStartTime,
                    $lt: nextCheckTime
                }
            }).sort({ startDate: 1 }).stream().on('data', function (item) {
                logger.log('info', 'dealing with an item in db');
                scheduleRush(item, item._id);
            });
            //schedule next check
            checkEndTime = nextCheckTime;//update check end time
            
            //we schedule the next loop to run at 3 minutes earlier before the current check end time
            //so that the early jobs in the next check span to have time to be prepared.
            schedule.scheduleJob(checkEndTime.subtract(3, 'minutes').toDate(), doJobs);
        };        

        that.process = process;
        that.run = run;

        return that;
    }

    function PublicServer() {
        var that = {};
        var isRunning = false;

        var run = function () {
            if (isRunning) return;

            var app = new koa();

            var serve = require('koa-static');
            app.use(serve('public'));

            app.use(require('koa-bodyparser')());

            require('koa-ejs')(app, {
                root: __dirname,
                layout: false,
                viewExt: 'ejs',
                cache: false,
                debug: true
            });

            app.use(require('koa-json')());

            var router = require('koa-router')();

            require('./modules/core/http')(server)(router);
            require('./modules/jd/http')(server)(router);
            require('./modules/58/http')(server)(router);
            require('./modules/pricemon/http')(server)(router);
            require('./modules/tbshop/http')(server)(router);
            require('./modules/jd-quan/http')(server)(router);
            require('./modules/tb-itemcopy/http')(server)(router);
            app.use(router.routes()).use(router.allowedMethods());

            const sslServer = http2.createSecureServer(
                {
                    pfx: fs.readFileSync('./localhost.pfx'),
                    passphrase: '123456',
                },
                app.callback()
            );

            setupSocketServer(sslServer.listen(config.port));

            isRunning = true;
        };

        that.run = run;

        return that;
    }

    var emitClient = function (event, sid, data) {
        var module = sid.substr(0, sid.indexOf('_'));
        ioNamespaces.get(module).to(sid).emit(event, data);
    };

    var emitClient2 = function (event, sid, data) {
        io.to(sid).emit(event, data);
    };

    var push = function (event, sid, data) {
        if (!pusher) {
            pusher = require('./lib/getui');
        }
        pusher(event, sid, data);
    };

    function setupSocketServer(httpServer) {
        var io = require('socket.io')(httpServer, { 'log level': 1 });
        console.log('socket.io created');

        require('./modules/jd/sio')(io, server);
    }

    var run = async function () {
        const puppeteer = require('puppeteer');
        browser = await puppeteer.launch();

        var MongoClient = require('mongodb').MongoClient
            , assert = require('assert');

        var url = 'mongodb://localhost:27017/bloom';
        MongoClient.connect(url, function (err, database) {//this callback will be called on EVERY connect try including reconnect once the connection is lost
            assert.equal(null, err);
            logger.log('info', "Connected correctly to db");

            db = database;
            jobColl = db.collection('job');
            Promise.promisifyAll(jobColl);

            //db is ready, setup job processor and public server
            jobProcessor.run();
            publicServer.run();
        });
    };

    require('extend')(server, {
        resideDir: __dirname,
        jobProcessor: jobProcessor,
        log: function (level, msg) {
            logger.log(level, msg);
        },
        run: run,
    });

    return server;
}

BloomServer().run();