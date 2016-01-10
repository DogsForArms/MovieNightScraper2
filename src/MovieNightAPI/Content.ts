module MovieNightAPI 
{

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
		'iNTERNAL', 'BDRip']
	export function niceFilter(rawTitle: string) 
	{
		if (!rawTitle) { return null; }
		//delimit by . space - _ 
		var components = rawTitle.split(/[\.\s,\-\_]+/)


		var scoresAndComponents = components.map(function(component) {
			var value = (removeThese.indexOf(component) === -1) ? true : false
			return { 'component': component, 'keep': value }
		})


		var coloredComponentsString = components.map(function(component) {
			var remove = (removeThese.indexOf(component) != -1)
			if (remove) {
				return component.red
			}
			else {
				return component.green
			}
		}).join(' ')

		console.log(coloredComponentsString)

		var done = false
		var chopEnd = scoresAndComponents.reduce(function(l, c, i) {

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

	export interface LabeledStreams 
	{
		quality: string
		streamUrl: string
	}

	export class Content {
		title: string;
		snapshotImageUrl: string;
		posterImageUrl: string;
		duration: number;
		streamUrl: string;
		streamUrls: LabeledStreams[]
		// mediaIdentifier: string;
		mimeType: string;
		uid: string;

		needsClientRefetch: boolean;
		domain: string;
		mediaOwnerName: string;

		constructor(mediaOwner: MediaOwnerInfo, public mediaIdentifier: string)
		{
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
		if (!contentIsValid(content)) 
		{
			var message = "Resolver " + mediaOwnerInfo.name + " cannot make Content with insufficient data." + JSON.stringify(content)
			var error = new ResolverError(ResolverErrorCode.InsufficientData, message, mediaOwnerInfo)

			process.processOne({ type: ResultType.Error, error: error })
		}
		else 
		{
			var reportInvalidMimeType = function()
			{
				var message = "Mime type " + content.mimeType + " is not supported."
				var error = new ResolverError(ResolverErrorCode.InvalidMimeType, message, mediaOwnerInfo)
				process.processOne({ type: ResultType.Error, error: error })
			}

			if (!content.mimeType) 
			{
				var videoUrl = content.streamUrl || content.streamUrls[0].streamUrl
				ResolverCommon.getMimeType(videoUrl, mediaOwnerInfo, process).then(function(mimeType) 
				{
					if (!mimeTypeIsValid(mimeType)) 
					{
						reportInvalidMimeType()
					}
					else 
					{
						process.processOne({ type: ResultType.Content, content: content })
					}
				})
			} else 
			if (!mimeTypeIsValid(content.mimeType))
			{
				reportInvalidMimeType()
			} 
			else
			{
				process.processOne({ type: ResultType.Content, content: content })
			}
		}
	}
	function contentIsValid(content: Content): boolean {
		var streamUrls: LabeledStreams[] = content.streamUrls
		var hasValidStreamUrls = (streamUrls && streamUrls.every(function(value) {
			return (value.quality != null &&
				value.quality != undefined &&
				value.streamUrl != null &&
				value.streamUrl != undefined)
		}))

		return content.streamUrl != null && content.streamUrl != undefined || hasValidStreamUrls
	}
	
}