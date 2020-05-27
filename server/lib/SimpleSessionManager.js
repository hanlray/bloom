/**
 * Created by ray on 1/31/2016.
 */
module.exports = function(){
    var that = {};
    var sessionId = 1;//current available session id

    var generateSID = function(prefix){
        return prefix+'_'+sessionId++;
    };

    that.generateSID = generateSID;

    return that;
};