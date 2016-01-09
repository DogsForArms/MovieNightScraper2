
module MovieNightAPI
{
	function resolvers(): Resolver<string>[]
	{
		return [new Vodlocker_com()]
	}

	export function scrape(url: string, process: ProcessNode)
	{
		var responders = resolvers().filter(function(resolver) { return resolver.recognizesUrlMayContainContent(url) })

		if (responders.length == 0) {
			var noResponse = new ResolverError(ResolverErrorCode.NoResponders, "Sorry, we do not know what to do with this url.")
			process.processOne({ 'type': ResultType.Error, 'error': noResponse })
		}
		else
		{
			responders.map(function(resolver)
			{ 
				var childProcess = process.newChildProcess()
				return { "resolver": resolver, "process": childProcess }
			}).forEach( function(pair)
			{
				pair.resolver.scrape(url, pair.process) 
			})
		}
		
	}

}