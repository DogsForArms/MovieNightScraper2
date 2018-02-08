import {Resolver} from '../Resolver'
import {ProcessNode} from '../ProcessNode'
import {ResolverCommon, extractMediaId, getHiddenPostParams} from '../ResolverCommon'
import {Content, UrlStream, finishedWithContent} from '../Content'

export class PromptFile_com implements Resolver<string>
{
    domain = 'promptfile.com'
    name = 'PromptFile'
    needsClientRefetch = true

    mediaIdExtractors: ((url: string) => (string))[] = [
        function(url) { return /promptfile\.com\/l\/(.*?)(\/)?$/.execute(url) }
    ]

    resolveId(mediaIdentifier: string, process: ProcessNode) {
        var self = this
        var url = "http://www.promptfile.com/l/" + mediaIdentifier

        ResolverCommon.get(url, self, process).then(function(html0) {
            var postParams = getHiddenPostParams(html0)

            ResolverCommon.formPost(url, postParams, self, process).then(function(html) {
                var fn = RegExp.curryExecute(html)
                var content = new Content(self, mediaIdentifier)
                content.title = fn(/title\s*?=\s*?["'](.*?)['"]/)
                var fileUrl = fn(/player[\s\S]*?url\s*:\s*["'](.*?)['"]/)
                content.streams = [new UrlStream(fileUrl)]
                content.snapshotImageUrl = fn(/image\s*?src=["'](.*?)['"]/)

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

