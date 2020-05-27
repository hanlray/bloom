module.exports = function(server){
    return function(router) {
        router.get('/pricemon/tmall', function *(next) {
            yield this.render('modules/pricemon/views/tmall', {
                title: '监控商品',
                styles: [],
                scripts: ['/jquery.validate/jquery.validate.js',
                    '/socket.io/socket.io.js', '/pricemon/widget.js']
            });
        });
    }
};