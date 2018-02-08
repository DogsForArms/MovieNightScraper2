import {Resolver} from '../Resolver'
import {ProcessNode} from '../ProcessNode'
import {ResolverCommon, extractMediaId, getHiddenPostParams} from '../ResolverCommon'
import {Content, UrlStream, finishedWithContent} from '../Content'

export class Powvideo_net implements Resolver<string>
{
	domain = 'powvideo.net'
	name = 'Powvideo'
	needsClientRefetch = true

	recognizesUrlMayContainContent(url: string): boolean {
		return extractMediaId(this, url) != undefined
	}

	resolveId(mediaIdentifier: string, process: ProcessNode)
	{
		var self = this
		var url = ('http://powvideo.net/' + mediaIdentifier)
		ResolverCommon.get(url, self, process).then(function(html0){
			var postParams = getHiddenPostParams(html0)
			var content = new Content(self, mediaIdentifier)
			content.title = postParams ? postParams.fname : undefined

			setTimeout(function(){
				ResolverCommon.formPost(url, postParams, self, process).then(function(html){
					try
					{
						var evalStr = /<script>[\s\S]+?(eval\([\s\S]+?)<\/script>/.execute(html)

						var fn = RegExp.curryExecute(ResolverCommon.beautify(evalStr))
						content.snapshotImageUrl = fn(/image.*?=.*?["'](.+?)["']/)
						content.streams = [new UrlStream(fn(/sources.*?src.*?:.*['"](.+?\.mp4)['"]/))]
					} catch (e) { logError(e) }
					finishedWithContent(content, self, process)
				})
			}, 6000)
		})
	}
	mediaIdExtractors: ((url: string) => (string))[] = [function(url) {
		return /powvideo\.net\/([a-zA-Z\d]+)/.execute(url)
		
	}]

	scrape(url: string, process: ProcessNode) {
		extractMediaId(this, url, process)
	}

}