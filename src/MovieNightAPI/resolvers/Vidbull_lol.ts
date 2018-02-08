import {Resolver} from '../Resolver'
import {ProcessNode} from '../ProcessNode'
import {ResolverCommon, extractMediaId} from '../ResolverCommon'
import {Content, finishedWithContent} from '../Content'
import {Vidbull_com} from './Vidbull_com'

export class Vidbull_lol implements Resolver<string>
{
	name = "Vidbull"
	domain = "vidbull.lol"
	needsClientRefetch = true

	recognizesUrlMayContainContent(url: string): boolean {
		return extractMediaId(this, url) != undefined
	}

	mediaIdExtractors = [
		function(url: string) { return /vidbull\.lol\/([a-zA-Z\d-]+?)(\/\?video|$)/.execute(url) }
	]
	resolveId(mediaIdentifier: string, process: ProcessNode) {
		var self = this
		var url = ('http://vidbull.lol/' + mediaIdentifier + '/?video')
		ResolverCommon.get(url, self, process).then(function(html){
			// console.log(html.yellow.inverse)

				var vidbullMediaId = Vidbull_com.vidbullEmbededContentRegexMediaId.execute(html)
				if (vidbullMediaId)
				{

					console.log(vidbullMediaId.blue)
					new Vidbull_com().resolveId(vidbullMediaId, process)

				}
				else
				{
					var content = new Content(self, "nonsense")
					finishedWithContent(content, self, process)
				}
		})
	}


	scrape(url: string, process: ProcessNode) {
		extractMediaId(this, url, process)
	}

}
