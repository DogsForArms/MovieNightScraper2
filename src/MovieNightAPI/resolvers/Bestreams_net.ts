///<reference path="../../../vendor/es6-promise.d.ts" />
///<reference path="../../../vendor/colors.d.ts" />
///<reference path="../../Tools/RegExp.ts" />
///<reference path="../Resolver.ts" />
///<reference path="../ResolverCommon.ts" />
///<reference path="../ProcessNode.ts" />
///<reference path="../Content.ts" />
module MovieNightAPI 
{
	export class Bestreams_net implements Resolver<string>
	{
		domain = "bestreams.net"
		name = "Bestreams"
		needsClientRefetch = true

		recognizesUrlMayContainContent(url: string): boolean 
		{
			return extractMediaId(this, url) != undefined
		}

		mediaIdExtractors = [
			function(url: string) { return /bestreams\.net\/([a-zA-Z\d]+)/.execute(url)}
		]

		resolveId(mediaIdentifier: string, process: ProcessNode)
		{
			var self = this
			var url = ('http://bestreams.net/' + mediaIdentifier)

			console.log(url.bold)
			ResolverCommon.get(url, self, process).then(function(html0){
				// console.log(html0.red)
				var postParams = getHiddenPostParams(html0)
				console.log(postParams)
				setTimeout(function() {
					ResolverCommon.formPost(url, postParams, self, process).then(function(html) {
						console.log(html.blue.inverse)
					})
				}, 4000)
			})
		}

		scrape(url: string, process: ProcessNode)
		{
			extractMediaId(this, url, process)
		}

	}
}