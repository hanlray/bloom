module.exports = function(server){
    return function(router) {
        router.get('/jd/quan', async (ctx, next) => {
            await ctx.render('modules/jd-quan/views/quan', {
                title: '京东抢券',
                base: '/jd-quan/',
                styles: [],
                scripts: [],
            });
        });
        router.get('/jd/quan2', async (ctx, next) => {
            await ctx.render('modules/jd-quan/views/quan2', {
                title: '京东抢券2',
                styles: [],
                scripts: ['/jquery.validate/jquery.validate.js',
                    '/socket.io/socket.io.js',
                    '/jd-quan/widget.js']
            });
        });        
        router.post('/jd/quan', async (ctx, next) => {
            //var startDate = ctx.request.body.startDate;
            //delete ctx.request.body.startDate;

            var job = {
                module: 'jd-quan',
                //startDate: startDate,
                data: ctx.request.body
            };
            job.data.startUrl = 'https://passport.m.jd.com/user/login.action?returnurl=https://m.jd.com?indexloc=1';

            var id = await server.jobProcessor.process(job);
            ctx.body = {id: id};
        });
    }
};