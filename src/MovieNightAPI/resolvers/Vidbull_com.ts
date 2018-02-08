import {Resolver} from '../Resolver'
import {ProcessNode} from '../ProcessNode'
import {ResolverCommon, extractMediaId} from '../ResolverCommon'
import {Content, finishedWithContent} from '../Content'

export class Vidbull_com implements Resolver<string>
{
	name = "Vidbull"
	domain = "vidbull.com"
	needsClientRefetch = true

	static vidbullEmbededContentRegexMediaId = /vidbull\.com\/embed-([a-zA-Z\d]+?)-/

	recognizesUrlMayContainContent(url: string): boolean {
		return extractMediaId(this, url) != undefined
	}

	mediaIdExtractors = [
		function(url: string) { return /vidbull\.com\/([a-zA-Z\d-]+?)$/.execute(url) },
		function(url: string) { return Vidbull_com.vidbullEmbededContentRegexMediaId.execute(url) }
	]
	resolveId(mediaIdentifier: string, process: ProcessNode) {
		var self = this
		var url = ('http://vidbull.com/embed-' + mediaIdentifier + '-720x405.html')
		console.log(url)
		ResolverCommon.get(url, self, process).then(function(html){
			
			var content = new Content(self, mediaIdentifier)
			try
			{
				var evals = /<script.*?>(eval\([\s\S]*?)<\/script>/g.executeAll(html)[1]
				var unpacked = ResolverCommon.beautify(evals)
				// console.log(unpacked)
				var fn = RegExp.curryExecute(unpacked)
				var file = fn(/jwplayer.*file:['"]([a-zA-Z\d]*?)['"]/)
				var image = fn(/image:["'](.*?)["']/)
				console.log('file: ' +file)

			} catch (e) { console.log(e); logError(e)}

			finishedWithContent(content, self, process)
		})
	}
	scrape(url: string, process: ProcessNode) {
		extractMediaId(this, url, process)
	}
}