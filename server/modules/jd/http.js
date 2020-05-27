/**
 * Created by ray on 6/8/2016.
 */
module.exports = function(server){
    return function(router) {
        router.get('/widget/jd', function *(next) {
            var isBuyNow = this.request.query.buynow == 'true';
            var params = {
                itemId: this.request.query.itemId
            };
            if (!isBuyNow) {
                params.price = this.request.query.price;
            }
            this.session.client = 'jd';

            //this.body = this.session.client;
            yield this.render('modules/jd/views/jd', {
                title: '京东',
                isBuyNow: isBuyNow,
                params: params,
                scripts: ['/socket.io/socket.io.js', '/jd/widget.js']
            });
        });
        router.get('/widget/jd-monitor', function *(next) {
            var isBuyNow = this.request.query.buynow == 'true';
            var params = {
                id: this.request.query.id
            };

            yield this.render('modules/jd/views/monitor', {
                title: '京东秒',
                params: params,
                scripts: ['/socket.io/socket.io.js', '/jd/widget.js']
            });
        });
    }
};