module MovieNightAPI {
    export class Letwatch_us implements Resolver<string>
    {
        domain = 'letwatch.us'
        name = 'LetWatch.us'
        needsClientRefetch = true

        mediaIdExtractors: ((url: string) => (string))[] = [
            function(url) { return /letwatch\.us\/([a-zA-Z\d]+?)(\/)?(\.html)?$/.execute(url) }
        ]

        resolveId(mediaIdentifier: string, process: ProcessNode) {
            var self = this

            var url = ('http://letwatch.us/' + mediaIdentifier)
            ResolverCommon.get(url, self, process).then(function(html) {
                var content = new Content(self, mediaIdentifier)
                content.title = /<title>watch\s*?(.*?)<\/title>/i.execute(html)
                try {
                    var ugly = /<script.*?>(eval\([\s\S]*?)<\/script>/.execute(html)
                    var beautiful = ResolverCommon.beautify(ugly)

                    var sourcesStr = /sources\s*?:\s*?\[([\s\S]+?)\]/.execute(beautiful)
                    content.streams = /(\{[\s\S]*?\})/g.executeAll(sourcesStr).map(function(sourceStr) {
                        var stream = new UrlStream(/file\s*:\s*["'](.*?)['"]/.execute(sourceStr))
                        stream.name = /label\s*:\s*["'](.*?)['"]/.execute(sourceStr)
                        stream.mimeType = "video/x-flv"
                        return stream
                    })
                    content.snapshotImageUrl = /image\s*:\s*["'](.*?)['"]/.execute(beautiful)
                    var durationStr = /duration\s*:\s*["'](.*?)['"]/.execute(beautiful)
                    content.duration = durationStr ? +durationStr : null
                    //has captions
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
}
