import {Resolver} from '../Resolver'
import {ProcessNode} from '../ProcessNode'
import {ResolverCommon, extractMediaId} from '../ResolverCommon'
import {finishedWithContent, Content, UrlStream} from '../Content'

// var Base64 = require('../../node_modules/js-base64/base64.js').Base64;
var Base64 = require('js-base64')

export class Bakavideo_tv implements Resolver<string>
{
	domain = "Bakavideo.tv"
	name = "BakavideoTv"
	needsClientRefetch = true

	recognizesUrlMayContainContent(url: string): boolean
	{
		return extractMediaId(this, url) != undefined
	}

	mediaIdExtractors = [
		function(url: string) { return /bakavideo\.tv\/embed\/([a-zA-Z\d]+?)$/.execute(url) }
	]
	resolveId(mediaIdentifier: string, process: ProcessNode)
	{
		console.log("MEDIA ID: " + mediaIdentifier)
		var self = this
		var url = ('https://bakavideo.tv/get/files.embed?f=' + mediaIdentifier)
		ResolverCommon.get(url, self, process).then(function(jsonStr){

			try {
				var json = JSON.parse(jsonStr)
				var html = Base64.decode(json.content)

				var content = new Content(self, mediaIdentifier)
				content.streams = /<source(.*?)>/g.executeAll(html)
					.map(function(component) {
						var stream = new UrlStream(/src="(.*?)"/.execute(component))
						stream.name = /data-res="(.*?)"/.execute(component)
						return stream
					})
			} catch (e) { logError(e) }

			finishedWithContent(content, self, process)

		})

	}

	scrape(url: string, process: ProcessNode)
	{
		extractMediaId(this, url, process)
	}

}
