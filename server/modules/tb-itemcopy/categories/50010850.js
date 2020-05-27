/**
 * Created by ray on 7/27/2016.
 */
module.exports = function(body){
    var match = body.match(/门数量:(.+)<\/li>/);
    var result = {};
    if(match){
        result.prop_122216347 = entities.decode(match[1]);
    }

    return result;
};