RegExp.prototype.execute = function(str: string) {

	var results: RegExpExecArray = this.exec(str)
	if (results) {
		return results[1]
	}
	return null
}

interface RegExp {
	execute(str: string): string
}

interface StringToRegExpMap { [s: string]: RegExp; }
interface StringToStringMap { [s: string]: string; }

RegExp.executeAll = function(obj: StringToRegExpMap, str: string): StringToStringMap {
	var self = this
	if (str === undefined) {
		throw new Error("executeAll from " + self.host + " has no string input")
	}

	var acc: StringToStringMap = {}

	return Object.keys(obj).reduce(function(l, regKey) {
		var regex = obj[regKey]
		var result = regex.execute(str)
		l[regKey] = result
		
		return l
	}, acc)
}
interface RegExpConstructor {
	executeAll(obj: StringToRegExpMap, str: string): StringToStringMap
}