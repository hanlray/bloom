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
		_logg = function(msg,func){
		if(!_logging){return; }
		if (msg && window.console && window.console.log){window.console.log(_loggerPrefix + msg)}

		if (func && func instanceof Function && window.console && window.console.dir){func();}
		},
		deferred = new jQuery.Deferred(),
		_utils = {},
		_constants = {};

		_constants.MAX_ITERATIONS = 100;
		_constants.POLL_DELAY = 250;

	_utils.pollForElement  = function (selector,options){
		options = (options && options instanceof Object) ? options : {};

		_logg('_utils.pollForElement',function(){
			console.dir(options);
		});

		var i = 0,
			max = ( ( options.maxIterations && !(isNaN(options.maxIterations) ) ) ? options.maxIterations : _constants.MAX_ITERATIONS),
			delay = ( ( options.pollDelay && !(isNaN(options.pollDelay) ) ) ? options.pollDelay : _constants.POLL_DELAY),
			win = window,
			deferred = new jQuery.Deferred(),
			pollInterval = null,
			elementExists = function(counter){
				_logg('>> checking for: ' + selector + 'iteration: ' + counter);

				options.progress(selector,counter);

				return (jQuery(selector).length) ? true : false;
			},
			resolveDeferred = function(){
				deferred.resolve();
			},
			endTimer = function(){
				_logg('>> endTimer');
				clearInterval(pollInterval);
			},
			elementFound = function(){
				_logg( ('>> ' + selector +  ' FOUND') );
				endTimer();
				resolveDeferred();
			};

		selector =  selector || '';

		options.progress = (options.progress && options.progress instanceof Function) ? options.progress : function(){};

		options.failure = (options.failure && options.failure instanceof Function) ? options.failure : function(){};

		if (elementExists(i)){
			elementFound();
		} else {
			pollInterval = setInterval(function(){
				i++;

				//_logg('pollInterval | max: ' + max + ', delay: ' + delay);

				if (i > max){
					endTimer();
					_logg( ('>> unable to find element: ' + selector) );
					options.failure(selector,i);
				}

				if (elementExists(i)) {
					elementFound();
				}
			},delay);
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

	_utils.pollForManyWithOptions = function(options,callback){
		_logg('_utils.pollForManyWithOptions');

		var asyncArray = [];

		options = options || {};

		options.elements = options.elements || [];

		$.each(options.elements,function(index,selector){
			asyncArray.push(_utils.pollForElement(selector,options));
		});

		jQuery.when.apply(jQuery, asyncArray).done(function(){
			if(options.success && options.success instanceof Function){options.success();}
			if(callback && callback instanceof Function){callback();}
		});
	};

	$.waitFor = function(selectorArrayOrOptions) {
		//if this polugin is invoken on an empty set, then let's not waste time
		//if (!this.length){return;}

		_logg('_utils.plugin instantiated');

		function resolveThis(){
			deferred.resolve();
		};

		//find out what was papssd-in
		if (typeof selectorArrayOrOptions === 'string'){
			_utils.pollForElement(selectorArrayOrOptions).done(function(){
				deferred.resolve();
			});
		} else if (selectorArrayOrOptions instanceof Array){
			_utils.pollForMany(selectorArrayOrOptions,function(){
				deferred.resolve();
			});
		} else if (selectorArrayOrOptions instanceof Object){
			_logging = selectorArrayOrOptions.logging || _logging;

			_utils.pollForManyWithOptions(selectorArrayOrOptions,function(){
				deferred.resolve();
			});
		}

		this.each(function(index){
			
		});

	return deferred;
	};	
})(jQuery);