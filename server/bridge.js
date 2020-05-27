//Released to the public domain.

var port = require('system').args[1];
var webpage = require('webpage');
var controlpage = webpage.create();

var fs = require('fs');

function respond(response){
//	console.log('responding:'+response);
    controlpage.evaluate('function(){socket.emit("res",'+JSON.stringify(response)+');}');
}

var sessions = {};//TODO to release doers that have not been active for a long time
controlpage.doerFinished = function(sid){
    delete sessions[sid];
};
controlpage.onCallback = function(request){//console.log('onCallback: ' + JSON.stringify(request));
    var action = request.action;
    if(action == 'start'){//general event, a module can do anything with this pattern
        //An agent runs in the context of phantomjs, it performs one job (for example, do a rush) by first
        //start to do that job via the start method, then may receive successive instructions to finish
        //the thing. So an agent can be thought as performing a thing in several steps or performing a thing
        //in a session.
        //console.log('[phantomjs]got a job start message for module '+request.module);
        var agent = require('./modules/' + request.module + '/phantomjs')(controlpage);
        console.log('[phantomjs]an agent created');
        var sessionId = request.sessionId;
        sessions[sessionId] = agent;
        //pass session here to make possible to reuse existing doers in the future
        agent.start(request.data, sessionId);
    } else if(action == 'sessionAction'){
        console.log('sessionAction:' + request.sessionAction + ' sessionId:' + request.sessionId);
        var buyer = sessions[request.sessionId];
        buyer['on'+request.sessionAction](request.params);
    }
};

controlpage.onConsoleMessage=function(msg){
	return console.log('console msg:'+JSON.stringify(msg));
};

controlpage.open('http://localhost:'+port+'/',function(status){
	//console.log(status);
});
