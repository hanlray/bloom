/**
 * Created by ray on 1/29/2016.
 */
module.exports = function(server){
    return function(clientIO, sid){
        clientIO.on('buy', function (data){
            console.log('got jd:buy request');

            if('expectedPrice' in data)
                data.expectedPrice = Math.floor(parseFloat(data.expectedPrice) * 100);

            var purchase = {
                module: 'jd',
                data: data
            };

            //var sid = server.sessionManager.generateSID('jd');//create a new session
            //session.module = 'jd';//save session data
            var sid = 'jd_' + clientIO.handshake.query.id;

            //join this client to the room identified by generated session id so that we can
            //send back messages to it directly, no need to worry about the maintain the session
            //data
            //clientIO.join(sid);
            var result = server.handleRushRequest(purchase, sid);
        });
        /*
        clientIO.on('quan', function (data){
            console.log('got jd:quan request');
            var purchase = {
                module: 'jd-quan',
                data: data
            };

            //var sid = server.sessionManager.generateSID('jd');//create a new session
            //session.module = 'jd';//save session data
            var sid = 'jd_' + clientIO.handshake.query.id;

            //join this client to the room identified by generated session id so that we can
            //send back messages to it directly, no need to worry about the maintain the session
            //data
            //clientIO.join(sid);
            var result = server.handleRushRequest(purchase, sid);
        });
        */
        clientIO.on('captcha', function (data) {
            //why don't we find the current session based on this receiving clientIO,
            // instead of passing session id? because we want any devices such as phones
            // can resolve the captcha and send back

            var sessionId;
            var captchaCode;
            if ('string' == typeof data) {
                //if only the captcha image is provided, use the id in the query to get
                //the session id
                sessionId = 'jd_' + clientIO.handshake.query.id;
                captchaCode = data;
            } else {
                var captchaCode = data[0];
                var sessionId = data[1];
            }
            //console.log('Received a captcha:'+util.inspect(captchaCode, false, null));
            //console.log('sessionId:'+util.inspect(sessionId, false, null));
            server.phantomSocket.emit(
                'cmd',
                {
                    action: 'sessionAction',
                    sessionAction: 'Captcha',
                    params: captchaCode,
                    sessionId: sessionId
                }
            );
        });
    }
};