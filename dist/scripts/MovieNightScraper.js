///<reference path="../../vendor/es6-promise.d.ts" />
///<reference path="../../vendor/request.d.ts" />
///<reference path="../../vendor/node.d.ts" />
var Request = require('request');
var MovieNightAPI;
(function (MovieNightAPI) {
    //network stuff
    var ResolverCommon;
    (function (ResolverCommon) {
        function get(url, res, process) {
            return request({ 'method': 'GET', 'url': url }, res, process);
        }
        ResolverCommon.get = get;
        function headOnly(url, res, process) {
            return request({ 'method': 'HEAD', 'url': url }, res, process);
        }
        ResolverCommon.headOnly = headOnly;
        function request(options, res, process) {
            var q = new Promise(function (resolve, reject) {
                var self = this;
                var retryRequest = function (error, options) {
                    var retryOnErrorCodes = ['ECONNRESET'];
                    return (options.maxAttempts > 0 && (retryOnErrorCodes.indexOf(error.code) != -1));
                };
                //set retry parameters
                options.maxAttempts = 15;
                options.retryDelay = 300 + Math.random() * 7000;
                var makeRequest = function (options) {
                    Request(options, function (error, response, data) {
                        if (error) {
                            if (retryRequest(error, options)) {
                                //decrement & reset retry parameters
                                setTimeout(function () {
                                    options.maxAttempts = options.maxAttempts - 1;
                                    console.log(("RETRYING " + options.maxAttempts + ' - ' + options.url).inverse.dim);
                                    options.retryDelay = 300 + Math.random() * 7000;
                                    makeRequest(options);
                                }, options.retryDelay);
                            }
                            else {
                                console.log("REQUEST ERROR".red.bold.underline);
                                console.log(error);
                                // var internetError = new ResolverState(-4, self, { 'error': error, 'url': options.url })
                                var failure = new MovieNightAPI.ResolverError(MovieNightAPI.ResolverErrorCode.InternetFailure, "The internet failed when looking up url <" + options.url + ">", this);
                                reject(failure);
                            }
                        }
                        else {
                            resolve((options.method == 'HEAD') ? response.headers : data);
                        }
                    });
                };
                makeRequest(options);
            });
            q.catch(function (failure) {
                console.log("network error failed".red);
                process.processOne({ type: MovieNightAPI.ResultType.Error, error: failure });
            });
            return q;
        }
        ResolverCommon.request = request;
    })(ResolverCommon = MovieNightAPI.ResolverCommon || (MovieNightAPI.ResolverCommon = {}));
})(MovieNightAPI || (MovieNightAPI = {}));

