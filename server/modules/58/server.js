/**
 * Created by ray on 1/14/2016.
 */
module.exports = function(server) {
    var that ={};

    var socketApi = function(clientIO){
        clientIO.on('58-post', function (data) {
            console.log('got 58-post request');
            var post = {
                module: '58',
                data: data
            };

            var sid= '58_' + clientIO.handshake.query.id;

            post.action = 'start';
            post.sessionId = sid;

            server.phantomSocket.emit('cmd', post);
        });
    };

    that.socketApi = socketApi;

    return that;
};