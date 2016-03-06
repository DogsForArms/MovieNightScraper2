var btoa2 = require('btoa')

module MovieNightAPI {
    export class Raw implements MediaFinder {
        //resolver properties

        recognizesUrlMayContainContent(url: string): boolean {
            return true
        }

        scrape(url: string, process: ProcessNode): void {
            this.scrapeForUrls(url, process)
        }

        scrapeForUrls(url: string, process: ProcessNode, ignore?: (url: string) => boolean): void {

            var tempMediaOwner: MediaOwnerInfo = {
                domain: 'movienight.it',
                name: 'MovieNight Scraper',
                needsClientRefetch: false
            }
            ResolverCommon.getMimeType(url, tempMediaOwner, process).then(function(mimeType) {

                var isText = /(text\/)/.execute(mimeType) != null
                var ifMimeTypeIsValidCreate = function(theUrl: string, mType: string, mProcess: ProcessNode): boolean {
                    if (mimeTypeIsValid(mType)) {
                        var content = new Content(tempMediaOwner, btoa2(url))
                        var stream = new UrlStream(theUrl)
                        stream.mimeType = mType

                        content.streams = [stream]
                        MovieNightAPI.finishedWithContent(content, tempMediaOwner, mProcess)

                        return true
                    }
                    return false
                }


                if (isText) {
                    //parse for all urls
                    ResolverCommon.get(url, tempMediaOwner, process).then(function(html) {
                        // var alreadyUsedUrls: any = {}
                        // alreadyUsedUrls[url] = true

                        var urls = RegExp.allUrls(html, [url])
                        if (ignore) {
                            urls = urls.filter(ignore)
                        }
                        // var urls1 = /((http|https):\/\/.*?)["';$]/g.executeAll(html)
                        // var urls2 = /((http|https):\\\/\\\/.*?)["';$]/g.executeAll(html).map(function(url) {
                        //     var r = url.replace(/\\/g, '')
                        //     return r
                        // })
                        // var urls = urls1.concat(urls2)
                        // .filter(function(url) {
                        //     if (!alreadyUsedUrls[url]) {
                        //         alreadyUsedUrls[url] = true
                        //         return true
                        //     }
                        //     return false
                        // })
                        // console.log(JSON.stringify(urls, null, 4).yellow)

                        if (urls.length == 0) {
                            var noResponse = new ResolverError(ResolverErrorCode.NoResponders, "Sorry, we do not know what to do with this url.")
                            process.processOne({ 'type': ResultType.Error, 'error': noResponse })
                        }
                        else {
                            var urlResponderProcess = urls.map(function(url) {
                                var responders = resolvers().filter(function(resolver) { return resolver.recognizesUrlMayContainContent(url) })

                                return {
                                    'url': url,
                                    'responder': responders,
                                    'process': responders.length > 0 ? process.newChildProcess() : null
                                }
                            })

                            var logRespondersStr = urlResponderProcess.reduce(function(l, touple) {
                                return l + (l.length > 0 ? '\n' : '') + (touple.process == null ? touple.url.yellow : touple.url.yellow.inverse)
                            }, '')
                            console.debug(logRespondersStr)

                            var recognizedUrls = urlResponderProcess.filter(function(p) { return p.process != null })
                            if (recognizedUrls.length == 0) {
                                process.processOne({ 'type': ResultType.Error, 'error': noResponse })
                            } else {
                                recognizedUrls.forEach(function(touple) {
                                    touple.responder[0].scrape(touple.url, touple.process)
                                })
                            }



                            // urls.map(function(url) {
                            //     return {
                            //         'url': url,
                            //         'process': process.newChildProcess()
                            //     }
                            // })
                            //     .forEach(function(pair) {
                            //         ResolverCommon.getMimeType(pair.url, tempMediaOwner, pair.process).then(function(mimeType) {
                            //             if (!ifMimeTypeIsValidCreate(pair.url, mimeType, pair.process)) {
                            //                 var responders = resolvers().filter(function(resolver) { return resolver.recognizesUrlMayContainContent(pair.url) })
                            //                 var foundResponders = (responders.length > 0)
                            //                 reportResponder(pair.url, foundResponders)
                            //
                            //                 if (!foundResponders) {
                            //                     var noResponse = new ResolverError(ResolverErrorCode.NoResponders, "Sorry, we do not know what to do with this url.")
                            //                     pair.process.processOne({ 'type': ResultType.Error, 'error': noResponse })
                            //                 }
                            //                 else {
                            //                     responders
                            //                         .map(function(resolver) {
                            //                             return { 'resolver': resolver, 'process': pair.process.newChildProcess() }
                            //                         })
                            //                         .forEach(function(r) {
                            //                             r.resolver.scrape(pair.url, r.process)
                            //                         })
                            //                 }
                            //             }
                            //         })
                            //     })
                        }

                    })
                }
                else {
                    if (!ifMimeTypeIsValidCreate(url, mimeType, process)) {
                        var noResponse = new ResolverError(ResolverErrorCode.NoResponders, ("Sorry, we were unable to recognize the mime type of the url " + url + "."))
                        process.processOne({ 'type': ResultType.Error, 'error': noResponse })
                    }
                }
            })

        }

    }
}