///<reference path="../ResolverCommon.ts" />
///<reference path="../../../vendor/es6-promise.d.ts" />
///<reference path="../../../vendor/colors.d.ts" />
var MovieNightAPI;
(function (MovieNightAPI) {
    var Vodlocker_com = (function () {
        function Vodlocker_com() {
            //Resolver properties
            this.domain = 'vodlocker.com';
            this.name = 'VodLocker.com';
            this.needsClientFetch = true;
            //internal properties
            this.mediaIdRegExp = [/vodlocker\.com\/embed-(.+?)-[0-9]+?x[0-9]+?/, /vodlocker\.com\/([^\/]*)$/];
        }
        Vodlocker_com.prototype.recognizesUrlMayContainContent = function (url) {
            var matches = [/vodlocker\.com\/?$/].concat(this.mediaIdRegExp)
                .map(function (regex) { return regex.exec(url); })
                .filter(function (regExpExecArray) { return regExpExecArray != null; });
            return matches.length > 0;
        };
        Vodlocker_com.prototype.resolveId = function (mediaIdentifier, process) {
            // var task = this.taskManager.registerTask()
            var self = this;
            var url = ('http://vodlocker.com/embed-' + mediaIdentifier + '-650x370.html');
            MovieNightAPI.ResolverCommon.get(url, self, process)
                .then(function (html) {
                var result = RegExp.executeAll({
                    'image': /image:[^"]*"(.+)"/,
                    'streamUrl': /file:[^"]*"(.+)"/,
                    'duration': /duration:[^"]*"([0-9]+)"/
                }, html);
                result['mimeType'] = 'video/mp4';
                var titleUrl = ('http://vodlocker.com/' + mediaIdentifier);
                MovieNightAPI.ResolverCommon.get(titleUrl, self, process)
                    .then(function (titleHtml) {
                    result['title'] = /<input\s*type="hidden"\s*name="fname"\s*value="([^"]*)/.execute(titleHtml);
                    MovieNightAPI.createContent(result, self, process);
                });
            });
        };
        Vodlocker_com.prototype.scrape = function (url, process) {
            var self = this;
            var mediaIds = self.mediaIdRegExp
                .map(function (regex) { return regex.exec(url); })
                .filter(function (regExpExecArray) { return regExpExecArray != null && regExpExecArray[1] != null; })
                .map(function (regExpExecArray) { return regExpExecArray[1]; });
            if (mediaIds.length > 0) {
                self.resolveId(mediaIds[0], process);
            }
            else {
                var error = new MovieNightAPI.ResolverError(MovieNightAPI.ResolverErrorCode.InsufficientData, ("Could not get a MediaId from the url " + url), self);
                process.processOne({ type: MovieNightAPI.ResultType.Error, error: error });
            }
        };
        return Vodlocker_com;
    })();
    MovieNightAPI.Vodlocker_com = Vodlocker_com;
})(MovieNightAPI || (MovieNightAPI = {}));

var MovieNightAPI;
(function (MovieNightAPI) {
    var count = 0;
    function UID() {
        return count++;
    }
    var ProcessNode = (function () {
        function ProcessNode(updateBlock, parent) {
            this.parent = parent;
            this.uid = UID();
            this.children = [];
            this.finished = false;
            var self = this;
            self.updateBlock = function (results, process) {
                if (self.finished) {
                    console.log("Task finished prematurely.".red.bold);
                }
                var numTotal = self.children.length;
                var numFinished = self.children.filter(function (node) { return node.finished; }).length;
                self.finished = (numTotal == numFinished);
                updateBlock(results, self);
            };
        }
        ProcessNode.prototype.newChildProcess = function () {
            var self = this;
            var child = new ProcessNode(self.updateBlock, self);
            self.children.push(child);
            return child;
        };
        ProcessNode.prototype.process = function (results) {
            var self = this;
            self.updateBlock(results, self);
        };
        ProcessNode.prototype.processOne = function (result) {
            var self = this;
            self.updateBlock([result], self);
        };
        return ProcessNode;
    })();
    MovieNightAPI.ProcessNode = ProcessNode;
})(MovieNightAPI || (MovieNightAPI = {}));

///<reference path="../vendor/colors.d.ts" />
///<reference path="../vendor/command-line-args.d.ts" />
///<reference path="./MovieNightAPI/resolvers/Vodlocker_com.ts" />
///<reference path="./MovieNightAPI/ResolverCommon.ts" />
///<reference path="./MovieNightAPI/ProcessNode.ts" />
var colors = require('colors');
// var MovieNightScraper = require('./MovieNightScraper.js')
var cliArgs = require('command-line-args');
var optionalCommandLineConfigs = [
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
    },
];
var requiredCommandLineConfigs = [
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
        name: "scrape",
        type: String,
        alias: "r",
        description: "Scrape media from a url."
    },
];
var cli = cliArgs(optionalCommandLineConfigs.concat(requiredCommandLineConfigs));
var options;
try {
    options = cli.parse();
}
catch (e) {
    options = { help: true };
    console.log("\n*****\nError: Incorect Usage\n*****".red.underline.bold);
}
var hasNeededArgs = requiredCommandLineConfigs.some(function (commandLineConfig) {
    return options[commandLineConfig.name];
});
if (!hasNeededArgs) {
    console.log("\n*****\nError, you must provide one of the required commands: ".red, requiredCommandLineConfigs.map(function (clc) { return clc.name; }).join(', ').italic);
    console.log("*****".red);
}
var usage = cli.getUsage({
    header: "Movie Night Backend.",
    footer: "Search and Resolve content."
});
if (options.help || !hasNeededArgs) {
    console.log(usage);
}
else {
    if (options.scrape) {
        var head = new MovieNightAPI.ProcessNode(function (results, process) {
            console.log("scrape result: " + options.scrape);
            console.log("results: " + JSON.stringify(results, null, 4).red);
            console.log("finished: ".blue, process.finished);
        });
        var vodlocker = new MovieNightAPI.Vodlocker_com();
        vodlocker.scrape(options.scrape, head);
    }
    else {
        console.log(JSON.stringify(options, null, 4).white);
        console.warn("No command was run.  Use --help for usage.".red.bold);
    }
}

