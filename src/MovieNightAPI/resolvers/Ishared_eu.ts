import {Resolver} from '../Resolver'
import {ProcessNode} from '../ProcessNode'
import {ResolverCommon, extractMediaId} from '../ResolverCommon'
import {Content, finishedWithContent, UrlStream} from '../Content'

export class Ishared_eu implements Resolver<string>
{
	domain = 'ishared.eu'
	name = 'IShared.eu'
	needsClientRefetch = true

	mediaIdExtractors: ((url: string) => (string))[] = [
		function(url) {return /ishared\.eu\/video\/(.+?)(\/)?(\.html)?$/.execute(url) }
	]

	resolveId(mediaIdentifier: string, process: ProcessNode)
	{
		var self = this
		var url = ('http://ishared.eu/video/' + mediaIdentifier)
		ResolverCommon.get(url, self, process).then(function(html){
			// console.log(html.blue)
			var content = new Content(self, mediaIdentifier)
			// console.log(html.yellow)
			try {
				content.title = /titlebar[\s\S]*?<h1>(.*?)<\/h1>/.execute(html)

				var uglyStr = /<script[\s\S]+?(eval[\s\S]*?)<\/script/.execute(html)
				// console.log(uglyStr)
				var prettyString = ResolverCommon.beautify(uglyStr)
				// console.log(prettyString.magenta)
				var p: any;
				var jwplayer = function(str: string)
				{
					return {
						setup: function(params: any){
							p = params
						}
					}
				}
				eval(prettyString)
				content.streams = p.playlist[0].sources.map(function(source: any) {
					var stream = new UrlStream(source.file)
					stream.name = source.label
					return stream
				})
				content.posterImageUrl = p.playlist[0].image
				// console.log(JSON.stringify(p, null, 4).magenta)
				finishedWithContent(content, self, process)

			} catch (e) { logError(e) }
		})
	}

	recognizesUrlMayContainContent(url: string): boolean
	{
		return extractMediaId(this, url) != null
	}

	scrape(url: string, process: ProcessNode)
	{
		extractMediaId(this, url, process)
	}
}