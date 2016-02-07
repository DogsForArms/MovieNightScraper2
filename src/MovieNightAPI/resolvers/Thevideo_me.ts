///<reference path="../../../vendor/es6-promise.d.ts" />
///<reference path="../../../vendor/colors.d.ts" />
///<reference path="../../Tools/RegExp.ts" />

module MovieNightAPI {

	export class Thevideo_me implements Resolver<string>
	{

		//Resolver properties
		domain = 'thevideo.me'
		name = 'TheVideo.me'
		needsClientRefetch = true

		recognizesUrlMayContainContent(url: string): boolean {
			return extractMediaId(this, url) != undefined
		}

		resolveId(mediaIdentifier: string, process: ProcessNode) {
			var self = this
			var url = ('http://thevideo.me/embed-' + mediaIdentifier + '.html')

			ResolverCommon.get(url, self, process).then(function(html){

				var content = new Content(self, mediaIdentifier)
				try {

					var jwplayerconfig = /jwConfig_vars\s*=\s([\s\S]*?};)/.execute(html)
					jwplayerconfig = jwplayerconfig.replace(/'/g, '"')

					var fn = RegExp.curryExecute(jwplayerconfig)

					content.title = fn(/["']?title["']?\s*?:\s*?["'](.*?)["']/)
					content.snapshotImageUrl = fn(/["']?image["']?\s*?:\s*?["'](.*?)["']/)
					var durationStr = fn(/["']?duration["']?\s*?:\s*?["']([0-9]*?)["']/)
					content.duration = durationStr ? +durationStr : null

					var sources = fn(/["']?sources["']?\s*?:\s*?(\[[\s\S]*?\])/)
					var sourceses = /\{(.*?)\}/g.executeAll(sources)

					content.streams = sourceses.map(function(s){
						var label = /["']?label["']?\s*:\s*['"](.*?)['"]/.execute(s)
						var file = /["']?file["']?\s*:\s*['"](.*?)['"]/.execute(s)

						var urlStream = new UrlStream(file)
						urlStream.name = label
						return urlStream
					})
				}
				catch (e) { logError(e) }

				finishedWithContent(content, self, process)

			})
		}


		mediaIdExtractors = [
			function(url: string) { return /thevideo\.me\/embed-([0-9a-zA-Z]+?)-/.execute(url) },
			function(url: string) { return /thevideo\.me\/embed-([0-9a-zA-Z]+?)(\.html)?$/.execute(url) },
			function(url: string) { return /thevideo\.me\/([0-9a-zA-Z]+?)(\.html)?$/.execute(url) }
		]

		scrape(url: string, process: ProcessNode) {
			extractMediaId(this, url, process)
		}
	}
}