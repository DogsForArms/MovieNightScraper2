import {Resolver} from '../Resolver'
import {ProcessNode} from '../ProcessNode'
import {ResolverCommon, extractMediaId} from '../ResolverCommon'
import {Content, finishedWithContent, UrlStream} from '../Content'

export class Flashx_tv implements Resolver<string>
{
	domain = 'flashx.tv'
	name = 'Flashx'
	needsClientRefetch = true

	mediaIdExtractors: ((url: string) => (string))[] = [
		function(url) { return /flashx\.tv\/embed-(.*?)(\/)?(\.html)?$/.execute(url) },
		function(url) { return /flashx\.tv\/(.*?)(\/)?(\.html)?$/.execute(url) },
		function(url) { return /flashx\.tv\/fxplay-(.*?)(\/)?(\.html)?$/.execute(url) },
		function(url) { return /flashx\.pw\/embed-(.*?)(\/)?(\.html)?$/.execute(url) },
		function(url) { return /flashx\.pw\/fxplay-(.*?)(\/)?(\.html)?$/.execute(url) },
		function(url) { return /flashx\.pw\/(.*?)(\/)?(\.html)?$/.execute(url) }
	]

	resolveId(mediaIdentifier: string, process: ProcessNode)
	{
		var self = this
		//http://www.flashx.pw/embed.php?c=o93k0eacrps1
		var url0 = ('http://www.flashx.pw/fxplay-' + mediaIdentifier + '.html' )
		ResolverCommon.get(url0, self, process).then(function(html0){
			var content = new Content(self, mediaIdentifier)

			content.title = /fdstr\s*=\s*["'](.*?)["']/.execute(html0)
			
			var url = "http://www.flashx.pw/fxplay-" + mediaIdentifier + ".html";
			ResolverCommon.get(url, self, process).then(function(html){

				try
				{
					var uglies = /<script[\s\S]*?(eval\([\s\S]+?)<\/script>/g.executeAll(html)
					var pretties = uglies.map( ResolverCommon.beautify )

					pretties = pretties.filter(function(s){ return /(jwplayer)/.execute(s) != null })
					var jwplayerSetupStr = pretties[0]

					if (jwplayerSetupStr == null)
					{
						jwplayerSetupStr = /jwplayer.*setup([\s\S]*?)<\/script>/.execute(html)
					}

					content.streams = /sources\s*:\s*\[([\s\S]+?)\]/g.executeAll(jwplayerSetupStr)
					.map(function(sourceStr){
						var stream = new UrlStream(/file\s*:\s*["'](.*?)["']/.execute(sourceStr))
						stream.name = /label\s*:\s*["'](.*?)["']/.execute(sourceStr)
						return stream
					})

					var durationStr = /duration\s*:\s*["']([0-9]+)["']/.execute(jwplayerSetupStr)
					content.duration = durationStr ? +durationStr : null
					content.snapshotImageUrl = /image\s*:\s*["'](.*?)["']/.execute(jwplayerSetupStr)

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
