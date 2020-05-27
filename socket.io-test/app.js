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

var http = require('http');
var server = http.createServer(function(request, response){
    response.end();
});
server.listen(8089, function(){
    var io = require('socket.io')(server, {'log level':1});
    //io.adapter(require('socket.io-redis')({ host: 'localhost', port: 6379 }));

    io.on('connection', function(socket){
        logger.log('info', "a socket.io client on default namespace connected");
    });
    io.of('/mobile').on('connection', function(socket){
        logger.log('info', "a socket.io client on mobile namespace connected");
        socket.on('disconnect', function(){
            logger.log('info', 'a socket.io client on mobile namespace disconnected');
        });
    });
});
