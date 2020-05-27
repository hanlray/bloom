var Promise = require('bluebird');
const httpOpts = {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36'
    },
    encoding: null
};
var requestDefaults = require('request').defaults(httpOpts);
var request = Promise.promisify(requestDefaults);
var iconv = require('iconv-lite');
var fsExtra = Promise.promisifyAll(require('fs-extra'));
var path = require('path');
var streamToPromise = require('stream-to-promise');
var got = require('got');

//get item information, download images and then pass those information to the phantomjs side to
// publish this item
function startjob(job){
    var jobstarter = this,
        $,
        primariesPath = path.join(startjob.server.resideDir, 'downloads', job.data.id),
        colorsPath = path.join(primariesPath, 'colors');

    var getShopConfig = function(){
        var script = $('#J_FrmBid').nextAll('script').get(2);
        var scriptText = $(script).text();
        var match = scriptText.match(/TShop\.Setup\(\s*(\{.+\})\s*\);/);
        if(!match) return null;

        return JSON.parse(match[1]);
    };

    var formatSkuProps = function(skuList){
        var map = new Map();
        skuList.forEach(function(skuItem){
            var props = skuItem.pvs.split(';');
            for(var i=props.length-1;i>=0;i--) {
                var prop = props[i].split(':');
                var propId = prop[0];
                var propValue = prop[1];
                if(!map.has(propId)){
                    map.set(propId, new Set([propValue]));
                }else{
                    map.get(propId).add(propValue);
                }
            }
        });
        //return map;

        var result = {};
        var skuCount = 1;
        for (var propId of map.keys()) {
            var propValues = map.get(propId);
            result[propId] = Array.from(propValues.keys());
            skuCount *= propValues.size;
        }
        result.propIds = Array.from(map.keys());
        result.skuCount = skuCount;
        return result;
    };

    var downloadPrimaries = function(){
        var primaryImages = [],
            downloads = [];

        $('#J_UlThumb a img').each(function(index){
            var thumbSrc = $(this).attr('src');
            var largeImageUrl = thumbSrc.replace('60x60', '800x800');
            var dest = path.join(primariesPath, (++index) + '.jpg');
            downloads.push(streamToPromise(got.stream('http:'+largeImageUrl, httpOpts).pipe(fsExtra.createWriteStream(dest)))
                .then(function(){
                    primaryImages.push(dest);
                })
                .catch(function(e){
                    startjob.server.log('downloading '+largeImageUrl+ ' is failed');
                })
            );
        });
        if(downloads.length > 0){
            return Promise.all(downloads).then(function(){
                return primaryImages;
            });
        }
        //no primary images? throw an exception
        throw "No primary images";
    };

    var doColors = function(){
        var colorsInfo = {};
        var downloads = [];
        $('ul.tb-img li').each(function(){
            var prop = $(this).attr('data-value');
            var valueId = prop.split(':')[1];
            var title = $(this).attr('title');
            colorsInfo[valueId] = { text: title };

            var aStyle = $(this).find('a').attr('style');
            if(aStyle) {
                var thumbImageUrl = aStyle.match(/url\(\/\/(.+)\)/)[1];
                var largeImageUrl = thumbImageUrl.replace('40x40', '800x800');
                var dest = path.join(colorsPath, valueId + '.jpg');
                downloads.push(streamToPromise(got.stream(largeImageUrl, httpOpts).pipe(fsExtra.createWriteStream(dest)))
                    .then(function(){
                        colorsInfo[valueId].image = dest;
                    })
                    .catch(function(err){
                        startjob.server.log('downloading '+largeImageUrl+ ' is failed');
                    })
                );
            }
        });

        if(downloads.length > 0) {
            return Promise.all(downloads).then(function(){
               return colorsInfo;
            });
        }
        return colorsInfo;
    };

    Promise.coroutine(function*(){
        var url = job.data.isTmall? 'https://detail.tmall.com/item.htm?id='+job.data.id:
        'https://item.taobao.com/item.htm?id=' + job.data.id;

        var response = yield request(url);
        if(response.statusCode != 200) return;

        var body = iconv.decode(response.body, 'gbk');
        $ = require('cheerio').load(body);

        var shopConfig = getShopConfig();
        if(!shopConfig) return;

        var skuProps = formatSkuProps(shopConfig.valItemInfo.skuList);

        yield fsExtra.mkdirsAsync(primariesPath);

        var primaryImages = yield downloadPrimaries();

        yield fsExtra.mkdirsAsync(colorsPath);
        var colorsInfo = yield doColors();

        job.data = {
            itemId: job.data.id,
            catId: shopConfig.itemDO.categoryId,
            title: '韩版印花翻领polo连衣裙女装中长款2016夏季新款韩国宽松短袖裙子',
            props: require('./categories/'+shopConfig.itemDO.categoryId)(body),
            primaryImages: primaryImages,
            //skuMap: shopConfig.valItemInfo.skuMap,
            skuProps: skuProps,
            price: 10,
            quantity: 1,
            deliverTemplate: '免运费'
        };
        if(Object.keys(colorsInfo).length > 0){
            job.data.colorsInfo = colorsInfo;
        }
        startjob.server.phantomStartJob(job);
    })();
}

//exports a job-starter factory function which produces a job-starter function when being called
//a job-starter function starts a job when being called
module.exports = function(server){
    startjob.server || (startjob.server = server);
    return startjob;
};