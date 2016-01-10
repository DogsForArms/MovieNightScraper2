module MovieNightAPI 
{
	export class Raw implements MediaFinder
	{
		//resolver properties

		recognizesUrlMayContainContent(url: string): boolean 
		{ 
			return true 
		}
		scrape(url: string, process: ProcessNode): void 
		{
			var tempMediaOwner: MediaOwnerInfo = {
				domain: 'movienight.it', 
				name: 'MovieNight Scraper', 
				needsClientRefetch: false 
			}
			ResolverCommon.getMimeType(url, tempMediaOwner, process).then(function(mimeType) {
				
				var isText = /(text\/)/.execute(mimeType) != null
				var ifMimeTypeIsValidCreate = function(theUrl: string, mType: string, mProcess: ProcessNode) : boolean
				{
					if (mimeTypeIsValid(mType))
					{

						var content = new Content(tempMediaOwner, '1')
						content.mimeType = mType
						content.streamUrl = theUrl
						MovieNightAPI.finishedWithContent(content, tempMediaOwner, mProcess)

						return true
					}
					return false
				}				


				if (isText)
				{
					//parse for all urls
					ResolverCommon.get(url, tempMediaOwner, process).then(function(html){
						var alreadyUsedUrls: any = {}
						alreadyUsedUrls[url] = true

						var urls1 = /((http|https):\/\/.*?)["';$]/g.executeAll(html)
						var urls2 = /((http|https):\\\/\\\/.*?)["';$]/g.executeAll(html).map(function(url) {
							var r = url.replace(/\\/g, '')
							return r
						})
						var urls = urls1.concat(urls2)
							.filter(function(url){
								if (!alreadyUsedUrls[url])
								{
									alreadyUsedUrls[url] = true
									return true
								}
								return false
							})

						if (urls.length == 0)
						{
							var noResponse = new ResolverError(ResolverErrorCode.NoResponders, "Sorry, we do not know what to do with this url.")
							process.processOne({ 'type': ResultType.Error, 'error': noResponse })
						}
						else
						{
							urls.map(function(url) {
									return {
										'url': url,
										'process': process.newChildProcess()
									}
								})
								.forEach(function(pair)  {
									ResolverCommon.getMimeType(pair.url, tempMediaOwner, pair.process).then(function(mimeType){
										if (!ifMimeTypeIsValidCreate(pair.url, mimeType, pair.process))
										{
											resolvers().forEach(function(resolver) {
												resolver.scrape(pair.url, pair.process)
											})
										}
									})
								})
						}

					})
				}
				else
				{
					if (!ifMimeTypeIsValidCreate(url, mimeType, process))
					{
						var noResponse = new ResolverError(ResolverErrorCode.NoResponders, ("Sorry, we were unable to recognize the mime type of the url " + url + "."))
						process.processOne({ 'type': ResultType.Error, 'error': noResponse })
					}
				}
			})

		}

	}	
}