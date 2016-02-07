///<reference path="../../../vendor/es6-promise.d.ts" />
///<reference path="../../../vendor/colors.d.ts" />
///<reference path="../../Tools/RegExp.ts" />

module MovieNightAPI
{
	export class Filehoot_com implements Resolver<string>
	{
		domain = 'filehoot.com'
		name = 'Filehoot'
		needsClientRefetch = true

		mediaIdExtractors: ((url: string) => (string))[] = [
			function(url) { return /filehoot\.com\/([a-zA-Z\d]+?)(\.html)?$/.execute(url) }
		]

		resolveId(mediaIdentifier: string, process: ProcessNode)
		{
			var self = this

			var url0 = ('http://filehoot.com/' + mediaIdentifier + '.html')
			// console.log(url0)
			ResolverCommon.get(url0, self, process).then(function(html0){

				var postParams = getHiddenPostParams(html0)
				var content = new Content(self, mediaIdentifier)
				content.title = postParams.fname
				postParams['method_free'] = 'Continue to watch your Video'
				ResolverCommon.formPost(url0, postParams, self, process).then(function(html){

					var fn = RegExp.curryExecute(html)
					content.streams = [new UrlStream( fn(/file[\s]*?:[\s]*?["'](.+?)["']/) )]
					content.snapshotImageUrl = fn(/image\s*?:\s*?["'](.+?)["']/)
					var durationStr = fn(/duration\s*?:\s*?["'](.+?)["']/)
					content.duration = durationStr ? +durationStr : null

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
}