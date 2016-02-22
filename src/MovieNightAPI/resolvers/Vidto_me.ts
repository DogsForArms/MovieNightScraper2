module MovieNightAPI {
    export class Vidto_me implements Resolver<string>
    {
        domain = 'vidto.me'
        name = 'Vidto.me'
        needsClientRefetch = true

        mediaIdExtractors: ((url: string) => (string))[] = [
            function(url) { return /vidto\.me\/([a-zA-Z\d]*?)(\/)?(\.html)?$/.execute(url) }
        ]

        resolveId(mediaIdentifier: string, process: ProcessNode) {
            var self = this

            var url0 = ("http://vidto.me/" + mediaIdentifier)
            ResolverCommon.get(url0, self, process).then(function(html0) {
                // console.log(html0.blue)
                var content = new Content(self, mediaIdentifier)
                var postParams = getHiddenPostParams(html0)
                content.title = postParams.fname
                setTimeout(function() {
                    ResolverCommon.formPost(url0, postParams, self, process).then(function(html) {
                        try {
                            var beautiful = ResolverCommon.beautify(/<script.*?>(eval\([\s\S]*?)<\/script>/.execute(html))
                            var sources = /hd\s*:\s*\[([\s\S]*?)\]/.execute(beautiful)
                            content.streams = /\{([\s\S]*?)\}/g.executeAll(sources).map(function(sourceStr) {
                                var stream = new UrlStream(/file\s*:\s*["'](.*?)['"]/.execute(sourceStr))
                                stream.name = /label\s*:\s*["'](.*?)['"]/.execute(sourceStr)
                                stream.mimeType = 'application/octet-stream'
                                return stream
                            })
                            content.snapshotImageUrl = /image\s*:\s*["'](.*?)['"]/.execute(beautiful)
                        } catch (e) { logError(e) }
                        finishedWithContent(content, self, process)
                    })
                }, 6 * 1000)
            })
        }

        recognizesUrlMayContainContent(url: string): boolean {
            return extractMediaId(this, url) != null
        }

        scrape(url: string, process: ProcessNode) {
            extractMediaId(this, url, process)
        }
    }
}
