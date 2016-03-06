module MovieNightAPI {
    export class Watchseries_li implements Resolver<string>
    {
        domain = 'watchseries.li'
        name = 'WatchSeries'
        needsClientRefetch = true

        mediaIdExtractors: ((url: string) => (string))[] = [
            function(url) { return /(watchseries\.li)/.execute(url) }
        ]

        resolveId(mediaIdentifier: string, process: ProcessNode) {
            console.log("never call resolveId of watchseries_li")
        }

        recognizesUrlMayContainContent(url: string): boolean {
            return extractMediaId(this, url) != null
        }

        scrape(url: string, process: ProcessNode) {
            var self = this
            ResolverCommon.get(url, self, process).then(function(html) {
                var bottomHtml = html.split("<div id=\"linktable\">")[1]
                var linksPairs = /<td>\s*<a\s(href=|-=)["'](\/.*?)["']/g.execAll(bottomHtml)
                    .map(function(result) {
                        var partialUrl = result[2]
                        return {
                            url: ('http://www.watchseries.li' + partialUrl),
                            process: process.newChildProcess()
                        }
                    })

                linksPairs.forEach(function(pair) {
                    console.debug(pair.url.magenta);
                    (new Raw()).scrapeForUrls(pair.url, pair.process,
                        function(someUrl: string): boolean {
                            return !self.recognizesUrlMayContainContent(someUrl)
                        })
                })

            })
        }
    }
}
