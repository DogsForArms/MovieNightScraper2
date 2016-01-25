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

RegExp.prototype.execAll = function(str: string): RegExpExecArray[]
{
	var self = this
	var results: RegExpExecArray[] = []

	var val: RegExpExecArray
	while ((val = self.exec(str)) != null) {
		results.push(val)
	}

	return results
}

interface RegExp 
{
	execute(str: string): string
	executeAll(str: string): string[]
	execAll(str: string): RegExpExecArray[]
}

RegExp.curryExecute = function(str: string): ((reg: RegExp) => (string)) {
	return function(reg: RegExp): string {
		return reg.execute(str)
	}
}
interface RegExpConstructor {
	curryExecute(str: string): ((reg: RegExp) => (string))
// 	executeAll(obj: StringToRegExpMap, str: string): StringToStringMap
}