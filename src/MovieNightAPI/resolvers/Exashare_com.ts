///<reference path="../../../vendor/es6-promise.d.ts" />
///<reference path="../../../vendor/colors.d.ts" />
///<reference path="../../Tools/RegExp.ts" />
///<reference path="../Resolver.ts" />
///<reference path="../ResolverCommon.ts" />
///<reference path="../ProcessNode.ts" />
///<reference path="../Content.ts" />

module MovieNightAPI
{
	export class Exashare_com implements Resolver<string>
	{
		domain = "exashare.com"
		name = "Exashare"
		needsClientRefetch = true

		recognizesUrlMayContainContent(url: string): boolean
		{
			return extractMediaId(this, url) != undefined
		}

		resolveId(mediaIdentifier: string, process: ProcessNode) {
			var self = this
			var url0 = ("http://exashare.com/" + mediaIdentifier + ".html")
				
			//Refactor, look into what cookies are being stored that expire in 10 seconds, can I access this info faster?
			ResolverCommon.get(url0, self, process).then(function(html0){
				var postParams = getHiddenPostParams(html0)
				var title = postParams.fname
				var content = new Content(self, mediaIdentifier)
				content.title = title

				setTimeout(function(){
					var url = ("http://exashare.com/embed-" + mediaIdentifier + "-960x540.html")
					ResolverCommon.formPost(url, postParams, self, process).then(function(html) {
							var fn = RegExp.curryExecute(html)

							content.snapshotImageUrl = fn(/playlist:[\s\S]*?image:.*?["'](.*)["']/)
							content.streamUrl = fn(/playlist:[\s\S]*?file:.*?["'](.*)["']/)
							var durationStr = fn(/duration:.*?["'](\d+)?["']/)
							content.duration = durationStr ? +durationStr : null

							finishedWithContent(content, self, process)
						})
					}, 10 * 1000);

			})
		}


		mediaIdExtractors = [
			function(url: string) { return /exashare\.com\/embed-([a-zA-Z\d]*)?-/.execute(url) },
			function(url: string) { return /exashare\.com\/([a-zA-Z\d]*)/.execute(url) }
		]
		scrape(url: string, process: ProcessNode)
		{
			extractMediaId(this, url, process)
		}

	}
}