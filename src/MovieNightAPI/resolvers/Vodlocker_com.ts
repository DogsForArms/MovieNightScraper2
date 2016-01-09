///<reference path="../MovieNightAPI.ts" />
///<reference path="../Content.ts" />
///<reference path="../Resolver.ts" />
///<reference path="../../../vendor/es6-promise.d.ts" />
///<reference path="../../../vendor/colors.d.ts" />
///<reference path="../../RegExp/RegExp.ts" />

module MovieNightAPI 
{

	export class Vodlocker_com implements Resolver<string>
	{

		//Resolver properties
		domain = 'vodlocker.com'
		name = 'VodLocker.com'
		needsClientFetch = true

		//internal properties
		mediaIdRegExp:RegExp[] = [ /vodlocker\.com\/embed-(.+?)-[0-9]+?x[0-9]+?/, /vodlocker\.com\/([^\/]*)$/]

		recognizesUrlMayContainContent(url: string): boolean 
		{
			var matches = [/vodlocker\.com\/?$/].concat(this.mediaIdRegExp)
				.map(function(regex) { return regex.exec(url) })
				.filter(function(regExpExecArray) 
				{ return regExpExecArray != null })
			return matches.length > 0
		}

		resolveId(mediaIdentifier: string, process: ProcessNode) {
			// var task = this.taskManager.registerTask()
			var self = this

			var url = ('http://vodlocker.com/embed-' + mediaIdentifier + '-650x370.html')
			ResolverCommon.get(url, self, process)
				.then(function(html: string)
				{
					var result = RegExp.executeAll({
						'image': /image:[^"]*"(.+)"/,
						'streamUrl': /file:[^"]*"(.+)"/,
						'duration': /duration:[^"]*"([0-9]+)"/
					}, html)

					result['mimeType'] = 'video/mp4'

					var titleUrl = ('http://vodlocker.com/' + mediaIdentifier)
					ResolverCommon.get(titleUrl, self, process)
					.then(function(titleHtml: string){

						result['title'] = /<input\s*type="hidden"\s*name="fname"\s*value="([^"]*)/.execute(titleHtml)	
						createContent(result, self, process)

					})

				})
		}

		scrape(url: string, process: ProcessNode) {
			var self = this

			var mediaIds = self.mediaIdRegExp
				.map(function(regex){ return regex.exec(url)})
				.filter(function(regExpExecArray){ return regExpExecArray != null && regExpExecArray[1] != null })
				.map(function(regExpExecArray){ return regExpExecArray[1] })

			if (mediaIds.length > 0){
				self.resolveId(mediaIds[0], process)
			}
			else
			{
				var error = new ResolverError(
					ResolverErrorCode.InsufficientData, 
					("Could not get a MediaId from the url " + url), 
					self)
				process.processOne({ type: ResultType.Error, error: error })
			}
		}
	}
}