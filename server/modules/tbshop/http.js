module.exports = function(server){
    return function(router) {
        router.get('/tbshop/widget', function *(next) {
            yield this.render('modules/tbshop/views/widget', {
                title: 'tbshop',
                styles: ['/image-picker/image-picker.css'],
                scripts: ['/image-picker/image-picker.min.js', '/jquery.validate/jquery.validate.js',
                    '/jquery.cascadingdropdown/jquery.cascadingdropdown.js',
                    '/socket.io/socket.io.js', '/tbshop/widget.js']
            });
        });
    }
};