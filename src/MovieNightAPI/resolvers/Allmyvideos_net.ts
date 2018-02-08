import {Resolver, ResolverErrorCode, ResolverError, ResultType} from '../Resolver'
import {ResolverCommon, getHiddenPostParams, extractMediaId} from '../ResolverCommon'
import {ProcessNode} from '../ProcessNode'
import {Content, LabeledStream, UrlStream, finishedWithContent} from '../Content'

export class Allmyvideos_net implements Resolver<string>
{
    domain = 'allmyvideos.net'
    name = 'AllMyVideos.net'
    needsClientRefetch = true

    recognizesUrlMayContainContent(url: string): boolean {
        return extractMediaId(this, url) != undefined
    }

    resolveId(mediaIdentifier: string, process: ProcessNode) {
        var self = this
        var url0 = ('http://allmyvideos.net/v/' + mediaIdentifier)

        ResolverCommon.get(url0, self, process).then(function(html0) {

            // var otherId = /http:\/\/allmyvideos.net\/builtin-(.+?)["'$]/.execute(html0)
            var url = "http://allmyvideos.net/" + mediaIdentifier
            // console.log("hey")
            // console.log(url.blue)
            var f = false
            if (f) //otherId == null) {
            {
                console.log("OIH... ok ")
                var err = new ResolverError(ResolverErrorCode.InsufficientData, ("Unable to find " + self.domain + " video."), self)
                process.processOne({ type: ResultType.Error, error: err })
            }
            else {
                ResolverCommon.get(url, self, process).then(function(html) {
                    // console.log("LOOKING FOR A ALLMYVID".red)
                    var postParams = getHiddenPostParams(html)
                    // console.log(JSON.stringify(postParams, null, 4).italic)
                    ResolverCommon.formPost(url, postParams, self, process).then(function(html) {
                        // console.log(html.bgCyan)
                        var fn = RegExp.curryExecute(html)
                        var content = new Content(self, mediaIdentifier)
                        content.title = fn(/&filename=([^']*)/)
                        content.snapshotImageUrl = fn(/"image"\s*:\s*"(.+)"/)

                        var durationStr = fn(/"duration"\s*:\s*"([0-9]+)"/)
                        content.duration = durationStr ? +durationStr : null

                        var srcsStr: string = fn(/"sources"\s*:\s*(\[[^\]]*)/) + ']'
                        var srcs: any[]

                        try {
                            srcs = JSON.parse(srcsStr)
                            var labeledStreams: LabeledStream[] = []

                            content.streams = srcs.map(function(srcJson) {
                                var stream = new UrlStream(srcJson.file)
                                stream.name = srcJson.label
                                return stream
                            })
                            // content.streamUrls =srcs.forEach(function(srcJson) {
                            // 	labeledStreams.push({'quality': srcJson.label, 'streamUrl': srcJson.file})
                            // })
                            // content.streamUrls = labeledStreams
                        }
                        catch (e) { logError(e) }

                        finishedWithContent(content, self, process)
                    })


                })
            }

        })
    }


    mediaIdExtractors = [
        function(url: string) { console.debug(/helloreg/); return /allmyvideos\.net\/v\/(.*)/.execute(url) },
        function(url: string) { return /allmyvideos\.net\/embed-(.*?)-/.execute(url) },
        function(url: string) { return /allmyvideos\.net\/([a-zA-Z\d]*?)(\/)?(\.html)?$/.execute(url) }
        // /allmyvideos\.net\/(.*)/
    ]

    scrape(url: string, process: ProcessNode) {
        extractMediaId(this, url, process)
    }

}
