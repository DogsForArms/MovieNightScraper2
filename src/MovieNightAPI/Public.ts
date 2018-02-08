import {ProcessNode} from './ProcessNode'
import {Resolver, ResolverError, ResolverErrorCode, ResultType} from './Resolver'
import * as Resolvers from './resolvers'

export function resolvers(): Resolver<string>[] {
    
    return Object.keys(Resolvers).map(res => {
        return new (Resolvers as any)[res] 
    }) as Resolver<string>[]

    // var resolvers = [
        // new Vodlocker_com(), new Allmyvideos_net(),
        // new Gorillavid_in(), new Exashare_com(),
        // new Vidlockers_ag(), new Bakavideo_tv(),
        // new Powvideo_net(), new Bestreams_net(),
        // new Thevideo_me(), new Mycollection_net(),
        // new Filehoot_com(), new Allvid_ch(),
        // new Openload_co(), new Ishared_eu(),
        // new Flashx_tv(), new Vid_ag(),
        // new Streamin_to(), new PromptFile_com(),
        // new Briskfile_com(), new Vidup_me(),
        // new Vidto_me(), new Vidzi_tv(),
        // new Letwatch_us(), new Streamplay_to(),
        // new Watchseries_li(), new Dailymotion_com(),
        // new Twitch_tv(), new Solarmovie_ph(),
        // new Opentuner_is()

        // new Nowvideo_sx() //seemed to work in postman, but here it does not work, cookie?
        // new Neodrive_co() //forbidden -- parses url but playing does not work in url
        //new Lolzor_com()
        //new Vidbull_lol(), new Vidbull_com()
    // ]
}

export interface ScrapePair<T> {
    resolvers: Resolver<T>[],
    url: string,
    process: ProcessNode
}

export function pairResolversWithUrls(resolvers: Resolver<any>[], urls: string[], process: ProcessNode): ScrapePair<any>[] {
    return urls.reduce(function(l, url) {
        var reses = resolvers.filter(function(res) {
            return res.recognizesUrlMayContainContent(url)
        })
        if (reses.length > 0) {
            l.push({
                resolvers: reses,
                url: url,
                process: process.newChildProcess()
            })
        }
        else {
            var noResponse = new ResolverError(ResolverErrorCode.NoResponders, "Sorry, we do not know what to do with this url.")
            process.processOne({ 'type': ResultType.Error, 'error': noResponse })
        }
        return l
    }, [])
}

export function scrape(url: string, process: ProcessNode) {
    var responders = resolvers().filter(function(resolver) { return resolver.recognizesUrlMayContainContent(url) })

    if (responders.length == 0) {
        var raw = new Resolvers.Raw()
        raw.scrape(url, process)
    }
    else {
        responders.map(function(resolver) {
            var childProcess = process.newChildProcess()
            return { "resolver": resolver, "process": childProcess }
        }).forEach(function(pair) {
            pair.resolver.scrape(url, pair.process)
        })
    }

}