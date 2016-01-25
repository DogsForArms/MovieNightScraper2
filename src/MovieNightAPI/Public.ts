///<reference path="./Resolver.ts" />

///<reference path="./resolvers/Gorillavid_in.ts" />
///<reference path="./resolvers/Raw.ts" />
///<reference path="./resolvers/Allmyvideos_net.ts" />
///<reference path="./resolvers/Exashare_com.ts" />
///<reference path="./resolvers/Vidlockers_ag.ts" />


module MovieNightAPI
{
	export function resolvers(): Resolver<string>[]
	{
		return [new Vodlocker_com(), new Allmyvideos_net(), new Gorillavid_in(), new Exashare_com(), new Vidlockers_ag()]
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