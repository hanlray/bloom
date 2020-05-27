module.exports = function(server){
    return function(router) {
        router.get('/tb/copy/', function *(next) {
            var url;
            if(url = this.request.query.url){
                server.log('info', '[tb-itemcopy]Received a copy request:'+url);
                var url = require("url").parse(url, true);
                if(!url.query.id) return;

                var job = {
                    module: 'tb-itemcopy',
                    data: {
                        id: url.query.id,
                        isTmall: (url.hostname == 'detail.tmall.com')? true : false
                    }
                };

                var id = yield server.doJob(job);
                this.redirect('/tb/copy-view?id='+id);
                return;
            }
            yield this.render('modules/tb-itemcopy/views/copy', {
                title: '复制宝贝',
                styles: [],
                scripts: ['/jquery.validate/jquery.validate.js']
            });
        });
        router.get('/tb/copy-view', function *(next) {
            if(!this.request.query.id) return;

            var params = {
                id: this.request.query.id
            };
            yield this.render('modules/tb-itemcopy/views/view', {
                title: '复制进程',
                styles: [],
                params: params,
                scripts: ['/socket.io/socket.io.js', '/tb-itemcopy/widget.js']
            });
        });
    }
};