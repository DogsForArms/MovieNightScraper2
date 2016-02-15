module MovieNightAPI {
    export class Vid_ag implements Resolver<string>
    {
        domain = 'vid.ag'
        name = 'Vid'
        needsClientRefetch = true

        mediaIdExtractors: ((url: string) => (string))[] = [
            function(url) { return /vid\.ag\/(.*?)(\.html)?$/.execute(url) }
        ]

        resolveId(mediaIdentifier: string, process: ProcessNode) {
            var self = this
            var url = ('http://vid.ag/' + mediaIdentifier + '.html')

            ResolverCommon.get(url, self, process).then(function(html) {
                // console.log(html.blue)
                var content = new Content(self, mediaIdentifier)
                try {
                    content.title = /<h2.*?>(.*?)(\n|<\/h2>)/.execute(html)

                    var jwplayerSetup = /<script[\s\S]*?(eval\([\s\S]*?)<\/script/g.executeAll(html)
                        .map(ResolverCommon.beautify)
                        .filter(function(s) { return /(jwplayer)/.execute(s) != null })[0]

                    var sources = /sources\s*:\s*\[({[\s\S]*?})\]/.execute(jwplayerSetup)
                    content.snapshotImageUrl = /image\s*:\s*["'](.*?)["']/.execute(jwplayerSetup)
                    content.streams = /({.*?})/g.executeAll(sources)
                        .map(function(sourceStr) {
                            var stream = new UrlStream(/file\s*:\s*["'](.*?)["']/.execute(sourceStr))
                            stream.name = /label\s*:\s*["'](.*?)["']/.execute(sourceStr)
                            return stream
                        })
                        .filter(function(stream) {
                            return /(mp4)/.execute(stream.url) != null
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
}
