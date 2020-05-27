/*!
 * jquery.waitFor plugin v1
 *
 * Copyright 2015 Kevin Chisholm
 * Released under the MIT license
 * http://kevinchisholm.com/
 *
 * Date: 2015-01-10
 */

(function($){
	var _logging = false,
		_loggerPrefix = 'jQueryWaitFor: ',
		_logg = function(msg, func){
			if(!_logging){ return; }
			if (msg && window.console && window.console.log){window.console.log(_loggerPrefix + msg)}

			if (func && func instanceof Function && window.console && window.console.dir){ func();}
		},
		deferred = new jQuery.Deferred(),
		_utils = {},
		_constants = {};

		_constants.MAX_ITERATIONS = 100;
		_constants.POLL_DELAY = 250;

	_utils.pollOne = function (testFn, options){
		options = (options && options instanceof Object) ? options : {};

		_logg('_utils.pollForElement',function(){
			console.dir(options);
		});

		var i = 0,
			max =  options.maxTimes || _constants.MAX_ITERATIONS,
			delay = options.pollDelay || _constants.POLL_DELAY,
			deferred = new $.Deferred(),
			pollInterval = null,
			endTimer = function(){
				_logg('>> endTimer');
				clearInterval(pollInterval);
			};

		//options.progress = (options.progress && options.progress instanceof Function) ? options.progress : function(){};
		//options.failure = (options.failure && options.failure instanceof Function) ? options.failure : function(){};

		if(testFn()){
			deferred.resolve();
		} else {
			pollInterval = setInterval(function(){
				i++;

				_logg('pollInterval: ' + i);

				if (i > max){
					endTimer();
					//_logg( ('>> unable to find element: ' + selector) );
					//options.failure(selector,i);
					deferred.reject();
				}else {
					if (testFn()) {
						endTimer();
						deferred.resolve();
					}
				}
			}, delay);
		}

		return deferred;
	};

	_utils.pollForMany = function(elementArray,callback){
		_logg('_utils.pollForMany');

		var asyncArray = [];

		elementArray = elementArray || [];

		$.each(elementArray,function(index,selector){
			asyncArray.push(_utils.pollForElement(selector));
		});

		jQuery.when.apply(jQuery, asyncArray).done(function(){
			if(callback && callback instanceof Function){callback();}
		});
	};

	_utils.pollForManyWithOptions = function(options){
		_logg('_utils.pollForManyWithOptions');

		var asyncArray = [];

		options = options || {};

		options.visibleElements = options.visibleElements || [];

		$.each(options.visibleElements, function(index, selector){
			asyncArray.push(_utils.pollOne(function(){
				var elem = document.querySelector(selector);
				if(!elem) return false;
				return (elem.offsetParent != null);
			}, options));
			_logg('a Deferred pushed');
		});
		_logg('before Deferred array returned');
		return $.when.apply($, asyncArray);
	};

	$.waitFor = function(options) {
		//find out what was papssd-in
		if (typeof options === 'string'){
			_utils.pollForElement(options).done(function(){
				deferred.resolve();
			});
		} else if (options instanceof Array){
			_utils.pollForMany(options,function(){
				deferred.resolve();
			});
		} else if (options instanceof Object){
			_logging = options.logging || _logging;

			if(options.testFn){
				return _utils.pollOne(options.testFn, options);
			}else if(options.visibleElements) {
				var asyncArray = [];
				$.each(options.visibleElements, function(index, selector){
					asyncArray.push(_utils.pollOne(function(){
						var elem = document.querySelector(selector);
						if(!elem) return false;
						return (elem.offsetParent != null);
					}, options));
				});
				return $.when.apply($, asyncArray);
			}
		}

		return deferred;
	};
})(jQuery);