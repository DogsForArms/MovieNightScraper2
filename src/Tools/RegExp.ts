RegExp.prototype.execute = function(str: string) {

	var results: RegExpExecArray = this.exec(str)
	if (results) {
		return results[1]
	}
	return null
}
RegExp.prototype.executeAll = function(str: string): string[]
{
	var self = this
	
	var results: string[] = []

	var val: string
	while ((val = self.execute(str)) != null)
	{
		results.push(val)
	}

	return results
	
}

interface RegExp {
	execute(str: string): string
	executeAll(str: string): string[]
}

// interface StringToRegExpMap { [s: string]: RegExp; }
// interface StringToStringMap { [s: string]: string; }

// RegExp.executeAll = function(obj: StringToRegExpMap, str: string): StringToStringMap {
// 	var self = this
// 	if (str === undefined) {
// 		throw new Error("executeAll from " + self.host + " has no string input")
// 	}

// 	var acc: StringToStringMap = {}

// 	return Object.keys(obj).reduce(function(l, regKey) {
// 		var regex = obj[regKey]
// 		var result = regex.execute(str)
// 		l[regKey] = result
		
// 		return l
// 	}, acc)
// }
RegExp.curryExecute = function(str: string): ((reg: RegExp) => (string)) {
	return function(reg: RegExp): string {
		return reg.execute(str)
	}
}
interface RegExpConstructor {
	curryExecute(str: string): ((reg: RegExp) => (string))
// 	executeAll(obj: StringToRegExpMap, str: string): StringToStringMap
}