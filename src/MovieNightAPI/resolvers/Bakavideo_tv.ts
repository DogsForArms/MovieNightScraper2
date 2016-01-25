///<reference path="../../../vendor/es6-promise.d.ts" />
///<reference path="../../../vendor/colors.d.ts" />
///<reference path="../../Tools/RegExp.ts" />
///<reference path="../Resolver.ts" />
///<reference path="../ResolverCommon.ts" />
///<reference path="../ProcessNode.ts" />
///<reference path="../Content.ts" />

var Base64 = require('../../node_modules/js-base64/base64.js').Base64;
// var Base64 = require('js-base64')
module MovieNightAPI 
{
	export class Bakavideo_tv implements Resolver<string>
	{
		domain = "Bakavideo.tv"
		name = "BakavideoTv"
		needsClientRefetch = true

		recognizesUrlMayContainContent(url: string): boolean
		{
			return extractMediaId(this, url) != undefined
		}

		mediaIdExtractors = [
			function(url: string) { return /bakavideo\.tv\/embed\/([a-zA-Z\d]+?)$/.execute(url) }
		]
		resolveId(mediaIdentifier: string, process: ProcessNode) 
		{
			var self = this
			var url = ('https://bakavideo.tv/get/files.embed?f=' + mediaIdentifier)

			ResolverCommon.get(url, self, process).then(function(jsonStr){
				
				var streamUrls: LabeledStream[] = null
				try {
					var json = JSON.parse(jsonStr)
					var html = Base64.decode(json.content)

					var content = new Content(self, mediaIdentifier)
					streamUrls = /<source(.*?)>/g.executeAll(html).map(function(component) {
						var quality = /data-res="(.*?)"/.execute(component)
						var url = /src="(.*?)"/.execute(component)

						return { 'quality': quality, 'streamUrl': url }
					})
				} catch (e) {console.log(e)}

				content.streamUrls = streamUrls
				finishedWithContent(content, self, process)
				
			})

		}

		scrape(url: string, process: ProcessNode)	
		{
			extractMediaId(this, url, process)
		}

	}
}