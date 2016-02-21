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
var MovieNightAPI;
(function (MovieNightAPI) {
    var Vodlocker_com = (function () {
        function Vodlocker_com() {
            this.domain = 'vodlocker.com';
            this.name = 'VodLocker.com';
            this.needsClientRefetch = true;
            this.mediaIdExtractors = [
                function (url) { return /vodlocker\.com\/embed-(.+?)-[0-9]+?x[0-9]+?/.execute(url); },
                function (url) { return /vodlocker\.com\/([^\/]+)(\/)?$/.execute(url); }
            ];
        }
        Vodlocker_com.prototype.recognizesUrlMayContainContent = function (url) {
            return (MovieNightAPI.extractMediaId(this, url) || /(vodlocker\.lol\/)/.execute(url)) != undefined;
        };
        Vodlocker_com.prototype.resolveId = function (mediaIdentifier, process) {
            var self = this;
            var url = ('http://vodlocker.com/embed-' + mediaIdentifier + '-650x370.html');
            MovieNightAPI.ResolverCommon.get(url, self, process)
                .then(function (html) {
                var content = new MovieNightAPI.Content(self, mediaIdentifier);
                var fn = RegExp.curryExecute(html);
                content.snapshotImageUrl = fn(/image:[^"]*"(.+)"/);
                var durStr = fn(/duration:[^"]*"([0-9]+)"/);
                content.duration = durStr ? +durStr : null;
                content.streams = [new MovieNightAPI.UrlStream(fn(/file:[^"]*"(.+)"/))];
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
            var extractedLolName = /vodlocker\.lol\/([^\/]+)(\/\?video)?(\/)?$/.execute(url);
            if (extractedLolName != null) {
                self.scrapeVodlockerLol(('http://vodlocker.lol/' + extractedLolName + '/?video'), process);
            }
            else {
                MovieNightAPI.extractMediaId(this, url, process);
            }
        };
        Vodlocker_com.prototype.scrapeVodlockerLol = function (url, process) {
            var self = this;
            MovieNightAPI.ResolverCommon.get(url, self, process).then(function (html) {
                var realUrl = /<iframe src=["'](.*)["']/i.execute(html);
                MovieNightAPI.extractMediaId(self, realUrl, process);
            });
        };
        return Vodlocker_com;
    }());
    MovieNightAPI.Vodlocker_com = Vodlocker_com;
})(MovieNightAPI || (MovieNightAPI = {}));
var MovieNightAPI;
(function (MovieNightAPI) {
    (function (ResolverErrorCode) {
        ResolverErrorCode[ResolverErrorCode["InternetFailure"] = 0] = "InternetFailure";
        ResolverErrorCode[ResolverErrorCode["FileRemoved"] = 1] = "FileRemoved";
        ResolverErrorCode[ResolverErrorCode["InsufficientData"] = 2] = "InsufficientData";
        ResolverErrorCode[ResolverErrorCode["UnexpectedLogic"] = 3] = "UnexpectedLogic";
        ResolverErrorCode[ResolverErrorCode["InvalidMimeType"] = 4] = "InvalidMimeType";
        ResolverErrorCode[ResolverErrorCode["NoResponders"] = 5] = "NoResponders";
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
    }());
    MovieNightAPI.ResolverError = ResolverError;
    (function (ResultType) {
        ResultType[ResultType["Error"] = 0] = "Error";
        ResultType[ResultType["Content"] = 1] = "Content";
        ResultType[ResultType["Contents"] = 2] = "Contents";
    })(MovieNightAPI.ResultType || (MovieNightAPI.ResultType = {}));
    var ResultType = MovieNightAPI.ResultType;
})(MovieNightAPI || (MovieNightAPI = {}));
var Request = require('request');
var MovieNightAPI;
(function (MovieNightAPI) {
    var ResolverCommon;
    (function (ResolverCommon) {
        function beautify(ugly) {
            var Unpack = require('../src/Tools/Unpacker/unpack.js');
            return Unpack.unpack(ugly);
        }
        ResolverCommon.beautify = beautify;
        function getAll(url, mediaOwnerInfo, process) {
            return request({ 'method': 'GET', 'url': url }, mediaOwnerInfo, process, true);
        }
        ResolverCommon.getAll = getAll;
        function get(url, mediaOwnerInfo, process) {
            return request({ 'method': 'GET', 'url': url }, mediaOwnerInfo, process);
        }
        ResolverCommon.get = get;
        function formPost(url, postParams, mediaOwnerInfo, process) {
            return request({ 'method': 'POST', 'url': url, 'formData': postParams }, mediaOwnerInfo, process);
        }
        ResolverCommon.formPost = formPost;
        function getMimeType(url, mediaOwnerInfo, process) {
            return request({ 'method': 'HEAD', 'url': url, 'timeout': 20 * 1000 }, mediaOwnerInfo, process);
        }
        ResolverCommon.getMimeType = getMimeType;
        function request(options, mediaOwnerInfo, process, getAll) {
            var q = new Promise(function (resolve, reject) {
                var self = this;
                var retryRequest = function (error, options) {
                    var retryOnErrorCodes = ['ECONNRESET', 'ETIMEDOUT'];
                    return (options.maxAttempts > 0 && (retryOnErrorCodes.indexOf(error.code) != -1));
                };
                options.maxAttempts = 0;
                options.retryDelay = 800 + Math.random() * 1000;
                var makeRequest = function (options) {
                    Request(options, function (error, response, data) {
                        if (error) {
                            if (retryRequest(error, options)) {
                                setTimeout(function () {
                                    options.maxAttempts = options.maxAttempts - 1;
                                    options.retryDelay = 300 + Math.random() * 1000;
                                    makeRequest(options);
                                }, options.retryDelay);
                            }
                            else {
                                console.debug("<<<");
                                console.debug("REQUEST ERROR".red.bold.underline);
                                console.debug(error);
                                console.debug(JSON.stringify(options, null, 4));
                                console.debug(">>>");
                                var failure = new MovieNightAPI.ResolverError(MovieNightAPI.ResolverErrorCode.InternetFailure, "The internet failed when looking up url <" + options.url + ">", mediaOwnerInfo);
                                reject(failure);
                            }
                        }
                        else {
                            if (getAll) {
                                resolve(response);
                            }
                            else {
                                resolve((options.method == 'HEAD') ? response.headers['content-type'] : data);
                            }
                        }
                    });
                };
                makeRequest(options);
            });
            q.catch(function (failure) {
                console.debug("network error failed".red);
                process.processOne({ type: MovieNightAPI.ResultType.Error, error: failure });
            });
            return q;
        }
        ResolverCommon.request = request;
        function raiseFileNotFoundError(res, url, process) {
            var message = ("Sorry, the file no longer exists on " + res.domain + " at " + url);
            process.processOne({
                type: MovieNightAPI.ResultType.Error,
                error: new MovieNightAPI.ResolverError(MovieNightAPI.ResolverErrorCode.FileRemoved, message, res)
            });
        }
        ResolverCommon.raiseFileNotFoundError = raiseFileNotFoundError;
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
    }());
    MovieNightAPI.ProcessNode = ProcessNode;
})(MovieNightAPI || (MovieNightAPI = {}));
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
                    content.streams = [new MovieNightAPI.UrlStream(fn(/file\s*:\s*"(.*)"/))];
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
    }());
    MovieNightAPI.Gorillavid_in = Gorillavid_in;
})(MovieNightAPI || (MovieNightAPI = {}));
var btoa2 = require('btoa');
var MovieNightAPI;
(function (MovieNightAPI) {
    var Raw = (function () {
        function Raw() {
        }
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
                        var stream = new MovieNightAPI.UrlStream(theUrl);
                        stream.mimeType = mType;
                        content.streams = [stream];
                        MovieNightAPI.finishedWithContent(content, tempMediaOwner, mProcess);
                        return true;
                    }
                    return false;
                };
                if (isText) {
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
                        var urlsToSuccess = {};
                        var completionCount = 0;
                        var reportResponder = function (url, success) {
                            urlsToSuccess[url] = success;
                            completionCount++;
                            if (completionCount == urls.length - 1) {
                                Object.keys(urlsToSuccess).forEach(function (k) {
                                    console.debug(urlsToSuccess[k] ? k.yellow.inverse : k.yellow);
                                });
                            }
                        };
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
                                        var foundResponders = (responders.length > 0);
                                        reportResponder(pair.url, foundResponders);
                                        if (!foundResponders) {
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
    }());
    MovieNightAPI.Raw = Raw;
})(MovieNightAPI || (MovieNightAPI = {}));
var MovieNightAPI;
(function (MovieNightAPI) {
    (function (StreamType) {
        StreamType[StreamType["Url"] = 0] = "Url";
        StreamType[StreamType["Rtmp"] = 1] = "Rtmp";
    })(MovieNightAPI.StreamType || (MovieNightAPI.StreamType = {}));
    var StreamType = MovieNightAPI.StreamType;
    var UrlStream = (function () {
        function UrlStream(url) {
            this.url = url;
            this.type = StreamType.Url;
        }
        UrlStream.prototype.isValid = function () {
            return (this.url != null);
        };
        return UrlStream;
    }());
    MovieNightAPI.UrlStream = UrlStream;
    var RtmpStream = (function () {
        function RtmpStream(server, file) {
            this.server = server;
            this.file = file;
            this.type = StreamType.Rtmp;
        }
        RtmpStream.prototype.isValid = function () {
            return (this.server != null && this.file != null);
        };
        return RtmpStream;
    }());
    MovieNightAPI.RtmpStream = RtmpStream;
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
        'MiTED', 'xvid', 'webrip', 'XVID', '1080p', 'DD5', 'TSV',
        'iNTERNAL', 'BDRip'];
    function niceFilter(rawTitle) {
        if (!rawTitle) {
            return null;
        }
        var components = rawTitle.split(/[\.\s,\-\_+]+/);
        var scoresAndComponents = components.map(function (component) {
            var value = (removeThese.indexOf(component) === -1) ? true : false;
            return { 'component': component, 'keep': value };
        });
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
    }());
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
            var reportInvalidMimeType = function (mimeType) {
                var message = "Mime type " + mimeType + " is not supported.";
                var error = new MovieNightAPI.ResolverError(MovieNightAPI.ResolverErrorCode.InvalidMimeType, message, mediaOwnerInfo);
                process.processOne({ type: MovieNightAPI.ResultType.Error, error: error });
            };
            var stream = content.streams[0];
            if (stream.type == StreamType.Url && !stream.mimeType) {
                var urlStream = stream;
                var videoUrl = urlStream.url;
                MovieNightAPI.ResolverCommon.getMimeType(videoUrl, mediaOwnerInfo, process).then(function (mimeType) {
                    content.streams.forEach(function (someStream) {
                        someStream.mimeType = mimeType;
                    });
                    if (!mimeTypeIsValid(mimeType)) {
                        reportInvalidMimeType(mimeType);
                    }
                    else {
                        process.processOne({ type: MovieNightAPI.ResultType.Content, content: content });
                    }
                });
            }
            else if (stream.type == StreamType.Url && !mimeTypeIsValid(content.streams[0].mimeType)) {
                reportInvalidMimeType(content.streams[0].mimeType);
            }
            else {
                process.processOne({ type: MovieNightAPI.ResultType.Content, content: content });
            }
        }
    }
    MovieNightAPI.finishedWithContent = finishedWithContent;
    function contentIsValid(content) {
        var streams = content.streams;
        content.streams = streams ? streams.filter(function (stream) {
            return stream.isValid();
        }) : [];
        return content.streams.length > 0;
    }
})(MovieNightAPI || (MovieNightAPI = {}));
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
                function (url) { return /allmyvideos\.net\/([a-zA-Z\d]*?)(\/)?(\.html)?$/.execute(url); }
            ];
        }
        Allmyvideos_net.prototype.recognizesUrlMayContainContent = function (url) {
            return MovieNightAPI.extractMediaId(this, url) != undefined;
        };
        Allmyvideos_net.prototype.resolveId = function (mediaIdentifier, process) {
            var self = this;
            var url0 = ('http://allmyvideos.net/v/' + mediaIdentifier);
            MovieNightAPI.ResolverCommon.get(url0, self, process).then(function (html0) {
                var url = "http://allmyvideos.net/" + mediaIdentifier;
                var f = false;
                if (f) {
                    console.log("OIH... ok ");
                    var err = new MovieNightAPI.ResolverError(MovieNightAPI.ResolverErrorCode.InsufficientData, ("Unable to find " + self.domain + " video."), self);
                    process.processOne({ type: MovieNightAPI.ResultType.Error, error: err });
                }
                else {
                    MovieNightAPI.ResolverCommon.get(url, self, process).then(function (html) {
                        var postParams = MovieNightAPI.getHiddenPostParams(html);
                        MovieNightAPI.ResolverCommon.formPost(url, postParams, self, process).then(function (html) {
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
                                content.streams = srcs.map(function (srcJson) {
                                    var stream = new MovieNightAPI.UrlStream(srcJson.file);
                                    stream.name = srcJson.label;
                                    return stream;
                                });
                            }
                            catch (e) {
                                logError(e);
                            }
                            MovieNightAPI.finishedWithContent(content, self, process);
                        });
                    });
                }
            });
        };
        Allmyvideos_net.prototype.scrape = function (url, process) {
            MovieNightAPI.extractMediaId(this, url, process);
        };
        return Allmyvideos_net;
    }());
    MovieNightAPI.Allmyvideos_net = Allmyvideos_net;
})(MovieNightAPI || (MovieNightAPI = {}));
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
            MovieNightAPI.ResolverCommon.get(url0, self, process).then(function (html0) {
                var postParams = MovieNightAPI.getHiddenPostParams(html0);
                var title = postParams.fname;
                var content = new MovieNightAPI.Content(self, mediaIdentifier);
                content.title = title;
                var url = /player_wrap[\s\S]*?src\s*?=["']([\s\S]*?)["']/.execute(html0);
                url = url.replace('\n', '');
                MovieNightAPI.ResolverCommon.get(url, self, process).then(function (html) {
                    console.log(html.blue);
                    var fn = RegExp.curryExecute(html);
                    content.snapshotImageUrl = fn(/playlist:[\s\S]*?image:.*?["'](.*)["']/);
                    content.streams = [new MovieNightAPI.UrlStream(fn(/playlist:[\s\S]*?file:.*?["'](.*)["']/))];
                    var durationStr = fn(/duration:.*?["'](\d+)?["']/);
                    content.duration = durationStr ? +durationStr : null;
                    console.log(url);
                    console.log(JSON.stringify(content, null, 4).magenta);
                    MovieNightAPI.finishedWithContent(content, self, process);
                });
            });
        };
        Exashare_com.prototype.scrape = function (url, process) {
            MovieNightAPI.extractMediaId(this, url, process);
        };
        return Exashare_com;
    }());
    MovieNightAPI.Exashare_com = Exashare_com;
})(MovieNightAPI || (MovieNightAPI = {}));
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
                var postParams = MovieNightAPI.getHiddenPostParams(html0);
                MovieNightAPI.ResolverCommon.formPost(url0, postParams, self, process).then(function (html) {
                    var content = new MovieNightAPI.Content(self, mediaIdentifier);
                    try {
                        var evalScript = /player_code.*?<script.*?>(eval\([\s\S]*?)<\/script>/.execute(html);
                        var beautiful = MovieNightAPI.ResolverCommon.beautify(evalScript);
                        var fn = RegExp.curryExecute(beautiful);
                        content.snapshotImageUrl = fn(/image:.*["'](.+?)["']/);
                        var stream = new MovieNightAPI.UrlStream(fn(/src.*?=.*?["'](.*?)["']/));
                        content.streams = [stream];
                        var durationStr = fn(/duration:.*["']([0-9]+?)["']/);
                        content.duration = durationStr ? +durationStr : null;
                        var urlComponents = stream.url.split('/');
                        content.title = urlComponents[urlComponents.length - 1];
                    }
                    catch (e) {
                        logError(e);
                    }
                    MovieNightAPI.finishedWithContent(content, self, process);
                });
            });
        };
        Vidlockers_ag.prototype.scrape = function (url, process) {
            MovieNightAPI.extractMediaId(this, url, process);
        };
        return Vidlockers_ag;
    }());
    MovieNightAPI.Vidlockers_ag = Vidlockers_ag;
})(MovieNightAPI || (MovieNightAPI = {}));
var Base64 = require('js-base64');
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
            console.log("MEDIA ID: " + mediaIdentifier);
            var self = this;
            var url = ('https://bakavideo.tv/get/files.embed?f=' + mediaIdentifier);
            MovieNightAPI.ResolverCommon.get(url, self, process).then(function (jsonStr) {
                try {
                    var json = JSON.parse(jsonStr);
                    var html = Base64.decode(json.content);
                    var content = new MovieNightAPI.Content(self, mediaIdentifier);
                    content.streams = /<source(.*?)>/g.executeAll(html)
                        .map(function (component) {
                        var stream = new MovieNightAPI.UrlStream(/src="(.*?)"/.execute(component));
                        stream.name = /data-res="(.*?)"/.execute(component);
                        return stream;
                    });
                }
                catch (e) {
                    logError(e);
                }
                MovieNightAPI.finishedWithContent(content, self, process);
            });
        };
        Bakavideo_tv.prototype.scrape = function (url, process) {
            MovieNightAPI.extractMediaId(this, url, process);
        };
        return Bakavideo_tv;
    }());
    MovieNightAPI.Bakavideo_tv = Bakavideo_tv;
})(MovieNightAPI || (MovieNightAPI = {}));
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
                            var fn = RegExp.curryExecute(MovieNightAPI.ResolverCommon.beautify(evalStr));
                            content.snapshotImageUrl = fn(/image.*?=.*?["'](.+?)["']/);
                            content.streams = [new MovieNightAPI.UrlStream(fn(/sources.*?src.*?:.*['"](.+?\.mp4)['"]/))];
                        }
                        catch (e) {
                            logError(e);
                        }
                        MovieNightAPI.finishedWithContent(content, self, process);
                    });
                }, 6000);
            });
        };
        Powvideo_net.prototype.scrape = function (url, process) {
            MovieNightAPI.extractMediaId(this, url, process);
        };
        return Powvideo_net;
    }());
    MovieNightAPI.Powvideo_net = Powvideo_net;
})(MovieNightAPI || (MovieNightAPI = {}));
var MovieNightAPI;
(function (MovieNightAPI) {
    var Bestreams_net = (function () {
        function Bestreams_net() {
            this.domain = "bestreams.net";
            this.name = "Bestreams";
            this.needsClientRefetch = true;
            this.mediaIdExtractors = [
                function (url) {
                    return /bestreams\.net\/embed-(.*?)-/.execute(url);
                },
                function (url) {
                    var possibleMediaId = /bestreams\.net\/([a-zA-Z\d]+)/.execute(url);
                    return possibleMediaId == "embed" ? null : possibleMediaId;
                }
            ];
        }
        Bestreams_net.prototype.recognizesUrlMayContainContent = function (url) {
            return MovieNightAPI.extractMediaId(this, url) != undefined;
        };
        Bestreams_net.prototype.resolveId = function (mediaIdentifier, process) {
            var self = this;
            var url = ('http://bestreams.net/' + mediaIdentifier);
            var numRetries = 2;
            var doResolveId = function () {
                MovieNightAPI.ResolverCommon.get(url, self, process).then(function (html0) {
                    var postParams = MovieNightAPI.getHiddenPostParams(html0);
                    var content = new MovieNightAPI.Content(self, mediaIdentifier);
                    content.title = postParams.fname;
                    setTimeout(function () {
                        MovieNightAPI.ResolverCommon.formPost(url, postParams, self, process).then(function (html) {
                            var fn = RegExp.curryExecute(html);
                            content.snapshotImageUrl = fn(/image\s*:\s*["'](.+)["']/);
                            var durationStr = fn(/duration\s*:\s*["']([0-9]+?)["']/);
                            content.duration = durationStr ? +durationStr : null;
                            var stream = new MovieNightAPI.RtmpStream(fn(/streamer\s*:\s*["'](.+?)["']/), fn(/file\s*:\s*["'](.+?)["']/));
                            content.streams = [stream];
                            if (!stream.server && numRetries > 0) {
                                numRetries--;
                                doResolveId();
                            }
                            else {
                                MovieNightAPI.finishedWithContent(content, self, process);
                            }
                        });
                    }, 500);
                });
            };
            doResolveId();
        };
        Bestreams_net.prototype.scrape = function (url, process) {
            MovieNightAPI.extractMediaId(this, url, process);
        };
        return Bestreams_net;
    }());
    MovieNightAPI.Bestreams_net = Bestreams_net;
})(MovieNightAPI || (MovieNightAPI = {}));
var MovieNightAPI;
(function (MovieNightAPI) {
    var Vidbull_lol = (function () {
        function Vidbull_lol() {
            this.name = "Vidbull";
            this.domain = "vidbull.lol";
            this.needsClientRefetch = true;
            this.mediaIdExtractors = [
                function (url) { return /vidbull\.lol\/([a-zA-Z\d-]+?)(\/\?video|$)/.execute(url); }
            ];
        }
        Vidbull_lol.prototype.recognizesUrlMayContainContent = function (url) {
            return MovieNightAPI.extractMediaId(this, url) != undefined;
        };
        Vidbull_lol.prototype.resolveId = function (mediaIdentifier, process) {
            var self = this;
            var url = ('http://vidbull.lol/' + mediaIdentifier + '/?video');
            MovieNightAPI.ResolverCommon.get(url, self, process).then(function (html) {
                var vidbullMediaId = MovieNightAPI.Vidbull_com.vidbullEmbededContentRegexMediaId.execute(html);
                if (vidbullMediaId) {
                    console.log(vidbullMediaId.blue);
                    new MovieNightAPI.Vidbull_com().resolveId(vidbullMediaId, process);
                }
                else {
                    var content = new MovieNightAPI.Content(self, "nonsense");
                    MovieNightAPI.finishedWithContent(content, self, process);
                }
            });
        };
        Vidbull_lol.prototype.scrape = function (url, process) {
            MovieNightAPI.extractMediaId(this, url, process);
        };
        return Vidbull_lol;
    }());
    MovieNightAPI.Vidbull_lol = Vidbull_lol;
})(MovieNightAPI || (MovieNightAPI = {}));
var MovieNightAPI;
(function (MovieNightAPI) {
    var Vidbull_com = (function () {
        function Vidbull_com() {
            this.name = "Vidbull";
            this.domain = "vidbull.com";
            this.needsClientRefetch = true;
            this.mediaIdExtractors = [
                function (url) { return /vidbull\.com\/([a-zA-Z\d-]+?)$/.execute(url); },
                function (url) { return Vidbull_com.vidbullEmbededContentRegexMediaId.execute(url); }
            ];
        }
        Vidbull_com.prototype.recognizesUrlMayContainContent = function (url) {
            return MovieNightAPI.extractMediaId(this, url) != undefined;
        };
        Vidbull_com.prototype.resolveId = function (mediaIdentifier, process) {
            var self = this;
            var url = ('http://vidbull.com/embed-' + mediaIdentifier + '-720x405.html');
            console.log(url);
            MovieNightAPI.ResolverCommon.get(url, self, process).then(function (html) {
                var content = new MovieNightAPI.Content(self, mediaIdentifier);
                try {
                    var evals = /<script.*?>(eval\([\s\S]*?)<\/script>/g.executeAll(html)[1];
                    var unpacked = MovieNightAPI.ResolverCommon.beautify(evals);
                    var fn = RegExp.curryExecute(unpacked);
                    var file = fn(/jwplayer.*file:['"]([a-zA-Z\d]*?)['"]/);
                    var image = fn(/image:["'](.*?)["']/);
                    console.log('file: ' + file);
                }
                catch (e) {
                    console.log(e);
                    logError(e);
                }
                MovieNightAPI.finishedWithContent(content, self, process);
            });
        };
        Vidbull_com.prototype.scrape = function (url, process) {
            MovieNightAPI.extractMediaId(this, url, process);
        };
        Vidbull_com.vidbullEmbededContentRegexMediaId = /vidbull\.com\/embed-([a-zA-Z\d]+?)-/;
        return Vidbull_com;
    }());
    MovieNightAPI.Vidbull_com = Vidbull_com;
})(MovieNightAPI || (MovieNightAPI = {}));
var MovieNightAPI;
(function (MovieNightAPI) {
    var Thevideo_me = (function () {
        function Thevideo_me() {
            this.domain = 'thevideo.me';
            this.name = 'TheVideo.me';
            this.needsClientRefetch = true;
            this.mediaIdExtractors = [
                function (url) { return /thevideo\.me\/embed-([0-9a-zA-Z]+?)-/.execute(url); },
                function (url) { return /thevideo\.me\/embed-([0-9a-zA-Z]+?)(\.html)?$/.execute(url); },
                function (url) { return /thevideo\.me\/([0-9a-zA-Z]+?)(\.html)?$/.execute(url); }
            ];
        }
        Thevideo_me.prototype.recognizesUrlMayContainContent = function (url) {
            return MovieNightAPI.extractMediaId(this, url) != undefined;
        };
        Thevideo_me.prototype.resolveId = function (mediaIdentifier, process) {
            var self = this;
            var url = ('http://thevideo.me/embed-' + mediaIdentifier + '.html');
            MovieNightAPI.ResolverCommon.get(url, self, process).then(function (html) {
                var content = new MovieNightAPI.Content(self, mediaIdentifier);
                try {
                    var jwplayerconfig = /jwConfig_vars\s*=\s([\s\S]*?};)/.execute(html);
                    jwplayerconfig = jwplayerconfig.replace(/'/g, '"');
                    var fn = RegExp.curryExecute(jwplayerconfig);
                    content.title = fn(/["']?title["']?\s*?:\s*?["'](.*?)["']/);
                    content.snapshotImageUrl = fn(/["']?image["']?\s*?:\s*?["'](.*?)["']/);
                    var durationStr = fn(/["']?duration["']?\s*?:\s*?["']([0-9]*?)["']/);
                    content.duration = durationStr ? +durationStr : null;
                    var sources = fn(/["']?sources["']?\s*?:\s*?(\[[\s\S]*?\])/);
                    var sourceses = /\{(.*?)\}/g.executeAll(sources);
                    content.streams = sourceses.map(function (s) {
                        var label = /["']?label["']?\s*:\s*['"](.*?)['"]/.execute(s);
                        var file = /["']?file["']?\s*:\s*['"](.*?)['"]/.execute(s);
                        var urlStream = new MovieNightAPI.UrlStream(file);
                        urlStream.name = label;
                        return urlStream;
                    });
                }
                catch (e) {
                    logError(e);
                }
                MovieNightAPI.finishedWithContent(content, self, process);
            });
        };
        Thevideo_me.prototype.scrape = function (url, process) {
            MovieNightAPI.extractMediaId(this, url, process);
        };
        return Thevideo_me;
    }());
    MovieNightAPI.Thevideo_me = Thevideo_me;
})(MovieNightAPI || (MovieNightAPI = {}));
var MovieNightAPI;
(function (MovieNightAPI) {
    var Mycollection_net = (function () {
        function Mycollection_net() {
            this.domain = 'mycollection.net';
            this.name = 'MyCollection.net';
            this.needsClientRefetch = false;
            this.mediaIdExtractors = [
                function (url) {
                    var res = /mycollection\.net\/file\/(embed\/)?([a-zA-Z\d]+)(\.html)?$/.exec(url);
                    return res ? res[2] : null;
                },
                function (url) { return /vidbaba\.com\/files\/([a-zA-Z\d]+?)(\.html)?(\/)?$/.execute(url); },
                function (url) { return /gagomatic\.com\/files\/([a-zA-Z\d]+?)(\.html)?(\/)?$/.execute(url); },
                function (url) { return /funblur\.com\/files\/([a-zA-Z\d]+?)(\.html)?(\/)?$/.execute(url); },
                function (url) { return /favour\.me\/files\/([a-zA-Z\d]+?)(\.html)?(\/)?$/.execute(url); },
            ];
        }
        Mycollection_net.prototype.resolveId = function (mediaIdentifier, process) {
            var self = this;
            var url0 = ('http://www.mycollection.net/file/' + mediaIdentifier);
            MovieNightAPI.ResolverCommon.get(url0, self, process).then(function (html0) {
                var content = new MovieNightAPI.Content(self, mediaIdentifier);
                content.title = /<title>(.*)?<\/title>/.execute(html0);
                var url = ('http://www.mycollection.net/file/embed/' + mediaIdentifier);
                MovieNightAPI.ResolverCommon.get(url, self, process).then(function (html) {
                    try {
                        var sourcesStr = /sources\s*:\s*\[([\s\S]+?)\]/.execute(html);
                        content.streams = /\{([\s\S]+?)\}/g.executeAll(html).map(function (str) {
                            var file = /file\s*:\s*["'](.*?)["']/.execute(str);
                            var name = /label\s*:\s*["'](.*?)["']/.execute(str);
                            var stream = new MovieNightAPI.UrlStream(file);
                            stream.name = name;
                            stream.mimeType = 'video/mp4';
                            return stream;
                        });
                    }
                    catch (e) {
                        logError(e);
                    }
                    MovieNightAPI.finishedWithContent(content, self, process);
                });
            });
        };
        Mycollection_net.prototype.recognizesUrlMayContainContent = function (url) {
            return MovieNightAPI.extractMediaId(this, url) != null;
        };
        Mycollection_net.prototype.scrape = function (url, process) {
            MovieNightAPI.extractMediaId(this, url, process);
        };
        return Mycollection_net;
    }());
    MovieNightAPI.Mycollection_net = Mycollection_net;
})(MovieNightAPI || (MovieNightAPI = {}));
var MovieNightAPI;
(function (MovieNightAPI) {
    var Lolzor_com = (function () {
        function Lolzor_com() {
            this.domain = 'lolzor.com';
            this.name = 'Lolzor.com';
            this.needsClientRefetch = true;
            this.mediaIdExtractors = [
                function (url) { return /lolzor\.com\/files\/([a-zA-Z\d]+?)(\.html)?(\/)?$/.execute(url); }
            ];
        }
        Lolzor_com.prototype.resolveId = function (mediaIdentifier, process) {
            var self = this;
            var url0 = ('http://lolzor.com/files/' + mediaIdentifier);
            MovieNightAPI.ResolverCommon.get(url0, self, process).then(function (html0) {
                var content = new MovieNightAPI.Content(self, mediaIdentifier);
                content.title = /<title>(.+)?<\//.execute(html0);
                var url = ('http://lolzor.com/files/get_video/' + mediaIdentifier);
                console.log(url.blue);
                MovieNightAPI.ResolverCommon.get(url, self, process).then(function (html) {
                    var videoMetadataUrl = decodeURIComponent(/["'](http:\/\/(.+)PlayerMetadata(.+?))["']/.execute(html));
                    console.log(videoMetadataUrl.magenta);
                    MovieNightAPI.ResolverCommon.get(videoMetadataUrl, self, process).then(function (jsonStr) {
                        try {
                            var json = JSON.parse(jsonStr);
                            console.log(JSON.stringify(json, null, 5).cyan);
                            content.duration = json.movie.duration ? +json.movie.duration : null;
                            content.streams = json.videos.map(function (videoObj) {
                                var stream = new MovieNightAPI.UrlStream(videoObj.url);
                                stream.name = videoObj.name;
                                stream.mimeType = 'video/mp4';
                                return stream;
                            });
                        }
                        catch (e) {
                            logError(e);
                        }
                        MovieNightAPI.finishedWithContent(content, self, process);
                    });
                });
            });
        };
        Lolzor_com.prototype.recognizesUrlMayContainContent = function (url) {
            return MovieNightAPI.extractMediaId(this, url) != null;
        };
        Lolzor_com.prototype.scrape = function (url, process) {
            MovieNightAPI.extractMediaId(this, url, process);
        };
        return Lolzor_com;
    }());
    MovieNightAPI.Lolzor_com = Lolzor_com;
})(MovieNightAPI || (MovieNightAPI = {}));
var MovieNightAPI;
(function (MovieNightAPI) {
    var Filehoot_com = (function () {
        function Filehoot_com() {
            this.domain = 'filehoot.com';
            this.name = 'Filehoot';
            this.needsClientRefetch = true;
            this.mediaIdExtractors = [
                function (url) { return /filehoot\.com\/([a-zA-Z\d]+?)(\.html)?$/.execute(url); }
            ];
        }
        Filehoot_com.prototype.resolveId = function (mediaIdentifier, process) {
            var self = this;
            var url0 = ('http://filehoot.com/' + mediaIdentifier + '.html');
            MovieNightAPI.ResolverCommon.get(url0, self, process).then(function (html0) {
                var postParams = MovieNightAPI.getHiddenPostParams(html0);
                var content = new MovieNightAPI.Content(self, mediaIdentifier);
                content.title = postParams.fname;
                postParams['method_free'] = 'Continue to watch your Video';
                MovieNightAPI.ResolverCommon.formPost(url0, postParams, self, process).then(function (html) {
                    var fn = RegExp.curryExecute(html);
                    content.streams = [new MovieNightAPI.UrlStream(fn(/file[\s]*?:[\s]*?["'](.+?)["']/))];
                    content.snapshotImageUrl = fn(/image\s*?:\s*?["'](.+?)["']/);
                    var durationStr = fn(/duration\s*?:\s*?["'](.+?)["']/);
                    content.duration = durationStr ? +durationStr : null;
                    MovieNightAPI.finishedWithContent(content, self, process);
                });
            });
        };
        Filehoot_com.prototype.recognizesUrlMayContainContent = function (url) {
            return MovieNightAPI.extractMediaId(this, url) != null;
        };
        Filehoot_com.prototype.scrape = function (url, process) {
            MovieNightAPI.extractMediaId(this, url, process);
        };
        return Filehoot_com;
    }());
    MovieNightAPI.Filehoot_com = Filehoot_com;
})(MovieNightAPI || (MovieNightAPI = {}));
var MovieNightAPI;
(function (MovieNightAPI) {
    var Allvid_ch = (function () {
        function Allvid_ch() {
            this.domain = 'allvid.ch';
            this.name = 'Allvid.ch';
            this.needsClientRefetch = true;
            this.mediaIdExtractors = [
                function (url) { return /allvid.ch\/([a-zA-Z\d]+?)(\.html)?$/.execute(url); },
                function (url) { return /allvid.ch\/embed-([a-zA-Z\d]+?)(\.html)?$/.execute(url); },
            ];
        }
        Allvid_ch.prototype.vrot = function (s) {
            return s.replace(/[A-Za-z]/g, function (c) {
                return String.fromCharCode(c.charCodeAt(0) + (c.toUpperCase() <= "M" ? 13 : -13));
            });
        };
        Allvid_ch.prototype.resolveId = function (mediaIdentifier, process) {
            var self = this;
            var url0 = ('http://allvid.ch/' + mediaIdentifier);
            MovieNightAPI.ResolverCommon.get(url0, self, process).then(function (html0) {
                var content = new MovieNightAPI.Content(self, mediaIdentifier);
                content.title = /<h3.*?title.*?>(.*)<\/h3/.execute(html0);
                if (content.title) {
                    content.title = self.vrot(content.title);
                }
                var url = ('http://allvid.ch/embed-' + mediaIdentifier + '.html');
                MovieNightAPI.ResolverCommon.get(url, self, process).then(function (html) {
                    try {
                        var evalStr = /<script.*?>(eval[\s\S]*?)<\/script>/.execute(html);
                        var beautiful = MovieNightAPI.ResolverCommon.beautify(evalStr);
                        var sourcesStr = /sources\s*:\s*\[(.*?)\]/.execute(beautiful);
                        content.streams = /\{(.*?)\}/g.executeAll(sourcesStr).map(function (str) {
                            var stream = new MovieNightAPI.UrlStream(/file\s*:\s*["'](.+?)["']/.execute(str));
                            stream.name = /label\s*:\s*["'](.+?)["']/.execute(str);
                            return stream;
                        });
                        var durationStr = /duration\s*:\s*["'](.+?)["']/.execute(beautiful);
                        content.duration = durationStr ? +durationStr : null;
                        content.snapshotImageUrl = /image\s*:\s*["'](.+?)["']/.execute(beautiful);
                    }
                    catch (e) {
                        logError(e);
                    }
                    MovieNightAPI.finishedWithContent(content, self, process);
                });
            });
        };
        Allvid_ch.prototype.recognizesUrlMayContainContent = function (url) {
            return MovieNightAPI.extractMediaId(this, url) != null;
        };
        Allvid_ch.prototype.scrape = function (url, process) {
            MovieNightAPI.extractMediaId(this, url, process);
        };
        return Allvid_ch;
    }());
    MovieNightAPI.Allvid_ch = Allvid_ch;
})(MovieNightAPI || (MovieNightAPI = {}));
var MovieNightAPI;
(function (MovieNightAPI) {
    var Openload_co = (function () {
        function Openload_co() {
            this.domain = 'openload.co';
            this.name = 'Openload.co';
            this.needsClientRefetch = true;
            this.mediaIdExtractors = [
                function (url) { return /openload\.co\/f\/(.+?)\//.execute(url); },
                function (url) { return /openload\.co\/f\/(.+?)(\.html)?$/.execute(url); },
                function (url) { return /openload\.co\/embed\/([a-zA-Z\d]*?)(\/)?(\.html)?$/.execute(url); }
            ];
        }
        Openload_co.prototype.resolveId = function (mediaIdentifier, process) {
            var self = this;
            var url = ('http://openload.co/f/' + mediaIdentifier);
            MovieNightAPI.ResolverCommon.get(url, self, process).then(function (html) {
                var content = new MovieNightAPI.Content(self, mediaIdentifier);
                try {
                    content.title = /<title>(.+)?<\/title>/.execute(html);
                    content.snapshotImageUrl = /poster\s*?=\s*?["'](.*?)["']/.execute(html);
                    content.streams = /<script.*?>([\s\S]*?)<\/script>/g.executeAll(html)
                        .filter(function (s) { return s.length > 0; })
                        .map(MovieNightAPI.ResolverCommon.beautify)
                        .reduce(function (l, c) {
                        var stream = new MovieNightAPI.UrlStream(/window\.vr\s*=\s*["'](.+?)["']/.execute(c));
                        stream.mimeType = /window\.vt\s*=\s*["'](.*?)["']/.execute(c);
                        if (stream.isValid()) {
                            l.push(stream);
                        }
                        return l;
                    }, []);
                }
                catch (e) {
                    logError(e);
                }
                MovieNightAPI.finishedWithContent(content, self, process);
            });
        };
        Openload_co.prototype.recognizesUrlMayContainContent = function (url) {
            return MovieNightAPI.extractMediaId(this, url) != null;
        };
        Openload_co.prototype.scrape = function (url, process) {
            MovieNightAPI.extractMediaId(this, url, process);
        };
        return Openload_co;
    }());
    MovieNightAPI.Openload_co = Openload_co;
})(MovieNightAPI || (MovieNightAPI = {}));
var MovieNightAPI;
(function (MovieNightAPI) {
    var Ishared_eu = (function () {
        function Ishared_eu() {
            this.domain = 'ishared.eu';
            this.name = 'IShared.eu';
            this.needsClientRefetch = true;
            this.mediaIdExtractors = [
                function (url) { return /ishared\.eu\/video\/(.+?)(\/)?(\.html)?$/.execute(url); }
            ];
        }
        Ishared_eu.prototype.resolveId = function (mediaIdentifier, process) {
            var self = this;
            var url = ('http://ishared.eu/video/' + mediaIdentifier);
            MovieNightAPI.ResolverCommon.get(url, self, process).then(function (html) {
                var content = new MovieNightAPI.Content(self, mediaIdentifier);
                try {
                    content.title = /titlebar[\s\S]*?<h1>(.*?)<\/h1>/.execute(html);
                    var uglyStr = /<script[\s\S]+?(eval[\s\S]*?)<\/script/.execute(html);
                    var prettyString = MovieNightAPI.ResolverCommon.beautify(uglyStr);
                    var p;
                    var jwplayer = function (str) {
                        return {
                            setup: function (params) {
                                p = params;
                            }
                        };
                    };
                    eval(prettyString);
                    content.streams = p.playlist[0].sources.map(function (source) {
                        var stream = new MovieNightAPI.UrlStream(source.file);
                        stream.name = source.label;
                        return stream;
                    });
                    content.posterImageUrl = p.playlist[0].image;
                    MovieNightAPI.finishedWithContent(content, self, process);
                }
                catch (e) {
                    logError(e);
                }
            });
        };
        Ishared_eu.prototype.recognizesUrlMayContainContent = function (url) {
            return MovieNightAPI.extractMediaId(this, url) != null;
        };
        Ishared_eu.prototype.scrape = function (url, process) {
            MovieNightAPI.extractMediaId(this, url, process);
        };
        return Ishared_eu;
    }());
    MovieNightAPI.Ishared_eu = Ishared_eu;
})(MovieNightAPI || (MovieNightAPI = {}));
var MovieNightAPI;
(function (MovieNightAPI) {
    var Flashx_tv = (function () {
        function Flashx_tv() {
            this.domain = 'flashx.tv';
            this.name = 'Flashx';
            this.needsClientRefetch = true;
            this.mediaIdExtractors = [
                function (url) { return /flashx\.tv\/embed-(.*?)(\/)?(\.html)?$/.execute(url); },
                function (url) { return /flashx\.tv\/(.*?)(\/)?(\.html)?$/.execute(url); },
                function (url) { return /flashx\.tv\/fxplay-(.*?)(\/)?(\.html)?$/.execute(url); },
                function (url) { return /flashx\.pw\/embed-(.*?)(\/)?(\.html)?$/.execute(url); },
                function (url) { return /flashx\.pw\/fxplay-(.*?)(\/)?(\.html)?$/.execute(url); },
                function (url) { return /flashx\.pw\/(.*?)(\/)?(\.html)?$/.execute(url); }
            ];
        }
        Flashx_tv.prototype.resolveId = function (mediaIdentifier, process) {
            var self = this;
            var url0 = ('http://www.flashx.pw/fxplay-' + mediaIdentifier + '.html');
            MovieNightAPI.ResolverCommon.get(url0, self, process).then(function (html0) {
                var content = new MovieNightAPI.Content(self, mediaIdentifier);
                content.title = /fdstr\s*=\s*["'](.*?)["']/.execute(html0);
                var url = "http://www.flashx.pw/fxplay-" + mediaIdentifier + ".html";
                MovieNightAPI.ResolverCommon.get(url, self, process).then(function (html) {
                    try {
                        var uglies = /<script[\s\S]*?(eval\([\s\S]+?)<\/script>/g.executeAll(html);
                        var pretties = uglies.map(MovieNightAPI.ResolverCommon.beautify);
                        pretties = pretties.filter(function (s) { return /(jwplayer)/.execute(s) != null; });
                        var jwplayerSetupStr = pretties[0];
                        if (jwplayerSetupStr == null) {
                            jwplayerSetupStr = /jwplayer.*setup([\s\S]*?)<\/script>/.execute(html);
                        }
                        content.streams = /sources\s*:\s*\[([\s\S]+?)\]/g.executeAll(jwplayerSetupStr)
                            .map(function (sourceStr) {
                            var stream = new MovieNightAPI.UrlStream(/file\s*:\s*["'](.*?)["']/.execute(sourceStr));
                            stream.name = /label\s*:\s*["'](.*?)["']/.execute(sourceStr);
                            return stream;
                        });
                        var durationStr = /duration\s*:\s*["']([0-9]+)["']/.execute(jwplayerSetupStr);
                        content.duration = durationStr ? +durationStr : null;
                        content.snapshotImageUrl = /image\s*:\s*["'](.*?)["']/.execute(jwplayerSetupStr);
                    }
                    catch (e) {
                        logError(e);
                    }
                    MovieNightAPI.finishedWithContent(content, self, process);
                });
            });
        };
        Flashx_tv.prototype.recognizesUrlMayContainContent = function (url) {
            return MovieNightAPI.extractMediaId(this, url) != null;
        };
        Flashx_tv.prototype.scrape = function (url, process) {
            MovieNightAPI.extractMediaId(this, url, process);
        };
        return Flashx_tv;
    }());
    MovieNightAPI.Flashx_tv = Flashx_tv;
})(MovieNightAPI || (MovieNightAPI = {}));
var MovieNightAPI;
(function (MovieNightAPI) {
    var Vid_ag = (function () {
        function Vid_ag() {
            this.domain = 'vid.ag';
            this.name = 'Vid';
            this.needsClientRefetch = true;
            this.mediaIdExtractors = [
                function (url) { return /vid\.ag\/(.*?)(\.html)?$/.execute(url); }
            ];
        }
        Vid_ag.prototype.resolveId = function (mediaIdentifier, process) {
            var self = this;
            var url = ('http://vid.ag/' + mediaIdentifier + '.html');
            MovieNightAPI.ResolverCommon.get(url, self, process).then(function (html) {
                var content = new MovieNightAPI.Content(self, mediaIdentifier);
                try {
                    content.title = /<h2.*?>(.*?)(\n|<\/h2>)/.execute(html);
                    var jwplayerSetup = /<script[\s\S]*?(eval\([\s\S]*?)<\/script/g.executeAll(html)
                        .map(MovieNightAPI.ResolverCommon.beautify)
                        .filter(function (s) { return /(jwplayer)/.execute(s) != null; })[0];
                    var sources = /sources\s*:\s*\[({[\s\S]*?})\]/.execute(jwplayerSetup);
                    content.snapshotImageUrl = /image\s*:\s*["'](.*?)["']/.execute(jwplayerSetup);
                    content.streams = /({.*?})/g.executeAll(sources)
                        .map(function (sourceStr) {
                        var stream = new MovieNightAPI.UrlStream(/file\s*:\s*["'](.*?)["']/.execute(sourceStr));
                        stream.name = /label\s*:\s*["'](.*?)["']/.execute(sourceStr);
                        return stream;
                    })
                        .filter(function (stream) {
                        return /(mp4)/.execute(stream.url) != null;
                    });
                }
                catch (e) {
                    logError(e);
                }
                MovieNightAPI.finishedWithContent(content, self, process);
            });
        };
        Vid_ag.prototype.recognizesUrlMayContainContent = function (url) {
            return MovieNightAPI.extractMediaId(this, url) != null;
        };
        Vid_ag.prototype.scrape = function (url, process) {
            MovieNightAPI.extractMediaId(this, url, process);
        };
        return Vid_ag;
    }());
    MovieNightAPI.Vid_ag = Vid_ag;
})(MovieNightAPI || (MovieNightAPI = {}));
var MovieNightAPI;
(function (MovieNightAPI) {
    var Streamin_to = (function () {
        function Streamin_to() {
            this.domain = 'streamin.to';
            this.name = 'Streamin.to';
            this.needsClientRefetch = true;
            this.mediaIdExtractors = [
                function (url) { return /streamin\.to\/(.*?)$/.execute(url); }
            ];
        }
        Streamin_to.prototype.resolveId = function (mediaIdentifier, process) {
            var self = this;
            var url0 = ('http://streamin.to/' + mediaIdentifier);
            MovieNightAPI.ResolverCommon.get(url0, self, process).then(function (html0) {
                var content = new MovieNightAPI.Content(self, mediaIdentifier);
                var postParams = MovieNightAPI.getHiddenPostParams(html0);
                try {
                    var cookies = /cookie\((.*?)\)/g.executeAll(html0).map(function (cookieStr) {
                        var key = /'(.*?)'\s*,/.execute(cookieStr);
                        var val = /,\s*'(.*?)'/.execute(cookieStr);
                        var obj = {
                            'key': key,
                            'value': val
                        };
                        return obj;
                    });
                    var cookiesStr = cookies.reduce(function (l, c) {
                        l += (c.key + '=' + c.value + ';');
                        return l;
                    }, '');
                    cookiesStr = cookiesStr.slice(0, cookiesStr.length - 1);
                    postParams['Cookie'] = cookiesStr;
                    content.title = postParams.fname;
                }
                catch (e) {
                    logError(e);
                }
                setTimeout(function () {
                    MovieNightAPI.ResolverCommon.formPost(url0, postParams, self, process).then(function (html) {
                        try {
                            var jwplayerSetup = /<script.*?jwplayer.*?setup([\s\S]+?)<\/script>/.execute(html);
                            content.streams = [new MovieNightAPI.RtmpStream(/streamer\s*?:\s*?['"](.*?)['"]/.execute(jwplayerSetup), /file\s*?:\s*?['"](.*?)['"]/.execute(jwplayerSetup))];
                            var durationStr = /duration\s*?:\s*?["']([0-9]*?)["']/.execute(jwplayerSetup);
                            content.duration = durationStr ? +durationStr : null;
                            content.snapshotImageUrl = /image\s*?:\s*?["'](.*?)["']/.execute(jwplayerSetup);
                        }
                        catch (e) {
                            logError(e);
                        }
                        MovieNightAPI.finishedWithContent(content, self, process);
                    });
                }, 5 * 1000);
            });
        };
        Streamin_to.prototype.recognizesUrlMayContainContent = function (url) {
            return MovieNightAPI.extractMediaId(this, url) != null;
        };
        Streamin_to.prototype.scrape = function (url, process) {
            MovieNightAPI.extractMediaId(this, url, process);
        };
        return Streamin_to;
    }());
    MovieNightAPI.Streamin_to = Streamin_to;
})(MovieNightAPI || (MovieNightAPI = {}));
var MovieNightAPI;
(function (MovieNightAPI) {
    var PromptFile_com = (function () {
        function PromptFile_com() {
            this.domain = 'promptfile.com';
            this.name = 'PromptFile';
            this.needsClientRefetch = true;
            this.mediaIdExtractors = [
                function (url) { return /promptfile\.com\/l\/(.*?)(\/)?$/.execute(url); }
            ];
        }
        PromptFile_com.prototype.resolveId = function (mediaIdentifier, process) {
            var self = this;
            var url = "http://www.promptfile.com/l/" + mediaIdentifier;
            MovieNightAPI.ResolverCommon.get(url, self, process).then(function (html0) {
                var postParams = MovieNightAPI.getHiddenPostParams(html0);
                MovieNightAPI.ResolverCommon.formPost(url, postParams, self, process).then(function (html) {
                    var fn = RegExp.curryExecute(html);
                    var content = new MovieNightAPI.Content(self, mediaIdentifier);
                    content.title = fn(/title\s*?=\s*?["'](.*?)['"]/);
                    var fileUrl = fn(/player[\s\S]*?url\s*:\s*["'](.*?)['"]/);
                    content.streams = [new MovieNightAPI.UrlStream(fileUrl)];
                    content.snapshotImageUrl = fn(/image\s*?src=["'](.*?)['"]/);
                    MovieNightAPI.finishedWithContent(content, self, process);
                });
            });
        };
        PromptFile_com.prototype.recognizesUrlMayContainContent = function (url) {
            return MovieNightAPI.extractMediaId(this, url) != null;
        };
        PromptFile_com.prototype.scrape = function (url, process) {
            MovieNightAPI.extractMediaId(this, url, process);
        };
        return PromptFile_com;
    }());
    MovieNightAPI.PromptFile_com = PromptFile_com;
})(MovieNightAPI || (MovieNightAPI = {}));
var MovieNightAPI;
(function (MovieNightAPI) {
    var Neodrive_co = (function () {
        function Neodrive_co() {
            this.domain = 'neodrive.co';
            this.name = 'Neodrive';
            this.needsClientRefetch = true;
            this.mediaIdExtractors = [
                function (url) { return /neodrive\.co\/share\/file\/([a-zA-Z\d]*?)(\/)?(\.html)?$/.execute(url); },
                function (url) { return /neodrive\.co\/embed\/([a-zA-Z\d]*?)(\/)?(\.html)?$/.execute(url); }
            ];
        }
        Neodrive_co.prototype.resolveId = function (mediaIdentifier, process) {
            var self = this;
            var url = ('http://neodrive.co/embed/' + mediaIdentifier);
            MovieNightAPI.ResolverCommon.get(url, self, process).then(function (html) {
                var fn = RegExp.curryExecute(html);
                var content = new MovieNightAPI.Content(self, mediaIdentifier);
                content.snapshotImageUrl = fn(/vthumbnail\s*=\s*["'](.*?)["']/);
                content.title = fn(/vtitle\s*=\s*["'](.*?)["']/);
                content.streams = [new MovieNightAPI.UrlStream(fn(/vurl\s*=\s*["'](.*?)["']/))];
                MovieNightAPI.finishedWithContent(content, self, process);
            });
        };
        Neodrive_co.prototype.recognizesUrlMayContainContent = function (url) {
            return MovieNightAPI.extractMediaId(this, url) != null;
        };
        Neodrive_co.prototype.scrape = function (url, process) {
            MovieNightAPI.extractMediaId(this, url, process);
        };
        return Neodrive_co;
    }());
    MovieNightAPI.Neodrive_co = Neodrive_co;
})(MovieNightAPI || (MovieNightAPI = {}));
var MovieNightAPI;
(function (MovieNightAPI) {
    var Briskfile_com = (function () {
        function Briskfile_com() {
            this.domain = 'briskfile.com';
            this.name = 'Briskfile';
            this.needsClientRefetch = true;
            this.mediaIdExtractors = [
                function (url) { return /briskfile\.com\/l\/(.*?)(\/)?(\.html)?$/.execute(url); }
            ];
        }
        Briskfile_com.prototype.resolveId = function (mediaIdentifier, process) {
            var self = this;
            var url = ('http://www.briskfile.com/l/' + mediaIdentifier);
            MovieNightAPI.ResolverCommon.get(url, self, process).then(function (html0) {
                var postParams = MovieNightAPI.getHiddenPostParams(html0);
                MovieNightAPI.ResolverCommon.formPost(url, postParams, self, process).then(function (html) {
                    var fn = RegExp.curryExecute(html);
                    var content = new MovieNightAPI.Content(self, mediaIdentifier);
                    var urlStream = new MovieNightAPI.UrlStream(fn(/url\s*:\s*["'](.*?)['"]/));
                    urlStream.mimeType = 'video/x-flv';
                    content.streams = [urlStream];
                    content.title = fn(/title\s*=\s*["'](.*?)['"]/);
                    content.snapshotImageUrl = fn(/<img src=["'](http:\/\/static\.*?)['"]/);
                    MovieNightAPI.finishedWithContent(content, self, process);
                });
            });
        };
        Briskfile_com.prototype.recognizesUrlMayContainContent = function (url) {
            return MovieNightAPI.extractMediaId(this, url) != null;
        };
        Briskfile_com.prototype.scrape = function (url, process) {
            MovieNightAPI.extractMediaId(this, url, process);
        };
        return Briskfile_com;
    }());
    MovieNightAPI.Briskfile_com = Briskfile_com;
})(MovieNightAPI || (MovieNightAPI = {}));
var MovieNightAPI;
(function (MovieNightAPI) {
    var Vidup_me = (function () {
        function Vidup_me() {
            this.domain = 'vidup.me';
            this.name = 'Vidup';
            this.needsClientRefetch = true;
            this.mediaIdExtractors = [
                function (url) { return /vidup\.me\/embed-([a-zA-Z\d]*?)-/.execute(url); },
                function (url) { return /vidup\.me\/([a-zA-Z\d]*?)(\/)?(\.html)?$/.execute(url); }
            ];
        }
        Vidup_me.prototype.resolveId = function (mediaIdentifier, process) {
            var self = this;
            var url = ("http://beta.vidup.me/embed-" + mediaIdentifier + "-640x360.html");
            MovieNightAPI.ResolverCommon.get(url, self, process).then(function (html) {
                var content = new MovieNightAPI.Content(self, mediaIdentifier);
                try {
                    var beautify = MovieNightAPI.ResolverCommon.beautify(/<script.*?(eval[\s\S]*?)<\/script>/.execute(html));
                    content.snapshotImageUrl = /image\s*:\s*["'](.*?)['"]/.execute(beautify);
                    content.title = /title\s*:\s*["'](.*?)['"]/.execute(beautify);
                    var sources = /sources\s*?:\s*?\[([\s\S]*?)\]/.execute(beautify);
                    content.streams = /\{([\s\S]*?)\}/g.executeAll(sources).map(function (srcStr) {
                        var stream = new MovieNightAPI.UrlStream(/file\s*:\s*["'](.*?)['"]/.execute(srcStr));
                        stream.name = /label\s*:\s*["'](.*?)['"]/.execute(srcStr);
                        stream.mimeType = "application/octet-stream";
                        return stream;
                    });
                }
                catch (e) {
                    logError(e);
                }
                MovieNightAPI.finishedWithContent(content, self, process);
            });
        };
        Vidup_me.prototype.recognizesUrlMayContainContent = function (url) {
            return MovieNightAPI.extractMediaId(this, url) != null;
        };
        Vidup_me.prototype.scrape = function (url, process) {
            MovieNightAPI.extractMediaId(this, url, process);
        };
        return Vidup_me;
    }());
    MovieNightAPI.Vidup_me = Vidup_me;
})(MovieNightAPI || (MovieNightAPI = {}));
var MovieNightAPI;
(function (MovieNightAPI) {
    function resolvers() {
        var resolvers = [
            new MovieNightAPI.Vodlocker_com(), new MovieNightAPI.Allmyvideos_net(),
            new MovieNightAPI.Gorillavid_in(), new MovieNightAPI.Exashare_com(),
            new MovieNightAPI.Vidlockers_ag(), new MovieNightAPI.Bakavideo_tv(),
            new MovieNightAPI.Powvideo_net(), new MovieNightAPI.Bestreams_net(),
            new MovieNightAPI.Thevideo_me(), new MovieNightAPI.Mycollection_net(),
            new MovieNightAPI.Filehoot_com(), new MovieNightAPI.Allvid_ch(),
            new MovieNightAPI.Openload_co(), new MovieNightAPI.Ishared_eu(),
            new MovieNightAPI.Flashx_tv(), new MovieNightAPI.Vid_ag(),
            new MovieNightAPI.Streamin_to(), new MovieNightAPI.PromptFile_com(),
            new MovieNightAPI.Briskfile_com(), new MovieNightAPI.Vidup_me()
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
var colors = require('colors');
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
    }
];
var requiredCommandLineConfigs = [
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
    if (!options.verbose) {
        console.debug = function (message) {
            var optionalParams = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                optionalParams[_i - 1] = arguments[_i];
            }
        };
    }
    else {
        console.debug = console.log;
    }
    if (options.scrape) {
        var resultsCount = 0;
        var usedUids = [];
        var head = new MovieNightAPI.ProcessNode(function (results, process) {
            results.forEach(function (result) {
                if (result.type == MovieNightAPI.ResultType.Content && usedUids[result.content.uid] == undefined) {
                    usedUids[result.content.uid] = true;
                    resultsCount++;
                    console.log((resultsCount + ') ' + result.content.title + '\t|\t' + result.content.mediaOwnerName + '\t|\t' + result.content.mediaIdentifier).green.bold);
                    console.debug(JSON.stringify(result.content, null, 4).blue + '');
                }
                else {
                }
            });
            if (process.finished) {
                console.log("finished: with ".blue, resultsCount);
            }
        });
        MovieNightAPI.scrape(options.scrape, head);
    }
    else if (options.phantom) {
        console.log('what is this: ');
        console.log(require('phantomjs'));
    }
    else {
        console.log(JSON.stringify(options, null, 4).white);
        console.warn("No command was run.  Use --help for usage.".red.bold);
    }
}
function logError(error) {
    console.log(error.message.bold.red, error.name.underline.bold.red);
}
var log;
(function () {
    var method;
    var noop = function () { };
    var methods = [
        'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
        'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
        'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
        'timeStamp', 'trace', 'warn'
    ];
    var length = methods.length;
    var console = {};
    while (length--) {
        method = methods[length];
        if (!console[method]) {
            console[method] = noop;
        }
    }
    if (Function.prototype.bind) {
        log = Function.prototype.bind.call(console.log, console);
    }
    else {
        log = function () {
            Function.prototype.apply.call(console.log, console, arguments);
        };
    }
})();
var a = { b: 1 };
var d = "test";
log(a, d);
log("hello world");
//# sourceMappingURL=Scraper.js.map