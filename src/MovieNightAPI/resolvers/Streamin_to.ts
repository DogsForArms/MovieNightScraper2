///<reference path="../../../vendor/es6-promise.d.ts" />
///<reference path="../../../vendor/colors.d.ts" />
///<reference path="../../Tools/RegExp.ts" />

module MovieNightAPI
{
	export class Streamin_to implements Resolver<string>
	{
		domain = 'streamin.to'
		name = 'Streamin.to'
		needsClientRefetch = true

		mediaIdExtractors: ((url: string) => (string))[] = [
			function(url) { return /streamin\.to\/(.*?)$/.execute(url) }
		]

		resolveId(mediaIdentifier: string, process: ProcessNode)
		{
			var self = this
			
			var url0 = ('http://streamin.to/' + mediaIdentifier)

			ResolverCommon.get(url0, self, process).then(function(html0){				

				var content = new Content(self, mediaIdentifier)
				var postParams = getHiddenPostParams(html0)
				try 
				{
					var cookies = /cookie\((.*?)\)/g.executeAll(html0).map(function(cookieStr) {
						var key = /'(.*?)'\s*,/.execute(cookieStr)
						var val = /,\s*'(.*?)'/.execute(cookieStr)
						var obj = {
							'key': key,
							'value': val
						}
						return obj
					})

					var cookiesStr = cookies.reduce(function(l, c) {
						l += (c.key + '=' + c.value + ';')
						return l
					}, '')
					cookiesStr = cookiesStr.slice(0, cookiesStr.length - 1)
					postParams['Cookie'] = cookiesStr

					content.title = postParams.fname
				} catch (e) { logError(e) }

				setTimeout(function(){

					ResolverCommon.formPost(url0, postParams, self, process).then(function(html){
						try {
							var jwplayerSetup = /<script.*?jwplayer.*?setup([\s\S]+?)<\/script>/.execute(html)
							content.streams = [new RtmpStream(/streamer\s*?:\s*?['"](.*?)['"]/.execute(jwplayerSetup), /file\s*?:\s*?['"](.*?)['"]/.execute(jwplayerSetup))]
							var durationStr = /duration\s*?:\s*?["']([0-9]*?)["']/.execute(jwplayerSetup)
							content.duration = durationStr ? +durationStr : null
							content.snapshotImageUrl = /image\s*?:\s*?["'](.*?)["']/.execute(jwplayerSetup)
						} catch (e) {logError(e)}
						finishedWithContent(content, self, process)
					})

				}, 5*1000)
				
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