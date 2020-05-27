/**
 * Created by ray on 2/23/2016.
 */
//console.log('test');
var fileUrl = process.argv[2];
var path = require('url').parse(fileUrl).pathname;//console.log(path);
var suffix = path.substring(path.lastIndexOf('.'));
//var dest = require('path').join(process.cwd(), 'Downloads', fileName);//console.log('dest is:'+dest);
var dest = require('temp').path({
        suffix: suffix,
        dir: require('path').join(process.cwd(), "Downloads")
    }
);//console.log(dest);
/*
require('http-request').get(fileUrl, dest, function(error, result){
    if(error) throw error;
    console.log(result.file);
    process.exit();
});
*/
var Download = require('download');
new Download({mode: '777'})
    .get(fileUrl)
    .rename(require('path').basename(dest))
    .dest(require('path').dirname(dest))
    .run(function(err, files){
        if(err) throw err;
        console.log(dest);
        process.exit();
    });
