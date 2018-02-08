import {Resolver} from '../Resolver'
import {ProcessNode} from '../ProcessNode'
import {ResolverCommon, extractMediaId} from '../ResolverCommon'
import {Content, finishedWithContent, UrlStream} from '../Content'

export class Twitch_tv implements Resolver<string>
{
    domain = 'twitch.tv'
    name = 'Twitch'
    needsClientRefetch = false

    mediaIdExtractors: ((url: string) => (string))[] = [
        function(url: string) { return /twitch\.tv\/([^\/]*)/.execute(url) }
    ]

    resolveId(mediaIdentifier: string, process: ProcessNode) {
        var self = this

        var url = ('https://api.twitch.tv/kraken/streams/' + mediaIdentifier)
        ApiKeyLoader.service('TWITCH', function(secret: string) {
            var opts = {
                method: 'GET',
                headers: { 'Client-ID': secret }
            }
            ResolverCommon.makeRequest(url, opts, self, process).then(function(channelData: string) {
                var content = new Content(self, mediaIdentifier)
                try {
                    var data = JSON.parse(channelData)
                    if (data.error) {

                    }
                    else {
                        var preview = (data && data.stream && data.stream.preview) ? data.stream.preview : null
                        var name = (data && data.stream && data.stream.channel && data.stream.channel.display_name) ? data.stream.channel.display_name : null
                        var title = (data && data.stream && data.stream.channel && data.stream.channel.status) ? data.stream.channel.status : null
                        name = name ? name : mediaIdentifier
                        title = title ? title : ((name ? name : 'unknown') + ' - untitled')
                        var mediumUrl = preview.medium
                        var streamUrl = 'http://twitch.tv/' + mediaIdentifier

                        content.title = title
                        content.snapshotImageUrl = mediumUrl
                        // content.isLive = true

                        var stream = new UrlStream(streamUrl)
                        stream.mimeType = 'video/twitch'

                        content.streams = [stream]
                    }
                } catch (e) { logError(e) }
                finishedWithContent(content, self, process)
            })
        })
    }

    recognizesUrlMayContainContent(url: string): boolean {
        return extractMediaId(this, url) != null
    }

    scrape(url: string, process: ProcessNode) {
        extractMediaId(this, url, process)
    }
}
