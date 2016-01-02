///<reference path="../vendor/require.d.ts" />
///<reference path="./Task.ts" />


var task: Task = new Task()

var Colors = require('colors')
// var MovieNightScraper = require('./MovieNightScraper.js')
var cliArgs = require('command-line-args')


var cli = cliArgs([
	{ name: "verbose", type: Boolean, alias: "v", description: "lots of output" },
	{ name: "searchPodcast", type: Boolean, alias: "p", description: "Give me a query" },
	{ name: "resolvePodcast", type: Boolean, alias: "f", description: "Give me a valid itunes urlFeed for a podcast" },
	{ name: "search", type: Boolean, alias: "s", description: "Give me a query" },
	{ name: "resolve", type: Boolean, alias: "r", description: "Give me a url" },
	{ name: "help", type: Boolean, description: "Print usage instructions" },
	{ name: "input", type: String, alias: "i", defaultOption: true, description: "Input phrase or url." },
	{ name: "paginateTest", type: Boolean, alias: "t", description: "Paginate test" }
])

var options = cli.parse();

var usage = cli.getUsage({
    header: "Movie Night Backend.",
    footer: "Search and Resolve content."
});

console.log(options.help ? usage : options);

var i = 0
// function print(value) {
// 	var color;
// 	if (value.code == 2) {
// 		color = 'blue'
// 	} else
// 	if (value.code > 0) {
// 		color = 'green'
// 	} else
// 	if (value.code == 0) {
// 		color = 'yellow'
// 	} else {
// 		color = 'red'
// 	}



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