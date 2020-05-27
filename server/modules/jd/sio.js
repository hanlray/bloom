/**
 * Created by ray on 1/29/2016.
 */
module.exports = function(io, server){
    var jdIO = io.of('/jd');
    jdIO.on('connection', function (clientIO) {
        clientIO.on('disconnect', function () {
            server.log('info', 'a jd client disconnected');
        });
        server.log('info', 'a jd client connected');

        var id = clientIO.handshake.query.id;
        if (!id) {
            server.info('info', 'warning: no id specfied');
            return;
        }

        clientIO.join(id);

        clientIO.on('buy', function (data) {
            server.log('got a jd buy request');

            if ('expectedPrice' in data)
                data.expectedPrice = Math.floor(parseFloat(data.expectedPrice) * 100);

            var purchase = {
                module: 'jd',
                data: data
            };

            var result = server.rushProcessor.process(purchase, clientIO.handshake.query.id, jdIO);
        });
    });
};