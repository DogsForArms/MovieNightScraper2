import {Resolver} from '../Resolver'
import {ResolverCommon, extractMediaId, getHiddenPostParams} from '../ResolverCommon'
import {Content, finishedWithContent, UrlStream} from '../Content'
import {ProcessNode} from '../ProcessNode'

//HAS PROBLEMS IN VIDEOJS
export class Exashare_com implements Resolver<string>
{
    domain = "exashare.com"
    name = "Exashare"
    needsClientRefetch = true

    recognizesUrlMayContainContent(url: string): boolean {
        return extractMediaId(this, url) != undefined
    }

    resolveId(mediaIdentifier: string, process: ProcessNode) {
        var self = this
        var url0 = ("http://exashare.com/" + mediaIdentifier + ".html")

        //Refactor, look into what cookies are being stored that expire in 10 seconds, can I access this info faster?
        ResolverCommon.get(url0, self, process).then(function(html0) {
            var postParams = getHiddenPostParams(html0)
            var title = postParams.fname
            var content = new Content(self, mediaIdentifier)
            content.title = title
            // console.log(html0)
            // setTimeout(function(){
            var url = /player_wrap[\s\S]*?src\s*?=["']([\s\S]*?)["']/.execute(html0) //("http://exashare.com/embed-" + mediaIdentifier + "-960x540.html")
            url = url.replace('\n', '')

            // console.log(postParams)
            // console.log(html0.yellow)
            ResolverCommon.get(url, self, process).then(function(html) {
                // console.log(html.blue)

                var fn = RegExp.curryExecute(html)

                content.snapshotImageUrl = fn(/playlist:[\s\S]*?image:.*?["'](.*)["']/)
                content.streams = [new UrlStream(fn(/playlist:[\s\S]*?file:.*?["'](.*)["']/))]
                var durationStr = fn(/duration:.*?["'](\d+)?["']/)
                content.duration = durationStr ? +durationStr : null

                // console.log(url)
                // console.log(html.yellow)
                // console.log(JSON.stringify(content, null, 4).magenta)
                finishedWithContent(content, self, process)
            })
            // }, 10 * 1000);

        })
    }

    mediaIdExtractors = [
        function(url: string) { return /halazoun\.info\/embed-([a-zA-Z\d]+?)-/.execute(url) },
        function(url: string) { return /exashare\.com\/embed-([a-zA-Z\d]+?)-/.execute(url) },
        function(url: string) { return /exashare\.com\/([a-zA-Z\d]+?)(\.html)?$/.execute(url) }
    ]

    scrape(url: string, process: ProcessNode) {
        extractMediaId(this, url, process)
    }

}
