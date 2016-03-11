module MovieNightAPI {

    // Mark - Stream
    export enum StreamType {
        Url,
        Rtmp
    }
    export interface Stream {
        name?: string
        type: StreamType
        mimeType: string
        isValid(): boolean
    }
    export class UrlStream implements Stream {
        type = StreamType.Url
        mimeType: string
        name: string

        constructor(public url: string) { }

        isValid(): boolean {
            return (this.url != null)
        }
    }
    export class RtmpStream implements Stream {
        type = StreamType.Rtmp
        mimeType: string
        name: string

        constructor(public server: string, public file: string) { }

        isValid(): boolean {
            return (this.server != null && this.file != null)
        }
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
        'MiTED', 'xvid', 'webrip', 'XVID', '1080p', 'DD5', 'TSV',
        'iNTERNAL', 'BDRip', 'bdrip', 'Iwatchonline']
    export function niceFilter(rawTitle: string) {
        if (!rawTitle) { return null; }

        var components = rawTitle.split(/[\.\s,\-\_+]+/)

        var scoresAndComponents = components.map(function(component) {
            var value = (removeThese.indexOf(component) === -1) ? true : false
            return { 'component': component, 'keep': value }
        })


        // var coloredComponentsString = components.map(function(component) {
        // 	var remove = (removeThese.indexOf(component) != -1)
        // 	if (remove) {
        // 		return component.red
        // 	}
        // 	else {
        // 		return component.green
        // 	}
        // }).join(' ')
        //
        // console.log(coloredComponentsString)

        var done = false
        var chopEnd = scoresAndComponents
            .filter(function(s) { return s.component.length > 0 })
            .reduce(function(l, c, i) {

                if (done || !c.keep) {
                    done = true
                } else {
                    l.push(c)
                }
                return l
            }, []).map(function(obj) { return obj.component })
        var newValue = chopEnd.join(' ')

        var oldValue = components.filter(function(phrase) {
            return (removeThese.indexOf(phrase) === -1)
        }).join(' ')

        if (chopEnd.length > 0) {
            return newValue
        }
        return oldValue
    }

    export interface LabeledStream {
        quality: string
        stream: Stream
    }

    export class Content {
        title: string;
        snapshotImageUrl: string;
        posterImageUrl: string;
        duration: number;
        streams: Stream[]
        uid: string;

        needsClientRefetch: boolean;
        domain: string;
        mediaOwnerName: string;

        constructor(mediaOwner: MediaOwnerInfo, public mediaIdentifier: string) {
            this.title = "untitled"
            this.needsClientRefetch = mediaOwner.needsClientRefetch
            this.domain = mediaOwner.domain
            this.mediaOwnerName = mediaOwner.name
        }
    }

    export function mimeTypeIsValid(mimeType: string): boolean {
        return (["video/mp4", "video/webm", "video/ogg", "video/youtube",
            "audio/mpeg", "video/twitch", "video/x-flv", "application/octet-stream",
            "rtmp"].filter(function(v) { return v == mimeType }).length == 1)
    }


    export function finishedWithContent(content: Content, mediaOwnerInfo: MediaOwnerInfo, process: ProcessNode) {
        content.uid = (mediaOwnerInfo.domain.replace(".", "_") + "|" + content.mediaIdentifier)
        content.title = niceFilter(content.title)

        if (!contentIsValid(content)) {
            var message = "Resolver " + mediaOwnerInfo.name + " cannot make Content with insufficient data." + JSON.stringify(content)
            var error = new ResolverError(ResolverErrorCode.InsufficientData, message, mediaOwnerInfo)

            process.processOne({ type: ResultType.Error, error: error })
        }
        else {
            var reportInvalidMimeType = function(mimeType: string) {
                var message = "Mime type " + mimeType + " is not supported."
                var error = new ResolverError(ResolverErrorCode.InvalidMimeType, message, mediaOwnerInfo)
                process.processOne({ type: ResultType.Error, error: error })
            }

            var stream = content.streams[0]
            if (stream.type == StreamType.Url && !stream.mimeType) {
                var urlStream: UrlStream = <UrlStream>stream

                var videoUrl = urlStream.url
                ResolverCommon.getMimeType(videoUrl, mediaOwnerInfo, process).then(function(mimeType) {
                    content.streams.forEach(function(someStream) {
                        someStream.mimeType = mimeType
                    })
                    if (!mimeTypeIsValid(mimeType)) {
                        reportInvalidMimeType(mimeType)
                    }
                    else {
                        process.processOne({ type: ResultType.Content, content: content })
                    }
                })
            } else
                if (stream.type == StreamType.Url && !mimeTypeIsValid(content.streams[0].mimeType)) {
                    reportInvalidMimeType(content.streams[0].mimeType)
                }
                else {
                    process.processOne({ type: ResultType.Content, content: content })
                }
        }
    }
    function contentIsValid(content: Content): boolean {
        // console.log("CONTENT: " + JSON.stringify(content, null, 4))
        var streams: Stream[] = content.streams
        content.streams = streams ? streams.filter(function(stream) {
            return stream.isValid()
        }) : []
        return content.streams.length > 0
    }

}
