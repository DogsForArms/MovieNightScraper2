module MovieNightAPI {
    export class Vidzi_tv implements Resolver<string>
    {
        domain = 'vidzi.tv'
        name = 'Vidzi'
        needsClientRefetch = true

        mediaIdExtractors: ((url: string) => (string))[] = [
            function(url) { return /vidzi\.tv\/([a-zA-Z\d]*?)(\/.*|\.html)?$/.execute(url) }
        ]
        //http://vidzi.tv/l7zomz2is96b.html
        resolveId(mediaIdentifier: string, process: ProcessNode) {
            var self = this
            var url = ("http://vidzi.tv/" + mediaIdentifier + ".html")
            ResolverCommon.get(url, self, process).then(function(html) {
                // console.log(html)
                var content = new Content(self, mediaIdentifier)
                content.title = /<title>watch\s*?(.*?)<\/title>/i.execute(html)
                try {
                    var pretty = ResolverCommon.beautify(/<script.*?>(eval\([\s\S]*?)<\/script>/.execute(html))
                    // console.log(pretty.magenta)
                    var sources = /sources\s*:\s*\[([\s\S]*?)\]/.execute(pretty)
                    // console.log(sources)
                    content.streams = /\{([\s\S]*?)\}/g.executeAll(pretty).map(function(sourceStr) {
                        return /file\s*:\s*["'](.*?)['"]/.execute(sourceStr)
                    }).filter(function(fileUrl) {
                        return (/(v\.mp4)/.execute(fileUrl) != null)
                    }).map(function(fileUrl) {
                        var stream = new UrlStream(fileUrl)
                        stream.mimeType = 'application/octet-stream'
                        return stream
                    })

                    // console.log(JSON.stringify(content, null, 4).green)

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
