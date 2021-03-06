import {Resolver} from '../Resolver'
import {ProcessNode} from '../ProcessNode'
import {ResolverCommon, extractMediaId} from '../ResolverCommon'
import {Content, finishedWithContent, UrlStream} from '../Content'

export class Vodlocker_com implements Resolver<string>
{

	//Resolver properties
	domain = 'vodlocker.com'
	name = 'VodLocker.com'
	needsClientRefetch = true

	recognizesUrlMayContainContent(url: string): boolean 
	{
		return (extractMediaId(this, url) || /(vodlocker\.lol\/)/.execute(url)) != undefined
	}

	resolveId(mediaIdentifier: string, process: ProcessNode) 
	{
		var self = this

		var url = ('http://vodlocker.com/embed-' + mediaIdentifier + '-650x370.html')
		ResolverCommon.get(url, self, process)
			.then(function(html: string)
			{
				var content = new Content(self, mediaIdentifier)
				var fn = RegExp.curryExecute(html)

				content.snapshotImageUrl = fn(/image:[^"]*"(.+)"/)

				var durStr = fn(/duration:[^"]*"([0-9]+)"/) 
				content.duration = durStr ? +durStr : null
				content.streams = [new UrlStream(fn(/file:[^"]*"(.+)"/))]


				var titleUrl = ('http://vodlocker.com/' + mediaIdentifier)
				ResolverCommon.get(titleUrl, self, process)
				.then(function(titleHtml: string){

					content.title = /<input\s*type="hidden"\s*name="fname"\s*value="([^"]*)/.execute(titleHtml)
					finishedWithContent(content, self, process)

				})

			})
	}


	mediaIdExtractors = [
		function(url: string) { return /vodlocker\.com\/embed-(.+?)-[0-9]+?x[0-9]+?/.execute(url) },
		function(url: string) { return /vodlocker\.com\/([^\/]+)(\/)?$/.execute(url) }
	]

	scrape(url: string, process: ProcessNode) 
	{
		var self = this

		var extractedLolName = /vodlocker\.lol\/([^\/]+)(\/\?video)?(\/)?$/.execute(url)
		if (extractedLolName != null) 
		{
			self.scrapeVodlockerLol(('http://vodlocker.lol/' + extractedLolName + '/?video'), process)
		}
		else 
		{
			extractMediaId(this, url, process)
		}
	}	

	private scrapeVodlockerLol(url: string, process: ProcessNode)
	{
		var self = this
		ResolverCommon.get(url, self, process).then(function(html){

			var realUrl = /<iframe src=["'](.*)["']/i.execute(html)
			extractMediaId(self, realUrl, process)

		})
	}
}
