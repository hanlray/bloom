module.exports = function(server){
    return function(router) {
        router.post('/captchacode', function *(next) {
            server.log('info', 'got a captchacode request');
            this.request.body;
            server.phantomSocket.emit(
                'cmd',
                {
                    action: 'sessionAction',
                    sessionAction: 'Captcha',
                    params: this.request.body.code,
                    sessionId: this.request.body.sid
                }
            );
        });
    }
};