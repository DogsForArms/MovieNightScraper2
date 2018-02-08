import {Resolver} from '../Resolver'
import {ProcessNode} from '../ProcessNode'
import {ResolverCommon, extractMediaId, getHiddenPostParams} from '../ResolverCommon'
import {Content, finishedWithContent, UrlStream, RtmpStream} from '../Content'

export class Streamplay_to implements Resolver<string>
{
    domain = 'streamplay.to'
    name = 'StreamPlay.to'
    needsClientRefetch = true

    mediaIdExtractors: ((url: string) => (string))[] = [
        function(url) { return /streamplay\.to\/([a-zA-Z\d]*?)(\/|\.html|$)/.execute(url) }
    ]

    resolveId(mediaIdentifier: string, process: ProcessNode) {
        var self = this

        var url = ('http://streamplay.to/' + mediaIdentifier)
        ResolverCommon.get(url, self, process).then(function(html0) {
            var postParams = getHiddenPostParams(html0)
            var content = new Content(self, mediaIdentifier)
            content.title = postParams.fname

            setTimeout(function() {
                ResolverCommon.formPost(url, postParams, self, process).then(function(html) {
                    try {
                        var ugly = /<script.*?(eval\([\s\S]*?)<\/script>/.execute(html)
                        var beautiful = ResolverCommon.beautify(ugly)
                        var sourcesStr = /sources\s*:\s*\[([\s\S]*?)\]/.execute(beautiful)
                        content.streams = /\{([\s\S]*?)\}/g.executeAll(sourcesStr).map(function(sourceStr) {
                            var file = /file\s*:\s*["'](.*?)['"]/.execute(sourceStr)
                            if (/(rtmp:\/\/)/.execute(file)) {
                                var result = /(.*?mp4):(.*)/.exec(file)
                                return result ? new RtmpStream(result[1], result[2]) : null
                            } else {
                                var stream = new UrlStream(file)
                                stream.mimeType = "application/octet-stream"
                                return stream
                            }
                        })
                    } catch (e) { logError(e) }
                    finishedWithContent(content, self, process)
                })
            }, 8 * 1000)
        })
    }

    recognizesUrlMayContainContent(url: string): boolean {
        return extractMediaId(this, url) != null
    }

    scrape(url: string, process: ProcessNode) {
        extractMediaId(this, url, process)
    }
}

