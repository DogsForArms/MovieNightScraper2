import {Resolver} from '../Resolver'
import {ProcessNode} from '../ProcessNode'
import {ResolverCommon, extractMediaId} from '../ResolverCommon'
import {Content, finishedWithContent, UrlStream} from '../Content'

export class Vidup_me implements Resolver<string>
{
    domain = 'vidup.me'
    name = 'Vidup'
    needsClientRefetch = true

    mediaIdExtractors: ((url: string) => (string))[] = [
        function(url) { return /vidup\.me\/embed-([a-zA-Z\d]*?)-/.execute(url) },
        function(url) { return /vidup\.me\/([a-zA-Z\d]*?)(\/)?(\.html)?$/.execute(url) }
    ]

    resolveId(mediaIdentifier: string, process: ProcessNode) {
        var self = this

        var url = ("http://beta.vidup.me/embed-" + mediaIdentifier + "-640x360.html")
        ResolverCommon.get(url, self, process).then(function(html) {
            var content = new Content(self, mediaIdentifier)

            try {
                var beautify = ResolverCommon.beautify(/<script.*?(eval[\s\S]*?)<\/script>/.execute(html))
                content.snapshotImageUrl = /image\s*:\s*["'](.*?)['"]/.execute(beautify)
                content.title = /title\s*:\s*["'](.*?)['"]/.execute(beautify)

                var sources = /sources\s*?:\s*?\[([\s\S]*?)\]/.execute(beautify)
                content.streams = /\{([\s\S]*?)\}/g.executeAll(sources).map(function(srcStr) {
                    var stream = new UrlStream(/file\s*:\s*["'](.*?)['"]/.execute(srcStr))
                    stream.name = /label\s*:\s*["'](.*?)['"]/.execute(srcStr)
                    stream.mimeType = "application/octet-stream"
                    return stream
                })
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