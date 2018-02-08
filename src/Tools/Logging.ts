function logError(error: Error)
{
	console.log(error.message.red.bold, error.name.underline.red.bold)
}

var log: any
(function() {
	var method: string;
	var noop = function() { };
	var methods = [
		'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
		'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
		'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
		'timeStamp', 'trace', 'warn'
	];
	var length = methods.length;
	var console: any = {}

	while (length--) {
		method = methods[length];

		// Only stub undefined methods.
		if (!console[method]) {
			console[method] = noop;
		}
	}


	if (Function.prototype.bind) {
		log = Function.prototype.bind.call(console.log, console);
	}
	else {
		log = function() {
			Function.prototype.apply.call(console.log, console, arguments);
		};
	}
})();
var a = { b: 1 };
var d = "test";
log(a, d);
log("hello world")