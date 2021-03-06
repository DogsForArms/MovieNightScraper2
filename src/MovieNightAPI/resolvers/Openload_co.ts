import {Resolver} from '../Resolver'
import {ProcessNode} from '../ProcessNode'
import {ResolverCommon, extractMediaId} from '../ResolverCommon'
import {Content, UrlStream, finishedWithContent} from '../Content'

export class Openload_co implements Resolver<string>
{
    domain = 'openload.co'
    name = 'Openload.co'
    needsClientRefetch = true

    mediaIdExtractors: ((url: string) => (string))[] = [
        function(url) { return /openload\.co\/f\/(.+?)\//.execute(url) },
        function(url) { return /openload\.co\/f\/(.+?)(\.html)?$/.execute(url) },
        function(url) { return /openload\.co\/embed\/(.*?)(\/|.*?\.html|$)/.execute(url) }
    ]

    resolveId(mediaIdentifier: string, process: ProcessNode) {
        var self = this

        var url = ('http://openload.co/f/' + mediaIdentifier)
        ResolverCommon.get(url, self, process).then(function(html) {
            var content = new Content(self, mediaIdentifier)
            try {
                content.title = /<title>(.+)?<\/title>/.execute(html)
                content.snapshotImageUrl = /poster\s*?=\s*?["'](.*?)["']/.execute(html)
                content.streams = /<script.*?>([\s\S]*?)<\/script>/g.executeAll(html)
                    .filter(function(s) { return s.length > 0 })
                    .map(ResolverCommon.beautify)
                    .reduce(function(l, c) {
                        var stream = new UrlStream(/window\.vr\s*=\s*["'](.+?)["']/.execute(c))
                        stream.mimeType = /window\.vt\s*=\s*["'](.*?)["']/.execute(c)
                        if (stream.isValid()) {
                            l.push(stream)
                        }
                        return l
                    }, [])
            } catch (e) { logError(e) }
            finishedWithContent(content, self, process)

        })
    }

    recognizesUrlMayContainContent(url: string): boolean {
        return extractMediaId(this, url) != null
    }

    scrape(url: string, process: ProcessNode) {
        extractMediaId(this, url, process)
    }
}