var MovieNightAPI;
(function (MovieNightAPI) {
    function objectCouldCreateContent(obj) {
        var streamUrls = obj.streamUrls;
        var hasValidStreamUrls = (streamUrls && streamUrls.every(function (value) {
            return (value.quality != null &&
                value.quality != undefined &&
                value.streamUrl != null &&
                value.streamUrl != undefined);
        }));
        return obj.streamUrl || hasValidStreamUrls;
    }
    var removeThese = ['watchseries',
        'ch', 'x264', 'mp4', 'avi', 'flv',
        'DVDRip', 'HDTV', 'hdtv', 'XviD',
        'LOL', 'lol', 'HDRip', 'mov',
        '720p', 'dl', 'KILLERS', 'DVD',
        'dvdrip', 'w4f', 'BluRay', 'YIFY',
        'PDTV', 'TVCUK', 'WEB', 'DL', 'AC3',
        'RARBG', 'PROPER', 'Weby', 'HDTVx264',
        'X264', 'H264', 'AAC', 'mkv', 'BRRip', 'EVO',
        'HDTS', 'V2', 'CPG', 'PLAYNOW', 'AAC2', 'FLAWL3SS',
        'MovieNight', 'HQ', 'HC', 'iFT', 'UNRATED', 'XViD', 'ETRG',
        'alE13', 'WEBRip', 'MP3', 'mp3', 'DD5', 'MkvCage', 'MrSeeN',
        'SiMPLE', 'TiTAN', 'aXXo', '480p', 'VDC', 'HDRiP', 'DAiLYHOMAGE',
        'MiTED', 'xvid', 'webrip', 'XVID', '1080p', 'DD5',
        'iNTERNAL', 'BDRip'];
    function niceFilter(rawTitle) {
        if (!rawTitle) {
            return null;
        }
        //delimit by . space - _ 
        var components = rawTitle.split(/[\.\s,\-\_]+/);
        var scoresAndComponents = components.map(function (component) {
            var value = (removeThese.indexOf(component) === -1) ? true : false;
            return { 'component': component, 'keep': value };
        });
        var coloredComponentsString = components.map(function (component) {
            var remove = (removeThese.indexOf(component) != -1);
            if (remove) {
                return component.red;
            }
            else {
                return component.green;
            }
        }).join(' ');
        console.log(coloredComponentsString);
        var done = false;
        var chopEnd = scoresAndComponents.reduce(function (l, c, i) {
            if (done || !c.keep) {
                done = true;
            }
            else {
                l.push(c);
            }
            return l;
        }, []).map(function (obj) { return obj.component; });
        var newValue = chopEnd.join(' ');
        var oldValue = components.filter(function (phrase) {
            return (removeThese.indexOf(phrase) === -1);
        }).join(' ');
        if (chopEnd.length > 0) {
            return newValue;
        }
        return oldValue;
    }
    MovieNightAPI.niceFilter = niceFilter;
    var Content = (function () {
        function Content(obj, res) {
            this.title = niceFilter(obj.title ? obj.title : "untitled");
            this.image = obj.image;
            this.duration = obj.duration;
            this.streamUrl = obj.streamUrl;
            this.streamUrls = obj.streamUrls;
            this.mediaIdentifier = obj.mediaIdentifier;
            this.needsClientIp = obj.needsClientIp;
            this.mimeType = obj.mimeType;
            this.uid = obj.uid ? obj.uid : (obj.mediaIdentifier + ":" + res.name);
            this.domain = res.domain;
            this.resolverName = res.name;
        }
        return Content;
    })();
    MovieNightAPI.Content = Content;
    function mimeTypeIsValid(mimeType) {
        return (["video/mp4", "video/webm", "video/ogg", "video/youtube",
            "audio/mpeg", "video/twitch", "video/x-flv", "application/octet-stream",
            "rtmp"].filter(function (v) { return v == mimeType; }).length == 1);
    }
    function createContent(obj, res, process) {
        if (!objectCouldCreateContent(obj)) {
            var message = "Resolver " + res.name + " cannot make Content with insufficient data." + JSON.stringify(obj);
            var error = new MovieNightAPI.ResolverError(MovieNightAPI.ResolverErrorCode.InsufficientData, message, res);
            process.processOne({ type: MovieNightAPI.ResultType.Error, error: error });
        }
        else {
            var content = new Content(obj, res);
            var reportInvalidMimeType = function () {
                var message = "Mime type " + content.mimeType + " is not supported.";
                var error = new MovieNightAPI.ResolverError(MovieNightAPI.ResolverErrorCode.InvalidMimeType, message, res);
                process.processOne({ type: MovieNightAPI.ResultType.Error, error: error });
            };
            if (!content.mimeType) {
                var videoUrl = content.streamUrl || content.streamUrls[0].streamUrl;
                MovieNightAPI.ResolverCommon.headOnly(videoUrl, res, process).then(function (json) {
                    var mimeType = json['content-type'];
                    if (!mimeTypeIsValid(mimeType)) {
                        reportInvalidMimeType();
                    }
                    else {
                        process.processOne({ type: MovieNightAPI.ResultType.Content, content: content });
                    }
                });
            }
            else if (!mimeTypeIsValid(content.mimeType)) {
                reportInvalidMimeType();
            }
            else {
                process.processOne({ type: MovieNightAPI.ResultType.Content, content: content });
            }
        }
    }
    MovieNightAPI.createContent = createContent;
})(MovieNightAPI || (MovieNightAPI = {}));

