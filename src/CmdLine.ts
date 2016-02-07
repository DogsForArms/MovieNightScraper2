///<reference path="../vendor/phantomjs.d.ts" />
///<reference path="../vendor/colors.d.ts" />
///<reference path="../vendor/command-line-args.d.ts" />
///<reference path="./MovieNightAPI/resolvers/Vodlocker_com.ts" />
///<reference path="./MovieNightAPI/ResolverCommon.ts" />
///<reference path="./MovieNightAPI/ProcessNode.ts" />
///<reference path="./MovieNightAPI/Public.ts" />



var colors = require('colors')
// var MovieNightScraper = require('./MovieNightScraper.js')
var cliArgs : CommandLineArgs = require('command-line-args')


var optionalCommandLineConfigs: CommandLineConfig[] = [
	{
		name: "verbose",
		type: Boolean,
		alias: "v",
		description: "lots of output"
	},
	{
		name: "help",
		type: Boolean,
		description: "Print usage instructions"
	}

];
var requiredCommandLineConfigs: CommandLineConfig[] = [
	// { 
	// 	name: "searchPodcast", 
	// 	type: String, 
	// 	alias: "p", 
	// 	description: "Give me a query" 
	// },
	// { 
	// 	name: "resolvePodcast", 
	// 	type: String, 
	// 	alias: "f", 
	// 	description: "Give me a valid itunes urlFeed for a podcast" 
	// },
	// { 
	// 	name: "search", 
	// 	type: String, 
	// 	alias: "s", 
	// 	description: "Give me a query" 
	// },
	// { 
	// 	name: "paginateTest", 
	// 	type: Boolean, 
	// 	alias: "t", 
	// 	description: "Paginate test" 
	// }
	
	{
		name: 'phantom',
		type: Boolean,
		alias: "p",
		description: "test phantom js"
	},
	{
		name: "scrape",
		type: String,
		alias: "r",
		description: "Scrape media from a url."
	}, 
]
var cli = cliArgs( optionalCommandLineConfigs.concat(requiredCommandLineConfigs) )

var options;
try 
{
	options = cli.parse(); 
} 
catch (e) 
{
	options = {help: true}
	console.log("\n*****\nError: Incorect Usage\n*****".red.underline.bold)
}
var hasNeededArgs = requiredCommandLineConfigs.some(function(commandLineConfig){
	return options[commandLineConfig.name]
})
if (!hasNeededArgs)
{
	console.log("\n*****\nError, you must provide one of the required commands: ".red, requiredCommandLineConfigs.map(function(clc) { return clc.name }).join(', ').italic)
	console.log("*****".red)
}



var usage = cli.getUsage({
    header: "Movie Night Backend.",
    footer: "Search and Resolve content."
});

if (options.help || !hasNeededArgs) 
{
	console.log(usage);
} 
else 
{
	if (options.scrape)
	{
		// console.log(this.name())

		var resultsCount = 0
		var usedUids: any = []

		var head = new MovieNightAPI.ProcessNode(function(results: MovieNightAPI.Result[], process: MovieNightAPI.ProcessNode) {
			// console.log("scrape result: " + options.scrape)
			// console.log("results: " + JSON.stringify(results, null, 4).red)
			// console.log("finished: ".blue, process.finished)
			results.forEach(function(result){
				if (result.type == MovieNightAPI.ResultType.Content && usedUids[result.content.uid] == undefined)
				{
					usedUids[result.content.uid] = true
					resultsCount++
					console.log((resultsCount + ') ' + result.content.title + ' | ' + result.content.mediaOwnerName).green.bold)
					console.log(JSON.stringify(result.content,null,4).blue.italic)
				}
				else
				{

				}
			})

			if (process.finished)
			{
				console.log("finished: with ".blue , resultsCount)
			}
		})

		MovieNightAPI.scrape(options.scrape, head)

	} else
	if (options.phantomjs)
	{
		

	} else
	{
		console.log(JSON.stringify(options, null, 4).white)
		console.warn("No command was run.  Use --help for usage.".red.bold)
	}
	





















	// 	console.log((i + ') ') + ' ' + ((value.content && value.content.display ? value.content.display.title : '')) + (value.code + ''))//.bold[color])
	// 	i++

	// 	if (options.verbose || value.code < 0) {
	// 		console.log(JSON.stringify(value, null, 2))//.italic[color])
	// 	}
	// }

	// var m = new MovieNightScraper
	// if (options.paginateTest) {
	// 	var nextPageData = {
	// 		'url': 'http://movienight.ws/page/2/',
	// 		'host': 'Movienight.ws',
	// 		'lastUrl': 'http://movienight.ws/pressure-2015/',
	// 		'maxExpectedResultsPerPage': 12
	// 	}
	// 	m.nextPage(nextPageData).onValue(print)
	// } else
	// 	if (options.resolvePodcast) {

	// 		var linkArgs = {
	// 			'host': 'itunes.apple.com',
	// 			'url': options.input
	// 		}
	// 		m.linkContent(linkArgs).onValue(print)
	// 		// console.log("sweet")
	// 	} else
	// 		if (options.searchPodcast) {
	// 			m.podcastSearch(options.input).onValue(print)
	// 		} else
	// 			if (options.search) {
	// 				//SEARCH
	// 				m.search(options.input).onValue(print)
	// 			} else
	// 				if (options.resolve) {
	// 					//RESOLVE
	// 					m.scrape(options.input, true).onValue(print)
	// 				}
}