import {Resolver} from '../Resolver'
import {finishedWithContent, Content, RtmpStream} from '../Content'
import {ResolverCommon, extractMediaId, getHiddenPostParams} from '../ResolverCommon'
import {ProcessNode} from '../ProcessNode'

export class Bestreams_net implements Resolver<string>
{
    domain = "bestreams.net"
    name = "Bestreams"
    needsClientRefetch = true

    recognizesUrlMayContainContent(url: string): boolean {
        return extractMediaId(this, url) != undefined
    }

    mediaIdExtractors = [
        function(url: string) {
            return /bestreams\.net\/embed-(.*?)-/.execute(url)
        },
        function(url: string) {
            var possibleMediaId = /bestreams\.net\/([a-zA-Z\d]+)/.execute(url)
            return possibleMediaId == "embed" ? null : possibleMediaId
        }
    ]

    resolveId(mediaIdentifier: string, process: ProcessNode) {
        var self = this
        var url = ('http://bestreams.net/' + mediaIdentifier)
        var numRetries = 2
        var doResolveId = function() {
            ResolverCommon.get(url, self, process).then(function(html0) {
                var postParams = getHiddenPostParams(html0)

                var content = new Content(self, mediaIdentifier)
                content.title = postParams.fname
                setTimeout(function() {
                    ResolverCommon.formPost(url, postParams, self, process).then(function(html) {
                        var fn = RegExp.curryExecute(html)

                        content.snapshotImageUrl = fn(/image\s*:\s*["'](.+)["']/)

                        var durationStr = fn(/duration\s*:\s*["']([0-9]+?)["']/)
                        content.duration = durationStr ? +durationStr : null

                        var stream = new RtmpStream(fn(/streamer\s*:\s*["'](.+?)["']/),
                            fn(/file\s*:\s*["'](.+?)["']/))
                        content.streams = [stream]

                        if (!stream.server && numRetries > 0) {
                            numRetries--
                            doResolveId()
                        }
                        else {
                            finishedWithContent(content, self, process)
                        }

                    })
                }, 500)
            })
        }
        doResolveId()
    }

    scrape(url: string, process: ProcessNode) {
        extractMediaId(this, url, process)
    }

}