var MovieNightAPI;
(function (MovieNightAPI) {
    function resolvers() {
        return [new MovieNightAPI.Vodlocker_com()];
    }
    function scrape(url, process) {
        var responders = resolvers().filter(function (resolver) { return resolver.recognizesUrlMayContainContent(url); });
        if (responders.length == 0) {
            var noResponse = new MovieNightAPI.ResolverError(MovieNightAPI.ResolverErrorCode.NoResponders, "Sorry, we do not know what to do with this url.");
            process.processOne({ 'type': MovieNightAPI.ResultType.Error, 'error': noResponse });
        }
        else {
            responders.map(function (resolver) {
                var childProcess = process.newChildProcess();
                return { "resolver": resolver, "process": childProcess };
            }).forEach(function (pair) {
                pair.resolver.scrape(url, pair.process);
            });
        }
    }
    MovieNightAPI.scrape = scrape;
})(MovieNightAPI || (MovieNightAPI = {}));

var MovieNightAPI;
(function (MovieNightAPI) {
    (function (ResolverErrorCode) {
        ResolverErrorCode[ResolverErrorCode["InternetFailure"] = 0] = "InternetFailure";
        ResolverErrorCode[ResolverErrorCode["InsufficientData"] = 1] = "InsufficientData";
        ResolverErrorCode[ResolverErrorCode["UnexpectedLogic"] = 2] = "UnexpectedLogic";
        ResolverErrorCode[ResolverErrorCode["InvalidMimeType"] = 3] = "InvalidMimeType";
        ResolverErrorCode[ResolverErrorCode["NoResponders"] = 4] = "NoResponders";
    })(MovieNightAPI.ResolverErrorCode || (MovieNightAPI.ResolverErrorCode = {}));
    var ResolverErrorCode = MovieNightAPI.ResolverErrorCode;
    var ResolverError = (function () {
        function ResolverError(code, description, resolver) {
            var self = this;
            self.code = code;
            self.description = description;
            self.taskName = resolver ? resolver.name : "MovieNight";
        }
        return ResolverError;
    })();
    MovieNightAPI.ResolverError = ResolverError;
    (function (ResultType) {
        ResultType[ResultType["Error"] = 0] = "Error";
        ResultType[ResultType["Content"] = 1] = "Content";
        ResultType[ResultType["Contents"] = 2] = "Contents";
    })(MovieNightAPI.ResultType || (MovieNightAPI.ResultType = {}));
    var ResultType = MovieNightAPI.ResultType;
})(MovieNightAPI || (MovieNightAPI = {}));

RegExp.prototype.execute = function (str) {
    var results = this.exec(str);
    if (results) {
        return results[1];
    }
    return null;
};
RegExp.executeAll = function (obj, str) {
    var self = this;
    if (str === undefined) {
        throw new Error("executeAll from " + self.host + " has no string input");
    }
    var acc = {};
    return Object.keys(obj).reduce(function (l, regKey) {
        var regex = obj[regKey];
        var result = regex.execute(str);
        l[regKey] = result;
        return l;
    }, acc);
};
