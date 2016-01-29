
// // function print(message?:any, ...optionalParams: any[]): void
// // {
// // 	console.log.apply(this, Array.prototype.slice.call(arguments))
// // }


// Function.prototype.name = function(): string
// {
// 	var myName = arguments.callee.toString()
// 	myName = myName.substr('function '.length)
// 	myName = myName.substr(0, myName.indexOf('('))
// 	return name
// }
// interface Function
// {
// 	name(): string
// } 



// class something
// {
// 	iAmAFunction()
// 	{
// 		console.log(this.prototype)
// 	}
// }
// iAmAFunction()


function logError(error: Error)
{
	var func = console.log.bind(window.console)

	console.log(error.message.bold.red, error.name.underline.bold.red)
	func('hello')
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