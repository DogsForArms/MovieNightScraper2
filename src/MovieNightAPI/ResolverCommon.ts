///<reference path="../../vendor/es6-promise.d.ts" />
///<reference path="../../vendor/request.d.ts" />
///<reference path="../../vendor/node.d.ts" />
///<reference path="./Resolver.ts" />

var Request = require('request')

module MovieNightAPI {
    //network stuff
    export module ResolverCommon {

        export function beautify(ugly: string) {
            var Unpack = require('../src/Tools/Unpacker/unpack.js')
            return Unpack.unpack(ugly)
        }

        export function getAll(url: string, mediaOwnerInfo: MediaOwnerInfo, process: ProcessNode): Promise<string> {
            return request({ 'method': 'GET', 'url': url }, mediaOwnerInfo, process, true)
        }

        export function get(url: string, mediaOwnerInfo: MediaOwnerInfo, process: ProcessNode): Promise<string> {
            return request({ 'method': 'GET', 'url': url }, mediaOwnerInfo, process)
        }
        export function formPost(url: string, postParams: any, mediaOwnerInfo: MediaOwnerInfo, process: ProcessNode): Promise<string> {
            return request({ 'method': 'POST', 'url': url, 'formData': postParams }, mediaOwnerInfo, process)
        }
        export function getMimeType(url: string, mediaOwnerInfo: MediaOwnerInfo, process: ProcessNode): Promise<string> {
            return request({ 'method': 'HEAD', 'url': url, 'timeout': 20 * 1000 }, mediaOwnerInfo, process)
        }
        export function request(options: any, mediaOwnerInfo: MediaOwnerInfo, process: ProcessNode, getAll?: boolean): Promise<string> {

            var q = new Promise<string>(function(resolve, reject) {
                var self = this

                var retryRequest = function(error: any, options: any) {
                    var retryOnErrorCodes = ['ECONNRESET', 'ETIMEDOUT']
                    return (options.maxAttempts > 0 && (retryOnErrorCodes.indexOf(error.code) != -1))
                }
                //set retry parameters
                options.maxAttempts = 0
                options.retryDelay = 800 + Math.random() * 1000

                var makeRequest = function(options: any) {
                    Request(options, function(error: any, response: any, data: any) {
                        if (error) {
                            if (retryRequest(error, options)) {
                                //decrement & reset retry parameters
                                setTimeout(function() {
                                    options.maxAttempts = options.maxAttempts - 1
                                    // console.log(("RETRYING " + options.maxAttempts + ' - ' + options.url).inverse.dim)
                                    options.retryDelay = 300 + Math.random() * 1000

                                    makeRequest(options)
                                }, options.retryDelay)


                            } else {
                                console.debug("<<<")
                                console.debug("REQUEST ERROR".red.bold.underline)
                                console.debug(error)
                                console.debug(JSON.stringify(options, null, 4))
                                console.debug(">>>")

                                // var internetError = new ResolverState(-4, self, { 'error': error, 'url': options.url })
                                var failure = new ResolverError(ResolverErrorCode.InternetFailure, "The internet failed when looking up url <" + options.url + ">", mediaOwnerInfo)
                                reject(failure)
                            }

                        } else {
                            if (getAll) {
                                resolve(response)
                            }
                            else {
                                resolve((options.method == 'HEAD') ? response.headers['content-type'] : data)
                            }
                        }
                    })
                }
                makeRequest(options)
            })
            q.catch(function(failure: ResolverError) {
                console.debug("network error failed".red)

                process.processOne({ type: ResultType.Error, error: failure })
            })
            return q
        }


        export function raiseFileNotFoundError(res: Resolver<string>, url: string, process: ProcessNode) {
            var message = ("Sorry, the file no longer exists on " + res.domain + " at " + url)
            process.processOne(
                {
                    type: ResultType.Error,
                    error: new ResolverError(ResolverErrorCode.FileRemoved, message, res)
                })

        }

    }

    export function extractMediaId(res: Resolver<string>, url: string, process?: ProcessNode): string {
        var matches = res.mediaIdExtractors
            .map(function(f) { return f(url) })
            .filter(function(str) { return str != null })

        var mediaIdentifier = matches[0]
        if (process) {
            if (!mediaIdentifier) {
                var error = new ResolverError(
                    ResolverErrorCode.InsufficientData,
                    ("Could not get a MediaId from the url " + url),
                    this)
                process.processOne({ type: ResultType.Error, error: error })
            }
            else {
                res.resolveId(mediaIdentifier, process)
            }
        }
        // console.log(url)
        // console.log(res.mediaIdExtractors)
        // console.log("mediaIdentifier: " + mediaIdentifier)
        return mediaIdentifier
    }


    export function getHiddenPostParams(html: string): any {
        var hiddenReg = /input type="hidden" name="(.+)" value="(.+)"/g
        return hiddenReg.execAll(html).reduce(function(p: any, c: RegExpExecArray) {
            p[c[1]] = c[2]
            return p
        }, {})
    }



}
