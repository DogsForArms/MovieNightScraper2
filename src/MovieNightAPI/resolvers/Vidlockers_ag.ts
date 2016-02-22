///<reference path="../../../vendor/es6-promise.d.ts" />
///<reference path="../../../vendor/colors.d.ts" />
///<reference path="../../Tools/RegExp.ts" />
///<reference path="../Resolver.ts" />
///<reference path="../ResolverCommon.ts" />
///<reference path="../ProcessNode.ts" />
///<reference path="../Content.ts" />

module MovieNightAPI {
    export class Vidlockers_ag implements Resolver<string>
    {
        domain = "vidlockers.ag"
        name = "Vidlockers.ag"
        needsClientRefetch = true

        recognizesUrlMayContainContent(url: string): boolean {
            return extractMediaId(this, url) != undefined
        }

        //http://www.vidlockers.ag/enk0bo47mcc5/the.walking.dead.s01e04.hdtv.xvid-fever.avi.html
        resolveId(mediaIdentifier: string, process: ProcessNode) {
            var self = this
            var url0 = ('http://vidlockers.ag/' + mediaIdentifier + '.html')
            ResolverCommon.get(url0, self, process).then(function(html0) {

                var postParams = getHiddenPostParams(html0)
                ResolverCommon.formPost(url0, postParams, self, process).then(function(html) {

                    var content = new Content(self, mediaIdentifier)
                    try {

                        var evalScript = /player_code.*?<script.*?>(eval\([\s\S]*?)<\/script>/.execute(html)
                        var beautiful = ResolverCommon.beautify(evalScript)

                        var fn = RegExp.curryExecute(beautiful)

                        content.snapshotImageUrl = fn(/image:.*["'](.+?)["']/)
                        var stream = new UrlStream(fn(/src.*?=.*?["'](.*?)["']/))
                        content.streams = [stream]
                        // console.log(stream.url.blue)

                        var durationStr = fn(/duration:.*["']([0-9]+?)["']/)
                        content.duration = durationStr ? +durationStr : null

                        var urlComponents = stream.url.split('/')
                        content.title = urlComponents[urlComponents.length - 1]
                    } catch (e) { logError(e) }
                    finishedWithContent(content, self, process)

                })

            })
        }

        mediaIdExtractors = [
            function(url: string) { return /vidlockers\.ag\/([a-zA-Z\d]+)?(\/.*)?(\.html)?$/.execute(url) }
        ]
        scrape(url: string, process: ProcessNode) {
            extractMediaId(this, url, process)
        }


    }
}
