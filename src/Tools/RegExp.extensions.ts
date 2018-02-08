export {}
    
declare global {
    interface RegExp {
        execute(str: string): string
        executeAll(str: string): string[]
        execAll(str: string): RegExpExecArray[]
    }

    interface RegExpConstructor {
        curryExecute(str: string): ((reg: RegExp) => (string))
        allUrls(html: string, excluding?: string[]): string[]
        // 	executeAll(obj: StringToRegExpMap, str: string): StringToStringMap
    }
}

RegExp.prototype.execute = function(this: RegExp, str: string) {

    var results: RegExpExecArray = this.exec(str)
    if (results) {
        return results[1]
    }
    return null
}
RegExp.prototype.executeAll = function(this: RegExp, str: string): string[] {
    var self = this
    var results: string[] = []

    var val: string
    while ((val = self.execute(str)) != null) {
        results.push(val)
    }

    return results

}

RegExp.prototype.execAll = function(this: RegExp, str: string): RegExpExecArray[] {
    var self = this
    var results: RegExpExecArray[] = []

    var val: RegExpExecArray
    while ((val = self.exec(str)) != null) {
        results.push(val)
    }

    return results
}

RegExp.curryExecute = function(str: string): ((reg: RegExp) => (string)) {
    return function(reg: RegExp): string {
        return reg.execute(str)
    }
}
RegExp.allUrls = function(html: string, excluding?: string[]): string[] {
    var alreadyUsedUrls: any = (excluding || []).reduce(function(l: any, c) {
        l[c] = true
        return l
    }, {})

    var urls1 = /((http|https):\/\/.*?)["';$]/g.executeAll(html)
    var urls2 = /((http|https):\\\/\\\/.*?)["';$]/g.executeAll(html).map(function(url) {
        var r = url.replace(/\\/g, '')
        return r
    })
    return urls1.concat(urls2).filter(function(url) {
        if (!alreadyUsedUrls[url]) {
            alreadyUsedUrls[url] = true
            return true
        }
        return false
    })
}
