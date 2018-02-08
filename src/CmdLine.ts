
import {ProcessNode} from './MovieNightAPI/ProcessNode'
import {scrape} from './MovieNightAPI/Public'
import {Result, ResultType} from './MovieNightAPI/Resolver'
import * as commandLineArgs from 'command-line-args'

var colors = require('colors')


var optionalCommandLineConfigs: commandLineArgs.OptionDefinition[] = [
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
var requiredCommandLineConfigs: commandLineArgs.OptionDefinition[] = [
	{ 
		name: "searchPodcast", 
		type: String, 
		alias: "p", 
		description: "Give me a query" 
	},
	{ 
		name: "resolvePodcast", 
		type: String, 
		alias: "f", 
		description: "Give me a valid itunes urlFeed for a podcast" 
	},
	{ 
		name: "search", 
		type: String, 
		alias: "s", 
		description: "Give me a query" 
	},
	{ 
		name: "paginateTest", 
		type: Boolean, 
		alias: "t", 
		description: "Paginate test" 
	},
	{
		name: 'phantom',
		type: Boolean,
		alias: "h",
		description: "test phantom js"
	},
	{
		name: "scrape",
		type: String,
		alias: "r",
		description: "Scrape media from a url."
	}, 
]

var options: any;
try 
{
	options = commandLineArgs( optionalCommandLineConfigs.concat(requiredCommandLineConfigs) )
} 
catch (e) 
{
	options = {help: true}
	console.log("\n*****\nError: Incorect Usage\n*****".red.underline.bold)
	console.log(e)
}
var hasNeededArgs = requiredCommandLineConfigs.some(function(commandLineConfig){
	return options[commandLineConfig.name]
})
if (!hasNeededArgs)
{
	console.log("\n*****\nError, you must provide one of the required commands: ".red, requiredCommandLineConfigs.map(function(clc) { return clc.name }).join(', ').italic)
	console.log("*****".red)
}



// var usage = cli.getUsage({
//     header: "Movie Night Backend.",
//     footer: "Search and Resolve content."
// });

// if (options.help || !hasNeededArgs) 
// {
// 	console.log(usage);
// } 
// else 
{
	// if (!options.verbose)
	// {
	// 	console.debug = function(message?: string, ...optionalParams: any[]): void {}
	// }
	// else
	// {
	// 	console.debug = console.log
	// }
	
	if (options.scrape)
	{
		var resultsCount = 0
		var usedUids: any = []

		var head = new ProcessNode(function(results: Result[], process: ProcessNode) {
			

			results.forEach(function(result){
				if (result.type == ResultType.Content && usedUids[result.content.uid] == undefined)
				{
					usedUids[result.content.uid] = true
					resultsCount++
					console.log((resultsCount + ') ' + result.content.title + '\t|\t' + result.content.mediaOwnerName + '\t|\t' + result.content.mediaIdentifier).green.bold)
					console.debug(JSON.stringify(result.content, null, 4).blue + '')
				}
				else
				{
					// console.debug(JSON.stringify(result.error, null, 4).red + '')
				}
			})

			if (process.finished)
			{
				console.log("finished: with ".blue , resultsCount)
			}
		})

		scrape(options.scrape, head)

	} else
	if (options.phantom)
	{
		console.log('what is this: ')
		console.log(require('phantomjs'))
		// var webPage = <WebPage>(require('phantomjs').create())
		// console.log('webPage: ' + webPage)
		// webPage.open('http://www.google.com', function(status: string){
		// 	console.log('status: ' + status)
		// })

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