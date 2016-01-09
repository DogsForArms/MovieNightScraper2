///<reference path="../../vendor/es6-promise.d.ts" />
///<reference path="../../vendor/request.d.ts" />
///<reference path="../../vendor/node.d.ts" />

var Request = require('request')

module MovieNightAPI
{

	var count = 0;
	export function UID(): number
	{
		return count++
	}

	export interface LabeledStreams
	{
		quality: string
		streamUrl: string
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
		'iNTERNAL', 'BDRip']
	export function niceFilter(rawTitle: string) {
		if (!rawTitle) { return null; }
		//delimit by . space - _ 
		var components = rawTitle.split(/[\.\s,\-\_]+/)


		var scoresAndComponents = components.map(function(component) {
			var value = (removeThese.indexOf(component) === -1) ? true : false
			return { 'component': component, 'keep': value }
		})


		var coloredComponentsString = components.map(function(component) {
			var remove = (removeThese.indexOf(component) != -1)
			if (remove)
			{
				return component.red
			}
			else
			{
				return component.green
			}
		}).join(' ')

		// console.log("\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t".blue.underline.bold.inverse)
		// console.log(scoresAndComponents.map(function(obj){ return obj.keep ? 1 : 0}))
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

		// console.log('newValue: '.inverse.dim + ' ' + newValue)
		// console.log('oldValue: '.inverse.dim + ' ' + oldValue)
		// console.log("\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t".blue.underline.bold.inverse)

	
		if (chopEnd.length > 0) {
			return newValue
		}
		return oldValue
	}

	export class Content
	{
		title: string;
		image: string;
		duration: number;
		streamUrl: string;
		streamUrls: LabeledStreams[]
		mediaIdentifier: string;
		needsClientIp: boolean;
		mimeType: string;
		uid: string;
		domain: string;
		resolverName: string;



		constructor( obj, res: Resolver<any>)
		{
			this.title = niceFilter( obj.title ? obj.title : "untitled" )
			this.image = obj.image
			this.duration = obj.duration
			this.streamUrl = obj.streamUrl
			this.streamUrls = obj.streamUrls
			this.mediaIdentifier = obj.mediaIdentifier
			this.needsClientIp = obj.needsClientIp
			this.mimeType = obj.mimeType
			this.uid = obj.uid ? obj.uid : (obj.mediaIdentifier + ":" + res.name) 
			this.domain = res.domain
			this.resolverName = res.name
		}
	}

	function objectCouldCreateContent(obj): boolean
	{
		var streamUrls: LabeledStreams[] = obj.streamUrls
		return obj.streamUrl || 
			(streamUrls && streamUrls.every(function(value) { return (value.quality != null && value.quality != undefined && value.streamUrl != null && value.streamUrl != undefined) }))
	}


	export enum ResolverErrorCode
	{
		InternetFailure, 
		InsufficientData,
		UnexpectedLogic,
		InvalidMimeType
	}
	export class ResolverError
	{
		code: ResolverErrorCode;
		description: string;

		taskName: string;

		constructor(code: ResolverErrorCode, description: string, resolver: Resolver<any>) {
			this.code = code
			this.description = description
			this.taskName = resolver.name
		}
	}


	export enum ResultType
	{
		Error, Content, Contents
	}
	export interface Result
	{
		type: ResultType
		content?: Content
		contents?: Content[]
		error?: ResolverError
	}
	
	export interface ResultUpdateBlock{ 
		(results: MovieNightAPI.Result[], isFinished: boolean)
	}
	export interface Resolver<TMediaId>{
		domain: string 
		name: string
		needsClientFetch: boolean

		taskManager: TaskManager;

		updateBlock: ResultUpdateBlock
		recognizesUrlMayContainContent( url: string ): boolean
		resolveId( mediaIdentifier: TMediaId )
		scrape( url: string )

	}


