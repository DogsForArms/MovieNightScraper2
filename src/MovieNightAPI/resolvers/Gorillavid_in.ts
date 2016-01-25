///<reference path="../../../vendor/es6-promise.d.ts" />
///<reference path="../../../vendor/colors.d.ts" />
///<reference path="../../Tools/RegExp.ts" />

module MovieNightAPI 
{
	export class Gorillavid_in implements Resolver<string> 
	{
		domain = 'gorillavid.in'
		name = 'Gorillavid'
		needsClientRefetch = true

		mediaIdExtractors: ((url: string) => (string))[] = [function(url) {
			var result = /(http:\/\/)?gorillavid\.in\/(.+)\/?/.exec(url)
			return result? result[2] : null
		 }]

		recognizesUrlMayContainContent(url: string): boolean
		{
			return extractMediaId(this, url) != null
		}
		resolveId(mediaIdentifier: string, process: ProcessNode) 
		{
			var self = this
			var url = ('http://gorillavid.in/' + mediaIdentifier)
			ResolverCommon.get(url, self, process).then(function(html0)
			{
				var postParams = getHiddenPostParams(html0)
				var title = postParams.fname

				ResolverCommon.formPost(url, postParams, self, process).then(function(html)
				{
					var fn = RegExp.curryExecute(html)
					var content = new Content(self, mediaIdentifier)
					content.streamUrl = fn(/file\s*:\s*"(.*)"/)
					var durationStr = fn(/duration\s*:\s*"([0-9]+)"/)

					content.duration = durationStr ? +durationStr : null
					content.snapshotImageUrl = fn(/image\s*:\s*"(.*)"/)
					content.title = title

					finishedWithContent(content, self, process)
				})


			})
		}
		scrape(url: string, process: ProcessNode)
		{
			extractMediaId(this, url, process)
		}
	}
}