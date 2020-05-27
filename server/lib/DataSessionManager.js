/**
 * Created by ray on 1/31/2016.
 */
module.exports = function(){
    var that = {};
    var sessionId = 1;//current available session id
    var sessions = new Map();

    var create = function(){
        var session = {
            id: sessionId
        };
        sessions.set(sessionId++, session);
        return session;
    };

    var get = function(sessionId){
        if(sessions.has(sessionId)) return sessions.get(sessionId);
        return null;
    };

    that.create = create;
    that.get = get;

    return that;
}