	export class Task
	{
		constructor(public taskId: number, public remove:() => boolean){}
	}
	export class TaskManager
	{
		tasks = {}
		registerTask(): Task {
			var id = UID()
			var self = this
			var task = new Task(id, function() { return self.unregisterTask(id) })
			self.tasks[id] = task
			return task
		}
		unregisterTask(taskId: number): boolean {
			var self = this
			if (!self.tasks[taskId])
			{
				throw new Error("Cannot unregistering task unknown task '" + taskId + "'.")
			}
			delete self.tasks[taskId]
			return Object.keys(self.tasks).length == 0
		}
	}

	//network stuff
	export module ResolverCommon 
	{
		export function get(url: string, res: Resolver < any >, task:Task): Promise < string > {
			return request({ 'method': 'GET', 'url': url }, res, task)
		}
		export function headOnly(url: string, res: Resolver < any >, task: Task): Promise < string > {
			return request({ 'method': 'HEAD', 'url': url}, res, task)
		}
		export function request(options, res: Resolver< any >, task: Task): Promise<string> {
			
			var q = new Promise<string>(function(resolve, reject) {
				var self = this

				var retryRequest = function(error, options) {
					var retryOnErrorCodes = ['ECONNRESET']
					return (options.maxAttempts > 0 && (retryOnErrorCodes.indexOf(error.code) != -1))
				}
				//set retry parameters
				options.maxAttempts = 15
				options.retryDelay = 300 + Math.random() * 7000

				var makeRequest = function(options) {
					Request(options, function(error, response, data) {
						if (error) {
							if (retryRequest(error, options)) {
								//decrement & reset retry parameters
								setTimeout(function() {
									options.maxAttempts = options.maxAttempts - 1
									console.log(("RETRYING " + options.maxAttempts + ' - ' + options.url).inverse.dim)
									options.retryDelay = 300 + Math.random() * 7000

									makeRequest(options)
								}, options.retryDelay)


							} else {
								console.log("REQUEST ERROR".red.bold.underline)
								console.log(error)
								
								// var internetError = new ResolverState(-4, self, { 'error': error, 'url': options.url })
								var failure = new ResolverError(ResolverErrorCode.InternetFailure, "The internet failed when looking up url <" + options.url + ">", this)
								reject(failure)
							}

						} else {
							resolve((options.method == 'HEAD') ? response.headers : data)
						}
					})
				}
				makeRequest(options)
			})
			q.catch(function(failure: ResolverError) {
				console.log("network error failed".red)

				res.updateBlock([{ type: ResultType.Error, error: failure }], task.remove())
			})
			return q
		}

		export function createContent(obj, res: Resolver< any >, task: Task)
		{
			
			if (!objectCouldCreateContent(obj)) {
				var message = "Resolver " + res.name + " cannot make Content with insufficient data." + JSON.stringify(obj)
				var error = new ResolverError(ResolverErrorCode.InsufficientData, message, res)

				res.updateBlock([{ type: ResultType.Error, error: error }], task.remove())
			}
			else {
				var content = new Content(obj, res)
				if (!content.mimeType) {
					var videoUrl = content.streamUrl || content.streamUrls[0].streamUrl
					headOnly(videoUrl, res, task).then(function(json){
						var mimeType = json['content-type']
						if (!mimeTypeIsValid(mimeType))
						{
							var message = "Mime type " + mimeType + " is not supported."
							var error = new ResolverError(ResolverErrorCode.InvalidMimeType, message, res)
							res.updateBlock([{ type: ResultType.Error, error: error }], task.remove())
						} 
						else
						{
							res.updateBlock([{ type: ResultType.Content, content: content }], task.remove())
						}
					})
				} else {
					res.updateBlock([{ type: ResultType.Content, content: content }], task.remove())
				}
			}
		}

		export function mimeTypeIsValid( mimeType: string ): boolean
		{
			return (["video/mp4", "video/webm", "video/ogg", "video/youtube",
					"audio/mpeg", "video/twitch", "video/x-flv", "application/octet-stream",
					"rtmp"].filter(function(v) { return v == mimeType }).length == 1)
		}

	}

	


}