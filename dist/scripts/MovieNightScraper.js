///<reference path="../../../vendor/es6-promise.d.ts" />
///<reference path="../../../vendor/colors.d.ts" />
///<reference path="../../Tools/RegExp.ts" />
var MovieNightAPI;
(function (MovieNightAPI) {
    var Vodlocker_com = (function () {
        function Vodlocker_com() {
            //Resolver properties
            this.domain = 'vodlocker.com';
            this.name = 'VodLocker.com';
            this.needsClientRefetch = true;
            this.mediaIdRegExp = [
                /vodlocker\.com\/embed-(.+?)-[0-9]+?x[0-9]+?/,
                /vodlocker\.com\/([^\/]+)$/
            ];
        }
        Vodlocker_com.prototype.recognizesUrlMayContainContent = function (url) {
            //[/vodlocker\.com\/?$/].concat(this.mediaIdRegExp)
            var matches = this.mediaIdRegExp
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
                var content = new MovieNightAPI.Content(self, mediaIdentifier);
                var fn = RegExp.curryExecute(html);
                content.snapshotImageUrl = fn(/image:[^"]*"(.+)"/);
                content.streamUrl = fn(/file:[^"]*"(.+)"/);
                var durStr = fn(/duration:[^"]*"([0-9]+)"/);
                content.duration = durStr ? +durStr : null;
                content.mimeType = 'video/mp4';
                var titleUrl = ('http://vodlocker.com/' + mediaIdentifier);
                MovieNightAPI.ResolverCommon.get(titleUrl, self, process)
                    .then(function (titleHtml) {
                    content.title = /<input\s*type="hidden"\s*name="fname"\s*value="([^"]*)/.execute(titleHtml);
                    MovieNightAPI.finishedWithContent(content, self, process);
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
    (function (ResolverErrorCode) {
        ResolverErrorCode[ResolverErrorCode["InternetFailure"] = 0] = "InternetFailure";
        ResolverErrorCode[ResolverErrorCode["InsufficientData"] = 1] = "InsufficientData";
        ResolverErrorCode[ResolverErrorCode["UnexpectedLogic"] = 2] = "UnexpectedLogic";
        ResolverErrorCode[ResolverErrorCode["InvalidMimeType"] = 3] = "InvalidMimeType";
        ResolverErrorCode[ResolverErrorCode["NoResponders"] = 4] = "NoResponders";
    })(MovieNightAPI.ResolverErrorCode || (MovieNightAPI.ResolverErrorCode = {}));
    var ResolverErrorCode = MovieNightAPI.ResolverErrorCode;
    var ResolverError = (function () {
        function ResolverError(code, description, mediaOwnerInfo) {
            var self = this;
            self.code = code;
            self.description = description;
            self.taskName = mediaOwnerInfo ? mediaOwnerInfo.name : "MovieNight";
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

///<reference path="../../vendor/es6-promise.d.ts" />
///<reference path="../../vendor/request.d.ts" />
///<reference path="../../vendor/node.d.ts" />
///<reference path="./Resolver.ts" />
var Request = require('request');
var MovieNightAPI;
(function (MovieNightAPI) {
    //network stuff
    var ResolverCommon;
    (function (ResolverCommon) {
        function get(url, mediaOwnerInfo, process) {
            return request({ 'method': 'GET', 'url': url }, mediaOwnerInfo, process);
        }
        ResolverCommon.get = get;
        function getMimeType(url, mediaOwnerInfo, process) {
            return request({ 'method': 'HEAD', 'url': url, 'timeout': 5 * 1000 }, mediaOwnerInfo, process);
        }
        ResolverCommon.getMimeType = getMimeType;
        function request(options, mediaOwnerInfo, process) {
            var q = new Promise(function (resolve, reject) {
                var self = this;
                var retryRequest = function (error, options) {
                    var retryOnErrorCodes = ['ECONNRESET', 'ETIMEDOUT'];
                    return (options.maxAttempts > 0 && (retryOnErrorCodes.indexOf(error.code) != -1));
                };
                //set retry parameters
                options.maxAttempts = 0;
                options.retryDelay = 300 + Math.random() * 1000;
                var makeRequest = function (options) {
                    Request(options, function (error, response, data) {
                        if (error) {
                            if (retryRequest(error, options)) {
                                //decrement & reset retry parameters
                                setTimeout(function () {
                                    options.maxAttempts = options.maxAttempts - 1;
                                    console.log(("RETRYING " + options.maxAttempts + ' - ' + options.url).inverse.dim);
                                    options.retryDelay = 300 + Math.random() * 1000;
                                    makeRequest(options);
                                }, options.retryDelay);
                            }
                            else {
                                console.log("<<<");
                                console.log("REQUEST ERROR".red.bold.underline);
                                console.log(error);
                                console.log(JSON.stringify(options, null, 4));
                                console.log(">>>");
                                // var internetError = new ResolverState(-4, self, { 'error': error, 'url': options.url })
                                var failure = new MovieNightAPI.ResolverError(MovieNightAPI.ResolverErrorCode.InternetFailure, "The internet failed when looking up url <" + options.url + ">", mediaOwnerInfo);
                                reject(failure);
                            }
                        }
                        else {
                            resolve((options.method == 'HEAD') ? response.headers['content-type'] : data);
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

var MovieNightAPI;
(function (MovieNightAPI) {
    var Raw = (function () {
        function Raw() {
        }
        //resolver properties
        Raw.prototype.recognizesUrlMayContainContent = function (url) {
            return true;
        };
        Raw.prototype.scrape = function (url, process) {
            var tempMediaOwner = {
                domain: 'movienight.it',
                name: 'MovieNight Scraper',
                needsClientRefetch: false
            };
            MovieNightAPI.ResolverCommon.getMimeType(url, tempMediaOwner, process).then(function (mimeType) {
                var isText = /(text\/)/.execute(mimeType) != null;
                var ifMimeTypeIsValidCreate = function (theUrl, mType, mProcess) {
                    if (MovieNightAPI.mimeTypeIsValid(mType)) {
                        var content = new MovieNightAPI.Content(tempMediaOwner, '1');
                        content.mimeType = mType;
                        content.streamUrl = theUrl;
                        MovieNightAPI.finishedWithContent(content, tempMediaOwner, mProcess);
                        return true;
                    }
                    return false;
                };
                if (isText) {
                    //parse for all urls
                    MovieNightAPI.ResolverCommon.get(url, tempMediaOwner, process).then(function (html) {
                        var alreadyUsedUrls = {};
                        alreadyUsedUrls[url] = true;
                        var urls1 = /((http|https):\/\/.*?)["';$]/g.executeAll(html);
                        var urls2 = /((http|https):\\\/\\\/.*?)["';$]/g.executeAll(html).map(function (url) {
                            var r = url.replace(/\\/g, '');
                            return r;
                        });
                        var urls = urls1.concat(urls2)
                            .filter(function (url) {
                            if (!alreadyUsedUrls[url]) {
                                alreadyUsedUrls[url] = true;
                                return true;
                            }
                            return false;
                        });
                        if (urls.length == 0) {
                            var noResponse = new MovieNightAPI.ResolverError(MovieNightAPI.ResolverErrorCode.NoResponders, "Sorry, we do not know what to do with this url.");
                            process.processOne({ 'type': MovieNightAPI.ResultType.Error, 'error': noResponse });
                        }
                        else {
                            urls.map(function (url) {
                                return {
                                    'url': url,
                                    'process': process.newChildProcess()
                                };
                            })
                                .forEach(function (pair) {
                                MovieNightAPI.ResolverCommon.getMimeType(pair.url, tempMediaOwner, pair.process).then(function (mimeType) {
                                    if (!ifMimeTypeIsValidCreate(pair.url, mimeType, pair.process)) {
                                        MovieNightAPI.resolvers().forEach(function (resolver) {
                                            resolver.scrape(pair.url, pair.process);
                                        });
                                    }
                                });
                            });
                        }
                    });
                }
                else {
                    if (!ifMimeTypeIsValidCreate(url, mimeType, process)) {
                        var noResponse = new MovieNightAPI.ResolverError(MovieNightAPI.ResolverErrorCode.NoResponders, ("Sorry, we were unable to recognize the mime type of the url " + url + "."));
                        process.processOne({ 'type': MovieNightAPI.ResultType.Error, 'error': noResponse });
                    }
                }
            });
        };
        return Raw;
    })();
    MovieNightAPI.Raw = Raw;
})(MovieNightAPI || (MovieNightAPI = {}));

///<reference path="./Resolver.ts" />
///<reference path="./resolvers/Raw.ts" />
var MovieNightAPI;
(function (MovieNightAPI) {
    function resolvers() {
        return [new MovieNightAPI.Vodlocker_com()];
    }
    MovieNightAPI.resolvers = resolvers;
    function scrape(url, process) {
        var responders = resolvers().filter(function (resolver) { return resolver.recognizesUrlMayContainContent(url); });
        if (responders.length == 0) {
            var raw = new MovieNightAPI.Raw();
            raw.scrape(url, process);
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

///<reference path="../vendor/colors.d.ts" />
///<reference path="../vendor/command-line-args.d.ts" />
///<reference path="./MovieNightAPI/resolvers/Vodlocker_com.ts" />
///<reference path="./MovieNightAPI/ResolverCommon.ts" />
///<reference path="./MovieNightAPI/ProcessNode.ts" />
///<reference path="./MovieNightAPI/Public.ts" />
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
        MovieNightAPI.scrape(options.scrape, head);
    }
    else {
        console.log(JSON.stringify(options, null, 4).white);
        console.warn("No command was run.  Use --help for usage.".red.bold);
    }
}

var MovieNightAPI;
(function (MovieNightAPI) {
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
        function Content(mediaOwner, mediaIdentifier) {
            this.mediaIdentifier = mediaIdentifier;
            this.title = "untitled";
            this.needsClientRefetch = mediaOwner.needsClientRefetch;
            this.domain = mediaOwner.domain;
            this.mediaOwnerName = mediaOwner.name;
        }
        return Content;
    })();
    MovieNightAPI.Content = Content;
    function mimeTypeIsValid(mimeType) {
        return (["video/mp4", "video/webm", "video/ogg", "video/youtube",
            "audio/mpeg", "video/twitch", "video/x-flv", "application/octet-stream",
            "rtmp"].filter(function (v) { return v == mimeType; }).length == 1);
    }
    MovieNightAPI.mimeTypeIsValid = mimeTypeIsValid;
    function finishedWithContent(content, mediaOwnerInfo, process) {
        content.uid = (mediaOwnerInfo.domain.replace(".", "_") + "|" + content.mediaIdentifier);
        if (!contentIsValid(content)) {
            var message = "Resolver " + mediaOwnerInfo.name + " cannot make Content with insufficient data." + JSON.stringify(content);
            var error = new MovieNightAPI.ResolverError(MovieNightAPI.ResolverErrorCode.InsufficientData, message, mediaOwnerInfo);
            process.processOne({ type: MovieNightAPI.ResultType.Error, error: error });
        }
        else {
            var reportInvalidMimeType = function () {
                var message = "Mime type " + content.mimeType + " is not supported.";
                var error = new MovieNightAPI.ResolverError(MovieNightAPI.ResolverErrorCode.InvalidMimeType, message, mediaOwnerInfo);
                process.processOne({ type: MovieNightAPI.ResultType.Error, error: error });
            };
            if (!content.mimeType) {
                var videoUrl = content.streamUrl || content.streamUrls[0].streamUrl;
                MovieNightAPI.ResolverCommon.getMimeType(videoUrl, mediaOwnerInfo, process).then(function (mimeType) {
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
    MovieNightAPI.finishedWithContent = finishedWithContent;
    function contentIsValid(content) {
        var streamUrls = content.streamUrls;
        var hasValidStreamUrls = (streamUrls && streamUrls.every(function (value) {
            return (value.quality != null &&
                value.quality != undefined &&
                value.streamUrl != null &&
                value.streamUrl != undefined);
        }));
        return content.streamUrl != null && content.streamUrl != undefined || hasValidStreamUrls;
    }
})(MovieNightAPI || (MovieNightAPI = {}));
