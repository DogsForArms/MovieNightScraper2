module MovieNightAPI {
    export class Briskfile_com implements Resolver<string>
    {
        domain = 'briskfile.com'
        name = 'Briskfile'
        needsClientRefetch = true

        //http://www.briskfile.com/l/5224E0C900-3AFE897DB1
        mediaIdExtractors: ((url: string) => (string))[] = [
            function(url) { return /briskfile\.com\/l\/(.*?)(\/)?(\.html)?$/.execute(url) }
        ]

        resolveId(mediaIdentifier: string, process: ProcessNode) {
            var self = this
            var url = ('http://www.briskfile.com/l/' + mediaIdentifier)
            ResolverCommon.get(url, self, process).then(function(html0) {

                var postParams = getHiddenPostParams(html0)
                ResolverCommon.formPost(url, postParams, self, process).then(function(html) {

                    var fn = RegExp.curryExecute(html)
                    var content = new Content(self, mediaIdentifier)

                    var urlStream = new UrlStream(fn(/url\s*:\s*["'](.*?)['"]/))
                    urlStream.mimeType = 'video/x-flv'
                    content.streams = [urlStream]

                    content.title = fn(/title\s*=\s*["'](.*?)['"]/)
                    content.snapshotImageUrl = fn(/<img src=["'](http:\/\/static\.*?)['"]/)

                    finishedWithContent(content, self, process)
                })
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
