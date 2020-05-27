/**
 * Created by ray on 1/17/2016.
 */
var logger = (function(){
    var winston = require('winston');
    return new (winston.Logger)({
        transports: [
            new (winston.transports.Console)({
                'timestamp': function(){
                    return new Date().toLocaleString();
                }
            })
        ]
    });
})();

var app = require('koa')();

var serve = require('koa-static');
app.use(serve('public'));

var server = app.listen(8089);

var io = require('socket.io')(server, {'log level':1});

var util = require('util');

io.on('connection', function(socket){
    logger.log('info', "a socket.io client on default namespace connected");
});
io.of('/sub1').on('connection', function(socket){
    logger.log('info', "a socket.io client on sub1 namespace connected");
    console.log(util.inspect(socket.handshake.query, false, null));
    //logger.log('info', "socket.id="+socket.request.query);
    socket.on('disconnect', function(){
        logger.log('info', 'a socket.io client on sub1 namespace disconnected');
    });
});
