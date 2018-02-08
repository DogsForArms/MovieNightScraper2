import {Resolver, ResolverError, ResolverErrorCode, ResultType} from '../Resolver'
import {ProcessNode} from '../ProcessNode'
import {ResolverCommon, extractMediaId, getHiddenPostParams} from '../ResolverCommon'
import {Content, UrlStream, finishedWithContent} from '../Content'
import {pairResolversWithUrls, resolvers} from '../Public'

export class Solarmovie_ph implements Resolver<string>
{
    domain = 'solarmovie.ph'
    name = 'solarmovie'
    needsClientRefetch = true


    domainRegex = /(solarmovie\.ph)/
    mediaIdExtractors: ((url: string) => (string))[] = [
        function(url) { return /solarmovie\.ph\/link\/play\/(\d*?)\/?$/.execute(url) },
        function(url) { return /solarmovie\.ph\/link\/show\/(\d*?)\/?$/.execute(url) }
    ]

    resolveId(mediaIdentifier: string, process: ProcessNode) {
        var self = this
        var url = ("http://cinema.solarmovie.ph/link/play/" + mediaIdentifier + "/")
        ResolverCommon.get(url, self, process).then(function(html) {
            var embedUrl = /<iframe.*?src=["'](.*?)["']/.execute(html)
            let res = resolvers().filter(function(resolver) {
                return resolver.domain != self.domain
            })
            pairResolversWithUrls(res, [embedUrl], process).forEach(function(pair) {
                pair.resolvers[0].scrape(pair.url, pair.process)
            })
        })
    }

    recognizesUrlMayContainContent(url: string): boolean {
        var self = this
        if (extractMediaId(self, url) != null) {
            return true
        }
        return this.domainRegex.execute(url) != null
    }

    scrape(url: string, process: ProcessNode) {
        var self = this
        if (extractMediaId(self, url) != null) {
            extractMediaId(self, url, process)
        }
        else {
            //extract collection
            ResolverCommon.get(url, self, process).then(function(html) {
                var hrefReg = /<a href=["']\/link\/show\/(\d*?)\/?['"]/g

                var resCount = 0
                var val: RegExpExecArray
                var hrefs: string[] = []
                while (resCount < 20 && (val = hrefReg.exec(html)) != null) {
                    resCount++
                    hrefs.push(val[1])
                }

                hrefs.map(function(mediaId) {
                    return {
                        'mediaId': mediaId,
                        'process': process.newChildProcess()
                    }
                }).forEach(function(mediaIdAndProcess) {
                    self.resolveId(mediaIdAndProcess.mediaId, mediaIdAndProcess.process)
                })

                if (hrefs.length == 0) {
                    var noResponse = new ResolverError(ResolverErrorCode.NoResponders, "Sorry, we do not know what to do with this url.")
                    process.processOne({ 'type': ResultType.Error, 'error': noResponse })
                }
            })
        }
    }
}

