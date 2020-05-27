/**
 * Created by ray on 7/27/2016.
 */
var Entities = require('html-entities').AllHtmlEntities;
var entities = new Entities();

module.exports = function(body){
    var result = {};
    function match(regex, propName){
        var match = body.match(regex);
        match && (result[propName] = entities.decode(match[1]).trim());
    }

    match(/品牌:(.+)<\/li>/, 'prop_20000');
    match(/门数量:(.+)<\/li>/, 'prop_13744110');
    match(/款式:(.+)<\/li>/, 'prop_122276315');

    return result;
};