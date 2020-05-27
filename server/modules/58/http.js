module.exports = function(server){
    return function(router) {
        router.get('/58/widget', function *(next) {
            yield this.render('modules/58/views/58', {
                title: '58',
                styles: ['/image-picker/image-picker.css'],
                scripts: ['/image-picker/image-picker.min.js', '/jquery.validate/jquery.validate.js',
                    '/jquery.cascadingdropdown/jquery.cascadingdropdown.js',
                    '/socket.io/socket.io.js', '/58/widget.js']
            });
        });
        router.get('/58/categories', function *(next) {
            var cats = new Map();
            cats.set(39, [
                {
                    label: '电视机',
                    value: 0
                },
                {
                    label: '洗衣机',
                    value: 1
                },
                {
                    label: '生活家电',
                    value: 524154
                },
                {
                    label: '厨卫家电',
                    value: 524155
                }
            ]);
            cats.set(41, [
                {
                    label: '服装',
                    value: 0
                },
                {
                    label: '箱包',
                    value: 4
                }
            ]);
            cats.set(40, [
                {
                    label: '床上用品',
                    value: 389270
                },
                {
                    label: '布艺饰品',
                    value: 388123
                }
            ]);
            cats.set(37, [
                {
                    label: '相机/配件',
                    value: 0
                },
                {
                    label: '数码摄像机',
                    value: 1
                },
                {
                    label: '智能设备',
                    value: 721029
                }
            ]);
            cats.set(45, [
                {
                    label: '童床童车',
                    value: 551173
                },
                {
                    label: '玩具',
                    value: 3
                }
            ]);

            this.body = cats.get(parseInt(this.request.query.top));
        });
    }
};