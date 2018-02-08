import {Resolver} from '../Resolver'
import {ProcessNode} from '../ProcessNode'
import {ResolverCommon, extractMediaId} from '../ResolverCommon'
import {Content, UrlStream, finishedWithContent} from '../Content'

export class Mycollection_net implements Resolver<string>
{
	domain = 'mycollection.net'
	name = 'MyCollection.net'
	needsClientRefetch = false

	mediaIdExtractors: ((url: string) => (string))[] = [
		function(url) { 
			var res = /mycollection\.net\/file\/(embed\/)?([a-zA-Z\d]+)(\.html)?$/.exec(url) 
			return res ? res[2] : null
		},
		function(url) { return /vidbaba\.com\/files\/([a-zA-Z\d]+?)(\.html)?(\/)?$/.execute(url) },
		function(url) { return /gagomatic\.com\/files\/([a-zA-Z\d]+?)(\.html)?(\/)?$/.execute(url) },
		function(url) { return /funblur\.com\/files\/([a-zA-Z\d]+?)(\.html)?(\/)?$/.execute(url) },
		function(url) { return /favour\.me\/files\/([a-zA-Z\d]+?)(\.html)?(\/)?$/.execute(url) },

		//http://www.funblr.com/files/9cf1fea8c7a45e0157e85f40cd0a4050
	]

	resolveId(mediaIdentifier: string, process: ProcessNode)
	{
		var self = this
		var url0 = ('http://www.mycollection.net/file/' + mediaIdentifier)

		ResolverCommon.get(url0, self, process).then(function(html0) {
			var content = new Content(self, mediaIdentifier)
			content.title = /<title>(.*)?<\/title>/.execute(html0)

			var url = ('http://www.mycollection.net/file/embed/' + mediaIdentifier)
			ResolverCommon.get(url, self, process).then(function(html){
				try
				{
					var sourcesStr = /sources\s*:\s*\[([\s\S]+?)\]/.execute(html)
					content.streams = /\{([\s\S]+?)\}/g.executeAll(html).map(function(str){
						var file = /file\s*:\s*["'](.*?)["']/.execute(str)
						var name = /label\s*:\s*["'](.*?)["']/.execute(str)
						var stream = new UrlStream(file)
						stream.name = name
						stream.mimeType = 'video/mp4'

						return stream
					})						

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
