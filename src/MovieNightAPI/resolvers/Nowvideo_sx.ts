module MovieNightAPI {
    export class Nowvideo_sx implements Resolver<string>
    {
        domain = 'nowvideo.sx'
        name = 'NowVideo.sx'
        needsClientRefetch = true

        mediaIdExtractors: ((url: string) => (string))[] = [
            function(url) { return /nowvideo\.sx\/video\/([a-zA-Z\d]*?)(\/|\.html|$)/.execute(url) }
        ]

        resolveId(mediaIdentifier: string, process: ProcessNode) {
            var self = this
            var url = ('http://nowvideo.sx/video/' + mediaIdentifier)
            ResolverCommon.getAll(url, self, process).then(function(response: any) {
                var html0 = response.body
                var setCookies: string[] = response.headers['set-cookie']
                var cookiesStr = setCookies.reduce(function(l, c) {
                    return l + ((l.length > 0) ? '; ' : '') + /(.*?);/.execute(c)
                }, '')

                // console.log(JSON.stringify(response.headers, null, 4).inverse)
                // console.log(html0);
                var postParams = getHiddenPostParams(html0)
                postParams['Cookie'] = cookiesStr
                postParams['submit'] = 'submit'
                console.log(JSON.stringify(postParams, null, 4).red)
                ResolverCommon.formPost(url, postParams, self, process).then(function(html) {
                    console.log(html.length)
                })
                // var options = {
                //     uri: url,
                //     method: 'POST',
                //     form: postParams,
                //     headers: {
                //         'User-Agent': 'Mozilla/5.0 (X11; Linux i686) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.64 Safari/537.11',
                //         'Cookie': cookiesStr,
                //         'Accept': '/',
                //         'Connection': 'keep-alive'
                //     }
                // }
                // console.log(JSON.stringify(options, null, 4).yellow)
                // ResolverCommon.request(options, self, process).then(function(html) {
                //     console.log(html.blue)
                // })
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
