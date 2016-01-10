///<reference path="./Resolver.ts" />
///<reference path="./resolvers/Raw.ts" />

module MovieNightAPI
{
	export function resolvers(): Resolver<string>[]
	{
		return [new Vodlocker_com()]
	}

	export function scrape(url: string, process: ProcessNode)
	{
		var responders = resolvers().filter(function(resolver) { return resolver.recognizesUrlMayContainContent(url) })

		if (responders.length == 0) {
			var raw = new Raw()
			raw.scrape(url, process)
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