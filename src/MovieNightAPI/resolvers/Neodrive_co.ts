module MovieNightAPI {
    export class Neodrive_co implements Resolver<string>
    {
        domain = 'neodrive.co'
        name = 'Neodrive'
        needsClientRefetch = true

        mediaIdExtractors: ((url: string) => (string))[] = [
            function(url) { return /neodrive\.co\/share\/file\/([a-zA-Z\d]*?)(\/)?(\.html)?$/.execute(url) },
            function(url) { return /neodrive\.co\/embed\/([a-zA-Z\d]*?)(\/)?(\.html)?$/.execute(url) }
        ]

        resolveId(mediaIdentifier: string, process: ProcessNode) {
            var self = this

            var url = ('http://neodrive.co/embed/' + mediaIdentifier)
            ResolverCommon.get(url, self, process).then(function(html) {
                var fn = RegExp.curryExecute(html)
                var content = new Content(self, mediaIdentifier)

                content.snapshotImageUrl = fn(/vthumbnail\s*=\s*["'](.*?)["']/)
                content.title = fn(/vtitle\s*=\s*["'](.*?)["']/)
                content.streams = [new UrlStream(fn(/vurl\s*=\s*["'](.*?)["']/))]

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
