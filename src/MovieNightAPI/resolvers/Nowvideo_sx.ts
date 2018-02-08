import {Resolver} from '../Resolver'
import {ProcessNode} from '../ProcessNode'
import {ResolverCommon, extractMediaId, getHiddenPostParams} from '../ResolverCommon'
import {Content, UrlStream, finishedWithContent} from '../Content'

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

            var postParams = getHiddenPostParams(html0)
            postParams['Cookie'] = cookiesStr
            postParams['submit'] = 'submit'
            console.log(JSON.stringify(postParams, null, 4).red)
            ResolverCommon.formPost(url, postParams, self, process).then(function(html) {
                console.log(html.length)
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
