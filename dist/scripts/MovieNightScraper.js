RegExp.prototype.execute = function (str) {
    var results = this.exec(str);
    if (results) {
        return results[1];
    }
    return null;
};
RegExp.prototype.executeAll = function (str) {
    var self = this;
    var results = [];
    var val;
    while ((val = self.execute(str)) != null) {
        results.push(val);
    }
    return results;
};
RegExp.prototype.execAll = function (str) {
    var self = this;
    var results = [];
    var val;
    while ((val = self.exec(str)) != null) {
        results.push(val);
    }
    return results;
};
RegExp.curryExecute = function (str) {
    return function (reg) {
        return reg.execute(str);
    };
};

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
            this.mediaIdExtractors = [
                function (url) { return /vodlocker\.com\/embed-(.+?)-[0-9]+?x[0-9]+?/.execute(url); },
                function (url) { return /vodlocker\.com\/([^\/]+)$/.execute(url); }
            ];
        }
        Vodlocker_com.prototype.recognizesUrlMayContainContent = function (url) {
            return MovieNightAPI.extractMediaId(this, url) != undefined;
        };
        Vodlocker_com.prototype.resolveId = function (mediaIdentifier, process) {
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
            MovieNightAPI.extractMediaId(this, url, process);
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
        function formPost(url, postParams, mediaOwnerInfo, process) {
            return request({ 'method': 'POST', 'url': url, 'formData': postParams }, mediaOwnerInfo, process);
        }
        ResolverCommon.formPost = formPost;
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
                options.maxAttempts = 5;
                options.retryDelay = 800 + Math.random() * 1000;
                var makeRequest = function (options) {
                    // console.log("MAKING A REQUEST: " + JSON.stringify(options).bold)
                    Request(options, function (error, response, data) {
                        if (error) {
                            if (retryRequest(error, options)) {
                                //decrement & reset retry parameters
                                setTimeout(function () {
                                    options.maxAttempts = options.maxAttempts - 1;
                                    // console.log(("RETRYING " + options.maxAttempts + ' - ' + options.url).inverse.dim)
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
    function extractMediaId(res, url, process) {
        var matches = res.mediaIdExtractors
            .map(function (f) { return f(url); })
            .filter(function (str) { return str != null; });
        var mediaIdentifier = matches[0];
        if (process) {
            if (!mediaIdentifier) {
                var error = new MovieNightAPI.ResolverError(MovieNightAPI.ResolverErrorCode.InsufficientData, ("Could not get a MediaId from the url " + url), this);
                process.processOne({ type: MovieNightAPI.ResultType.Error, error: error });
            }
            else {
                res.resolveId(mediaIdentifier, process);
            }
        }
        // console.log(url)
        // console.log(res.mediaIdExtractors)
        // console.log("mediaIdentifier: " + mediaIdentifier)
        return mediaIdentifier;
    }
    MovieNightAPI.extractMediaId = extractMediaId;
    function getHiddenPostParams(html) {
        var hiddenReg = /input type="hidden" name="(.+)" value="(.+)"/g;
        return hiddenReg.execAll(html).reduce(function (p, c) {
            p[c[1]] = c[2];
            return p;
        }, {});
    }
    MovieNightAPI.getHiddenPostParams = getHiddenPostParams;
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

///<reference path="../../../vendor/es6-promise.d.ts" />
///<reference path="../../../vendor/colors.d.ts" />
///<reference path="../../Tools/RegExp.ts" />
var MovieNightAPI;
(function (MovieNightAPI) {
    var Gorillavid_in = (function () {
        function Gorillavid_in() {
            this.domain = 'gorillavid.in';
            this.name = 'Gorillavid';
            this.needsClientRefetch = true;
            this.mediaIdExtractors = [function (url) {
                    var result = /(http:\/\/)?gorillavid\.in\/(.+)\/?/.exec(url);
                    return result ? result[2] : null;
                }];
        }
        Gorillavid_in.prototype.recognizesUrlMayContainContent = function (url) {
            return MovieNightAPI.extractMediaId(this, url) != null;
        };
        Gorillavid_in.prototype.resolveId = function (mediaIdentifier, process) {
            var self = this;
            var url = ('http://gorillavid.in/' + mediaIdentifier);
            MovieNightAPI.ResolverCommon.get(url, self, process).then(function (html0) {
                var postParams = MovieNightAPI.getHiddenPostParams(html0);
                var title = postParams.fname;
                MovieNightAPI.ResolverCommon.formPost(url, postParams, self, process).then(function (html) {
                    var fn = RegExp.curryExecute(html);
                    var content = new MovieNightAPI.Content(self, mediaIdentifier);
                    content.streamUrl = fn(/file\s*:\s*"(.*)"/);
                    var durationStr = fn(/duration\s*:\s*"([0-9]+)"/);
                    content.duration = durationStr ? +durationStr : null;
                    content.snapshotImageUrl = fn(/image\s*:\s*"(.*)"/);
                    content.title = title;
                    MovieNightAPI.finishedWithContent(content, self, process);
                });
            });
        };
        Gorillavid_in.prototype.scrape = function (url, process) {
            MovieNightAPI.extractMediaId(this, url, process);
        };
        return Gorillavid_in;
    })();
    MovieNightAPI.Gorillavid_in = Gorillavid_in;
})(MovieNightAPI || (MovieNightAPI = {}));

var btoa2 = require('btoa');
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
                        var content = new MovieNightAPI.Content(tempMediaOwner, btoa2(url));
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
                                        var responders = MovieNightAPI.resolvers().filter(function (resolver) { return resolver.recognizesUrlMayContainContent(pair.url); });
                                        if (responders.length == 0) {
                                            var noResponse = new MovieNightAPI.ResolverError(MovieNightAPI.ResolverErrorCode.NoResponders, "Sorry, we do not know what to do with this url.");
                                            pair.process.processOne({ 'type': MovieNightAPI.ResultType.Error, 'error': noResponse });
                                        }
                                        else {
                                            responders
                                                .map(function (resolver) {
                                                return { 'resolver': resolver, 'process': pair.process.newChildProcess() };
                                            })
                                                .forEach(function (r) {
                                                r.resolver.scrape(pair.url, r.process);
                                            });
                                        }
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
        content.title = niceFilter(content.title);
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
                    content.mimeType = mimeType;
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
        })) && (streamUrls.length > 0);
        return (content.streamUrl != null && content.streamUrl != undefined) || hasValidStreamUrls;
    }
})(MovieNightAPI || (MovieNightAPI = {}));

///<reference path="../../../vendor/es6-promise.d.ts" />
///<reference path="../../../vendor/colors.d.ts" />
///<reference path="../../Tools/RegExp.ts" />
///<reference path="../Resolver.ts" />
///<reference path="../Content.ts" />
var MovieNightAPI;
(function (MovieNightAPI) {
    var Allmyvideos_net = (function () {
        function Allmyvideos_net() {
            this.domain = 'allmyvideos.net';
            this.name = 'AllMyVideos.net';
            this.needsClientRefetch = true;
            this.mediaIdExtractors = [
                function (url) { return /allmyvideos\.net\/v\/(.*)/.execute(url); },
                function (url) { return /allmyvideos\.net\/embed-(.*?)-/.execute(url); },
            ];
        }
        Allmyvideos_net.prototype.recognizesUrlMayContainContent = function (url) {
            return MovieNightAPI.extractMediaId(this, url) != undefined;
        };
        Allmyvideos_net.prototype.resolveId = function (mediaIdentifier, process) {
            var self = this;
            var url0 = ('http://allmyvideos.net/v/' + mediaIdentifier);
            MovieNightAPI.ResolverCommon.get(url0, self, process).then(function (html0) {
                var otherId = /http:\/\/allmyvideos.net\/builtin-(.+?)["'$]/.execute(html0);
                var url = "http://allmyvideos.net/" + otherId;
                // console.log(url.blue)
                if (otherId == null) {
                    var err = new MovieNightAPI.ResolverError(MovieNightAPI.ResolverErrorCode.InsufficientData, ("Unable to find " + self.domain + " video."), self);
                    process.processOne({ type: MovieNightAPI.ResultType.Error, error: err });
                }
                else {
                    MovieNightAPI.ResolverCommon.get(url, self, process).then(function (html) {
                        var postParams = MovieNightAPI.getHiddenPostParams(html);
                        // console.log(JSON.stringify(postParams, null, 4).italic)
                        MovieNightAPI.ResolverCommon.formPost(url, postParams, self, process).then(function (html) {
                            // console.log(html.bgCyan)
                            var fn = RegExp.curryExecute(html);
                            var content = new MovieNightAPI.Content(self, mediaIdentifier);
                            content.title = fn(/&filename=([^']*)/);
                            content.snapshotImageUrl = fn(/"image"\s*:\s*"(.+)"/);
                            var durationStr = fn(/"duration"\s*:\s*"([0-9]+)"/);
                            content.duration = durationStr ? +durationStr : null;
                            var srcsStr = fn(/"sources"\s*:\s*(\[[^\]]*)/) + ']';
                            var srcs;
                            try {
                                srcs = JSON.parse(srcsStr);
                                var labeledStreams = [];
                                srcs.forEach(function (srcJson) {
                                    labeledStreams.push({ 'quality': srcJson.label, 'streamUrl': srcJson.file });
                                });
                                content.streamUrls = labeledStreams;
                            }
                            catch (e) {
                                console.log(e);
                            }
                            MovieNightAPI.finishedWithContent(content, self, process);
                        });
                    });
                }
            });
        };
        Allmyvideos_net.prototype.scrape = function (url, process) {
            console.log("america".america + url);
            MovieNightAPI.extractMediaId(this, url, process);
        };
        return Allmyvideos_net;
    })();
    MovieNightAPI.Allmyvideos_net = Allmyvideos_net;
})(MovieNightAPI || (MovieNightAPI = {}));

///<reference path="../../../vendor/es6-promise.d.ts" />
///<reference path="../../../vendor/colors.d.ts" />
///<reference path="../../Tools/RegExp.ts" />
///<reference path="../Resolver.ts" />
///<reference path="../ResolverCommon.ts" />
///<reference path="../ProcessNode.ts" />
///<reference path="../Content.ts" />
//HAS PROBLEMS IN VIDEOJS
var MovieNightAPI;
(function (MovieNightAPI) {
    var Exashare_com = (function () {
        function Exashare_com() {
            this.domain = "exashare.com";
            this.name = "Exashare";
            this.needsClientRefetch = true;
            this.mediaIdExtractors = [
                function (url) { return /halazoun\.info\/embed-([a-zA-Z\d]+?)-/.execute(url); },
                function (url) { return /exashare\.com\/embed-([a-zA-Z\d]+?)-/.execute(url); },
                function (url) { return /exashare\.com\/([a-zA-Z\d]+?)(\.html)?$/.execute(url); }
            ];
        }
        Exashare_com.prototype.recognizesUrlMayContainContent = function (url) {
            return MovieNightAPI.extractMediaId(this, url) != undefined;
        };
        Exashare_com.prototype.resolveId = function (mediaIdentifier, process) {
            var self = this;
            var url0 = ("http://exashare.com/" + mediaIdentifier + ".html");
            //Refactor, look into what cookies are being stored that expire in 10 seconds, can I access this info faster?
            MovieNightAPI.ResolverCommon.get(url0, self, process).then(function (html0) {
                var postParams = MovieNightAPI.getHiddenPostParams(html0);
                var title = postParams.fname;
                var content = new MovieNightAPI.Content(self, mediaIdentifier);
                content.title = title;
                setTimeout(function () {
                    var url = ("http://exashare.com/embed-" + mediaIdentifier + "-960x540.html");
                    MovieNightAPI.ResolverCommon.formPost(url, postParams, self, process).then(function (html) {
                        var fn = RegExp.curryExecute(html);
                        content.snapshotImageUrl = fn(/playlist:[\s\S]*?image:.*?["'](.*)["']/);
                        content.streamUrl = fn(/playlist:[\s\S]*?file:.*?["'](.*)["']/);
                        var durationStr = fn(/duration:.*?["'](\d+)?["']/);
                        content.duration = durationStr ? +durationStr : null;
                        MovieNightAPI.finishedWithContent(content, self, process);
                    });
                }, 10 * 1000);
            });
        };
        Exashare_com.prototype.scrape = function (url, process) {
            MovieNightAPI.extractMediaId(this, url, process);
        };
        return Exashare_com;
    })();
    MovieNightAPI.Exashare_com = Exashare_com;
})(MovieNightAPI || (MovieNightAPI = {}));

///<reference path="../../../vendor/es6-promise.d.ts" />
///<reference path="../../../vendor/colors.d.ts" />
///<reference path="../../Tools/RegExp.ts" />
///<reference path="../Resolver.ts" />
///<reference path="../ResolverCommon.ts" />
///<reference path="../ProcessNode.ts" />
///<reference path="../Content.ts" />
var MovieNightAPI;
(function (MovieNightAPI) {
    var Vidlockers_ag = (function () {
        function Vidlockers_ag() {
            this.domain = "vidlockers.ag";
            this.name = "Vidlockers.ag";
            this.needsClientRefetch = true;
            this.mediaIdExtractors = [
                function (url) { return /vidlockers\.ag\/([a-zA-Z\d]+)?(\/.*)?(\.html)?$/.execute(url); }
            ];
        }
        Vidlockers_ag.prototype.recognizesUrlMayContainContent = function (url) {
            return MovieNightAPI.extractMediaId(this, url) != undefined;
        };
        Vidlockers_ag.prototype.resolveId = function (mediaIdentifier, process) {
            var self = this;
            var url0 = ('http://vidlockers.ag/' + mediaIdentifier + '.html');
            MovieNightAPI.ResolverCommon.get(url0, self, process).then(function (html0) {
                // console.log(html0.blue.italic)
                var postParams = MovieNightAPI.getHiddenPostParams(html0);
                MovieNightAPI.ResolverCommon.formPost(url0, postParams, self, process).then(function (html) {
                    var fn = RegExp.curryExecute(html);
                    var content = new MovieNightAPI.Content(self, mediaIdentifier);
                    content.snapshotImageUrl = fn(/image:.*["'](.+?)["']/);
                    content.streamUrl = fn(/file:.*["'](.*?)["']/);
                    var durationStr = fn(/duration:.*["']([0-9]+?)["']/);
                    content.duration = durationStr ? +durationStr : null;
                    var urlComponents = content.streamUrl.split('/');
                    content.title = urlComponents[urlComponents.length - 1];
                    MovieNightAPI.finishedWithContent(content, self, process);
                });
            });
        };
        Vidlockers_ag.prototype.scrape = function (url, process) {
            MovieNightAPI.extractMediaId(this, url, process);
        };
        return Vidlockers_ag;
    })();
    MovieNightAPI.Vidlockers_ag = Vidlockers_ag;
})(MovieNightAPI || (MovieNightAPI = {}));

///<reference path="../../../vendor/es6-promise.d.ts" />
///<reference path="../../../vendor/colors.d.ts" />
///<reference path="../../Tools/RegExp.ts" />
///<reference path="../Resolver.ts" />
///<reference path="../ResolverCommon.ts" />
///<reference path="../ProcessNode.ts" />
///<reference path="../Content.ts" />
var Base64 = require('../../node_modules/js-base64/base64.js').Base64;
// var Base64 = require('js-base64')
var MovieNightAPI;
(function (MovieNightAPI) {
    var Bakavideo_tv = (function () {
        function Bakavideo_tv() {
            this.domain = "Bakavideo.tv";
            this.name = "BakavideoTv";
            this.needsClientRefetch = true;
            this.mediaIdExtractors = [
                function (url) { return /bakavideo\.tv\/embed\/([a-zA-Z\d]+?)$/.execute(url); }
            ];
        }
        Bakavideo_tv.prototype.recognizesUrlMayContainContent = function (url) {
            return MovieNightAPI.extractMediaId(this, url) != undefined;
        };
        Bakavideo_tv.prototype.resolveId = function (mediaIdentifier, process) {
            var self = this;
            var url = ('https://bakavideo.tv/get/files.embed?f=' + mediaIdentifier);
            MovieNightAPI.ResolverCommon.get(url, self, process).then(function (jsonStr) {
                var streamUrls = null;
                try {
                    var json = JSON.parse(jsonStr);
                    var html = Base64.decode(json.content);
                    var content = new MovieNightAPI.Content(self, mediaIdentifier);
                    streamUrls = /<source(.*?)>/g.executeAll(html).map(function (component) {
                        var quality = /data-res="(.*?)"/.execute(component);
                        var url = /src="(.*?)"/.execute(component);
                        return { 'quality': quality, 'streamUrl': url };
                    });
                }
                catch (e) {
                    console.log(e);
                }
                content.streamUrls = streamUrls;
                MovieNightAPI.finishedWithContent(content, self, process);
            });
        };
        Bakavideo_tv.prototype.scrape = function (url, process) {
            MovieNightAPI.extractMediaId(this, url, process);
        };
        return Bakavideo_tv;
    })();
    MovieNightAPI.Bakavideo_tv = Bakavideo_tv;
})(MovieNightAPI || (MovieNightAPI = {}));

///<reference path="../../../vendor/es6-promise.d.ts" />
///<reference path="../../../vendor/colors.d.ts" />
///<reference path="../../Tools/RegExp.ts" />
///<reference path="../Resolver.ts" />
///<reference path="../ResolverCommon.ts" />
///<reference path="../ProcessNode.ts" />
///<reference path="../Content.ts" />
var Unpack = require('../../src/Tools/Unpacker/unpack.js');
var MovieNightAPI;
(function (MovieNightAPI) {
    var Powvideo_net = (function () {
        function Powvideo_net() {
            this.domain = 'powvideo.net';
            this.name = 'Powvideo';
            this.needsClientRefetch = true;
            this.mediaIdExtractors = [function (url) {
                    return /powvideo\.net\/([a-zA-Z\d]+)/.execute(url);
                }];
        }
        Powvideo_net.prototype.recognizesUrlMayContainContent = function (url) {
            return MovieNightAPI.extractMediaId(this, url) != undefined;
        };
        Powvideo_net.prototype.resolveId = function (mediaIdentifier, process) {
            var self = this;
            var url = ('http://powvideo.net/' + mediaIdentifier);
            MovieNightAPI.ResolverCommon.get(url, self, process).then(function (html0) {
                var postParams = MovieNightAPI.getHiddenPostParams(html0);
                var content = new MovieNightAPI.Content(self, mediaIdentifier);
                content.title = postParams ? postParams.fname : undefined;
                setTimeout(function () {
                    MovieNightAPI.ResolverCommon.formPost(url, postParams, self, process).then(function (html) {
                        try {
                            var evalStr = /<script>[\s\S]+?(eval\([\s\S]+?)<\/script>/.execute(html);
                            var fn = RegExp.curryExecute(Unpack.unpack(evalStr));
                            content.snapshotImageUrl = fn(/image.*?=.*?["'](.+?)["']/);
                            content.streamUrl = fn(/sources.*?src.*?:.*['"](.+?\.mp4)['"]/);
                            console.log('content.streamUrl: ' + content.streamUrl);
                        }
                        catch (e) {
                            console.log(e);
                        }
                        MovieNightAPI.finishedWithContent(content, self, process);
                    });
                }, 4000);
            });
        };
        Powvideo_net.prototype.scrape = function (url, process) {
            MovieNightAPI.extractMediaId(this, url, process);
        };
        return Powvideo_net;
    })();
    MovieNightAPI.Powvideo_net = Powvideo_net;
})(MovieNightAPI || (MovieNightAPI = {}));

///<reference path="../../../vendor/es6-promise.d.ts" />
///<reference path="../../../vendor/colors.d.ts" />
///<reference path="../../Tools/RegExp.ts" />
///<reference path="../Resolver.ts" />
///<reference path="../ResolverCommon.ts" />
///<reference path="../ProcessNode.ts" />
///<reference path="../Content.ts" />
var MovieNightAPI;
(function (MovieNightAPI) {
    var Bestreams_net = (function () {
        function Bestreams_net() {
            this.domain = "bestreams.net";
            this.name = "Bestreams";
            this.needsClientRefetch = true;
            this.mediaIdExtractors = [
                function (url) { return /bestreams\.net\/([a-zA-Z\d]+)/.execute(url); }
            ];
        }
        Bestreams_net.prototype.recognizesUrlMayContainContent = function (url) {
            return MovieNightAPI.extractMediaId(this, url) != undefined;
        };
        Bestreams_net.prototype.resolveId = function (mediaIdentifier, process) {
            var self = this;
            var url = ('http://bestreams.net/' + mediaIdentifier);
            console.log(url.bold);
            MovieNightAPI.ResolverCommon.get(url, self, process).then(function (html0) {
                // console.log(html0.red)
                var postParams = MovieNightAPI.getHiddenPostParams(html0);
                console.log(postParams);
                setTimeout(function () {
                    MovieNightAPI.ResolverCommon.formPost(url, postParams, self, process).then(function (html) {
                        console.log(html.blue.inverse);
                    });
                }, 4000);
            });
        };
        Bestreams_net.prototype.scrape = function (url, process) {
            MovieNightAPI.extractMediaId(this, url, process);
        };
        return Bestreams_net;
    })();
    MovieNightAPI.Bestreams_net = Bestreams_net;
})(MovieNightAPI || (MovieNightAPI = {}));

///<reference path="./Resolver.ts" />
///<reference path="./resolvers/Gorillavid_in.ts" />
///<reference path="./resolvers/Raw.ts" />
///<reference path="./resolvers/Allmyvideos_net.ts" />
///<reference path="./resolvers/Exashare_com.ts" />
///<reference path="./resolvers/Vidlockers_ag.ts" />
///<reference path="./resolvers/Bakavideo_tv.ts" />
///<reference path="./resolvers/Powvideo_net.ts" />
///<reference path="./resolvers/Bestreams_net.ts" />
var MovieNightAPI;
(function (MovieNightAPI) {
    function resolvers() {
        var resolvers = [
            new MovieNightAPI.Vodlocker_com(), new MovieNightAPI.Allmyvideos_net(),
            new MovieNightAPI.Gorillavid_in(), new MovieNightAPI.Exashare_com(),
            new MovieNightAPI.Vidlockers_ag(), new MovieNightAPI.Bakavideo_tv(),
            new MovieNightAPI.Powvideo_net(),
        ];
        return resolvers;
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
        // console.log(this.name())
        var resultsCount = 0;
        var head = new MovieNightAPI.ProcessNode(function (results, process) {
            // console.log("scrape result: " + options.scrape)
            // console.log("results: " + JSON.stringify(results, null, 4).red)
            // console.log("finished: ".blue, process.finished)
            results.forEach(function (result) {
                if (result.type == MovieNightAPI.ResultType.Content) {
                    resultsCount++;
                    console.log((resultsCount + ') ' + result.content.title).green.bold);
                    console.log(JSON.stringify(result.content, null, 4).green);
                }
            });
            if (process.finished) {
                console.log("finished: with ".blue, resultsCount);
            }
        });
        MovieNightAPI.scrape(options.scrape, head);
    }
    else {
        console.log(JSON.stringify(options, null, 4).white);
        console.warn("No command was run.  Use --help for usage.".red.bold);
    }
}

// function print(message?:any, ...optionalParams: any[]): void
// {
// 	console.log.apply(this, Array.prototype.slice.call(arguments))
// }
Function.prototype.name = function () {
    var myName = arguments.callee.toString();
    myName = myName.substr('function '.length);
    myName = myName.substr(0, myName.indexOf('('));
    return name;
};
var something = (function () {
    function something() {
    }
    something.prototype.iAmAFunction = function () {
        console.log(this.prototype);
    };
    return something;
})();
iAmAFunction();
