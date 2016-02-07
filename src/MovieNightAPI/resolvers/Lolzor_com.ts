///<reference path="../../../vendor/es6-promise.d.ts" />
///<reference path="../../../vendor/colors.d.ts" />
///<reference path="../../Tools/RegExp.ts" />

module MovieNightAPI
{
	export class Lolzor_com implements Resolver<string>
	{
		domain = 'lolzor.com'
		name = 'Lolzor.com'
		needsClientRefetch = true

		mediaIdExtractors: ((url: string) => (string))[] = [
			function(url) { return /lolzor\.com\/files\/([a-zA-Z\d]+?)(\.html)?(\/)?$/.execute(url)}
		]

		resolveId(mediaIdentifier: string, process: ProcessNode)
		{
			var self = this
			var url0 = ('http://lolzor.com/files/' + mediaIdentifier)
			ResolverCommon.get(url0, self, process).then(function(html0){

				var content = new Content(self, mediaIdentifier)
				content.title = /<title>(.+)?<\//.execute(html0)
				
				var url = ('http://lolzor.com/files/get_video/' + mediaIdentifier)
				console.log(url.blue)
				ResolverCommon.get(url, self, process).then(function(html){
					// console.log(html)
					var videoMetadataUrl = decodeURIComponent( /["'](http:\/\/(.+)PlayerMetadata(.+?))["']/.execute(html) )
					console.log(videoMetadataUrl.magenta)
					ResolverCommon.get(videoMetadataUrl, self, process).then(function(jsonStr){
						try
						{
							var json = JSON.parse(jsonStr)
							console.log(JSON.stringify(json, null, 5).cyan)
							content.duration = json.movie.duration ? +json.movie.duration : null
							content.streams = json.videos.map(function(videoObj: any){
								var stream = new UrlStream(videoObj.url)
								stream.name = videoObj.name
								stream.mimeType = 'video/mp4'
								return stream
							})

						} catch (e) { logError(e) }

						finishedWithContent(content, self, process)
					})

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
}