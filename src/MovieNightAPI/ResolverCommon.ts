///<reference path="../../vendor/es6-promise.d.ts" />
///<reference path="../../vendor/request.d.ts" />
///<reference path="../../vendor/node.d.ts" />
///<reference path="./Resolver.ts" />

var Request = require('request')

module MovieNightAPI 
{
	//network stuff
	export module ResolverCommon 
	{
		export function get(url: string, mediaOwnerInfo: MediaOwnerInfo, process: ProcessNode): Promise < string > 
		{
			return request({ 'method': 'GET', 'url': url }, mediaOwnerInfo, process)
		}
		export function getMimeType(url: string, mediaOwnerInfo: MediaOwnerInfo, process: ProcessNode): Promise < string > 
		{
			return request({ 'method': 'HEAD', 'url': url, 'timeout': 5*1000 }, mediaOwnerInfo, process)
		}
		export function request(options: any, mediaOwnerInfo: MediaOwnerInfo, process: ProcessNode): Promise<string> 
		{
			
			var q = new Promise<string>(function(resolve, reject) {
				var self = this

				var retryRequest = function(error: any, options: any) {
					var retryOnErrorCodes = ['ECONNRESET', 'ETIMEDOUT']
					return (options.maxAttempts > 0 && (retryOnErrorCodes.indexOf(error.code) != -1))
				}
				//set retry parameters
				options.maxAttempts = 0
				options.retryDelay = 300 + Math.random() * 1000

				var makeRequest = function(options: any) {
					Request(options, function(error: any, response: any, data: any) {
						if (error) {
							if (retryRequest(error, options)) {
								//decrement & reset retry parameters
								setTimeout(function() {
									options.maxAttempts = options.maxAttempts - 1
									console.log(("RETRYING " + options.maxAttempts + ' - ' + options.url).inverse.dim)
									options.retryDelay = 300 + Math.random() * 1000

									makeRequest(options)
								}, options.retryDelay)


							} else {
								console.log("<<<")
								console.log("REQUEST ERROR".red.bold.underline)
								console.log(error)
								console.log(JSON.stringify(options, null, 4))
								console.log(">>>")
								
								// var internetError = new ResolverState(-4, self, { 'error': error, 'url': options.url })
								var failure = new ResolverError(ResolverErrorCode.InternetFailure, "The internet failed when looking up url <" + options.url + ">", mediaOwnerInfo)
								reject(failure)
							}

						} else {
							resolve((options.method == 'HEAD') ? response.headers['content-type'] : data)
						}
					})
				}
				makeRequest(options)
			})
			q.catch(function(failure: ResolverError) {
				console.log("network error failed".red)

				process.processOne({ type: ResultType.Error, error: failure })
			})
			return q
		}

	}

	


}