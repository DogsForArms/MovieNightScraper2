module MovieNightAPI {
    export class Dailymotion_com implements Resolver<string>
    {
        domain = 'dailymotion.com'
        name = 'DailyMotion'
        needsClientRefetch = true

        mediaIdExtractors: ((url: string) => (string))[] = [
            function(url: string) { return /dailymotion\.com\/video\/(.*?)$/.execute(url) }
        ]

        private sanitize(inputUrl?: string): string {
            return inputUrl ? inputUrl.replace(/\\/g, '') : null
        }

        resolveId(mediaIdentifier: string, process: ProcessNode) {
            var self = this


            var url = ('http://www.dailymotion.com/video/' + mediaIdentifier)
            ResolverCommon.get(url, self, process).then(function(html) {
                var content = new Content(self, mediaIdentifier)
                try {
                    var setupStr = /buildPlayer\(([\s\S]*?)\);/.execute(html)
                    content.title = /"title"\s*:\s*"(.*?)"/.execute(setupStr)
                    content.snapshotImageUrl = self.sanitize(/"poster_url"\s*:\s*"(.*?)"/.execute(setupStr))
                    var durationStr = /"duration"\s*:\s*.*?([0-9]*)/.execute(setupStr)
                    content.duration = durationStr ? +durationStr : null;

                    var regionOfInterest = /["']qualities['"]\s*:\s*{([\s\S]*?)},/i.execute(setupStr)
                    content.streams = /"([a-zA-Z\d]*?)".*?\{([\s\S]*?)\}/g.execAll(regionOfInterest)
                        .reduce(function(l, res) {
                            var name = res[1]
                            var c = res[2]

                            var type = /"type"\s*:\s*"(.*?)"/.execute(c)
                            var url = /"url"\s*:\s*"(.*?)"/.execute(c)
                            if (type == "video\\/mp4") {
                                var stream = new UrlStream(self.sanitize(url))
                                stream.mimeType = "video/mp4"
                                stream.name = name
                                l.push(stream)
                            }
                            return l
                        }, [])
                    // console.log(setupStr.blue)
                } catch (e) { logError(e) }
                // console.log(JSON.stringify(content, null, 4).red)
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
