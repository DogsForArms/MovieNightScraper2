import {Resolver} from '../Resolver'
import {ResolverCommon, extractMediaId} from '../ResolverCommon'
import {ProcessNode} from '../ProcessNode'
import {Content, finishedWithContent, UrlStream} from '../Content'

//http://allvid.ch/baiutajhsxis
export class Allvid_ch implements Resolver<string>
{
	domain = 'allvid.ch'
	name = 'Allvid.ch'
	needsClientRefetch = true

	private vrot(s: string) {
		return s.replace(/[A-Za-z]/g, function(c) {
			return String.fromCharCode(c.charCodeAt(0) + (c.toUpperCase() <= "M" ? 13 : -13));
		});
	}

	mediaIdExtractors: ((url: string) => (string))[] = [
		function(url) { return /allvid.ch\/([a-zA-Z\d]+?)(\.html)?$/.execute(url) },
		function(url) { return /allvid.ch\/embed-([a-zA-Z\d]+?)(\.html)?$/.execute(url) },
	]

	resolveId(mediaIdentifier: string, process: ProcessNode)
	{
		var self = this
		var url0 = ('http://allvid.ch/' + mediaIdentifier)

		ResolverCommon.get(url0, self, process).then(function(html0){
			// console.log(html0)

			var content = new Content(self, mediaIdentifier)
			content.title = /<h3.*?title.*?>(.*)<\/h3/.execute(html0)
			if (content.title) { content.title = self.vrot(content.title) }

			// console.log(content.title)
			var url = ('http://allvid.ch/embed-' + mediaIdentifier + '.html')
			ResolverCommon.get(url, self, process).then(function(html){
				try 
				{
					var evalStr = /<script.*?>(eval[\s\S]*?)<\/script>/.execute(html)
					var beautiful = ResolverCommon.beautify(evalStr)
					var sourcesStr = /sources\s*:\s*\[(.*?)\]/.execute(beautiful)

					content.streams = /\{(.*?)\}/g.executeAll(sourcesStr).map(function(str){
						var stream = new UrlStream( /file\s*:\s*["'](.+?)["']/.execute(str) )
						stream.name = /label\s*:\s*["'](.+?)["']/.execute(str)
						return stream
					})

					var durationStr = /duration\s*:\s*["'](.+?)["']/.execute(beautiful)
					content.duration = durationStr ? +durationStr : null
					content.snapshotImageUrl = /image\s*:\s*["'](.+?)["']/.execute(beautiful)

				} catch (e) { logError(e) }
				finishedWithContent(content, self, process)
			})
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
