/**
 * Created by ray on 1/29/2016.
 */

module.exports = function(server){
    return function(clientIO, sid){
        clientIO.on('rush', function (data){
            console.log('got a rush request');

            if('expectedPrice' in data)
                data.expectedPrice = Math.floor(parseFloat(data.expectedPrice) * 100);

            var purchase = {
                module: clientIO.handshake.query.module,
                data: data
            };

            //var sid = 'jd_' + clientIO.handshake.query.id;
            var result = server.handleRushRequest(purchase, clientIO.handshake.query.id);
        });
        clientIO.on('captcha', function (data){
            server.phantomSocket.emit(
                'cmd',
                {
                    action: 'sessionAction',
                    sessionAction: 'Captcha',
                    params: data[0],
                    sessionId: data[1]
                }
            );
        });
    }
};
module.exports.namespace = '/';