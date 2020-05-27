const moment = require('moment');

module.exports = function (browser, logger, io) {
    var that = require('../../lib/BaseJDAgent')(browser, logger, 'jd-quan', io);
    var super_onPageCreated = that.onPageCreated;

    var onPageCreated = function () {
        super_onPageCreated();

        that.page.on('load', async () => {
            if (that.page.url().indexOf('https://m.jd.com/?indexloc=1&sid=') == 0) {
                logger.log('info', 'We are in the index page now');
                that.closePage();//we do not need this page any more
                let delay = moment(that.request.startDate).diff(moment(), 'milliseconds') - that.config.advanceStart;
                if (delay > 0) {
                    let times = delay / that.config.advanceInterval;
                    for (let i = 0; i <= times; i++) {
                        (async () => {
                            let page = await browser.newPage();
                            setTimeout(
                                () => {
                                    logger.log('info', 'goto quan link');
                                    await page.goto(that.request.url);
                                    page.close();
                                    if(i == times){
                                        that.finished();
                                    }
                                },
                                delay + i * that.config.advanceInterval
                            );
                        })();
                    }
                } else {
                    logger.log('info', 'Time is passed');
                }
            } else {
                let fileName = moment().format('x') + '.png';
                logger.log('info', 'we got to page:' + that.page.url() + ' the screenshot is ' + fileName);
                that.condScreenshot(fileName);
            }
        });
    };

    that.onPageCreated = onPageCreated;

    return that;
};
