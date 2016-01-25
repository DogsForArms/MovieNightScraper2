///<reference path="../../../vendor/es6-promise.d.ts" />
///<reference path="../../../vendor/colors.d.ts" />
///<reference path="../../Tools/RegExp.ts" />
///<reference path="../Resolver.ts" />
///<reference path="../ResolverCommon.ts" />
///<reference path="../ProcessNode.ts" />
///<reference path="../Content.ts" />

module MovieNightAPI
{
	export class Vidlockers_ag implements Resolver<string>
	{
		domain = "vidlockers.ag"
		name = "Vidlockers.ag"
		needsClientRefetch = true

		recognizesUrlMayContainContent(url: string): boolean {
			return extractMediaId(this, url) != undefined
		}

		resolveId(mediaIdentifier: string, process: ProcessNode) 
		{
			var self = this
			var url0 = ('http://vidlockers.ag/' + mediaIdentifier + '.html')
			ResolverCommon.get(url0, self, process).then(function(html0){
				console.log(html0.blue.italic)
				var postParams = getHiddenPostParams(html0)
				
				ResolverCommon.formPost(url0, postParams, self, process).then(function(html){
				
					var fn = RegExp.curryExecute(html)
					var content = new Content(self, mediaIdentifier)

					content.snapshotImageUrl = fn(/image:.*["'](.+?)["']/)
					content.streamUrl = fn(/file:.*["'](.*?)["']/)

					var durationStr = fn(/duration:.*["']([0-9]+?)["']/)
					content.duration = durationStr ? +durationStr : null
					
					var urlComponents = content.streamUrl.split('/')
					content.title = urlComponents[urlComponents.length-1]

					console.log(content)
					finishedWithContent(content, self, process)

				})
			})
		}

		mediaIdExtractors = [
			function(url: string) { return /vidlockers\.ag\/([a-zA-Z\d]+)?(\/.*)?(\.html)?$/.execute(url) }
		]
		scrape(url: string, process: ProcessNode) {
			extractMediaId(this, url, process)
		}


	}
}