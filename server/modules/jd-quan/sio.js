/**
 * Created by ray on 1/29/2016.
 */
module.exports = function(server){
    return function(clientIO, sid){
        clientIO.on('getFee', function (data){
            var post = {
                module: 'taobaoke',
                data: data
            };

            post.action = 'start';
            post.sessionId = sid;

            server.phantomSocket.emit('cmd', post);
        });
    };
};