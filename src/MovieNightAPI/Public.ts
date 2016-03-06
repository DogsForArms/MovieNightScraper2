///<reference path="./Resolver.ts" />

///<reference path="./resolvers/Gorillavid_in.ts" />
///<reference path="./resolvers/Raw.ts" />
///<reference path="./resolvers/Allmyvideos_net.ts" />
///<reference path="./resolvers/Exashare_com.ts" />
///<reference path="./resolvers/Vidlockers_ag.ts" />
///<reference path="./resolvers/Bakavideo_tv.ts" />
///<reference path="./resolvers/Powvideo_net.ts" />
///<reference path="./resolvers/Bestreams_net.ts" />
///<reference path="./resolvers/Vidbull_lol.ts" />
///<reference path="./resolvers/Vidbull_com.ts" />
///<reference path="./resolvers/Thevideo_me.ts" />
///<reference path="./resolvers/Mycollection_net.ts" />
///<reference path="./resolvers/Lolzor_com.ts" />
///<reference path="./resolvers/Filehoot_com.ts" />
///<reference path="./resolvers/Allvid_ch.ts" />
///<reference path="./resolvers/Openload_co.ts" />
///<reference path="./resolvers/Ishared_eu.ts" />
///<reference path="./resolvers/Flashx_tv.ts" />
///<reference path="./resolvers/Vid_ag.ts" />
///<reference path="./resolvers/Streamin_to.ts" />
///<reference path="./resolvers/PromptFile_com.ts" />
///<reference path="./resolvers/Neodrive_co.ts" />
///<reference path="./resolvers/Briskfile_com.ts" />
///<reference path="./resolvers/Vidup_me.ts" />
///<reference path="./resolvers/Vidto_me.ts" />
///<reference path="./resolvers/Vidzi_tv.ts" />
///<reference path="./resolvers/Letwatch_us.ts" />
///<reference path="./resolvers/Streamplay_to.ts" />
///<reference path="./resolvers/Nowvideo_sx.ts" />
/// <reference path="./resolvers/Watchseries_li.ts"/>
/// <reference path="./resolvers/Dailymotion_com.ts"/>

module MovieNightAPI {
    export function resolvers(): Resolver<string>[] {
        var resolvers = [
            new Vodlocker_com(), new Allmyvideos_net(),
            new Gorillavid_in(), new Exashare_com(),
            new Vidlockers_ag(), new Bakavideo_tv(),
            new Powvideo_net(), new Bestreams_net(),
            new Thevideo_me(), new Mycollection_net(),
            new Filehoot_com(), new Allvid_ch(),
            new Openload_co(), new Ishared_eu(),
            new Flashx_tv(), new Vid_ag(),
            new Streamin_to(), new PromptFile_com(),
            new Briskfile_com(), new Vidup_me(),
            new Vidto_me(), new Vidzi_tv(),
            new Letwatch_us(), new Streamplay_to(),
            new Watchseries_li(), new Dailymotion_com()
            // new Nowvideo_sx() //seemed to work in postman, but here it does not work, cookie?
            // new Neodrive_co() //forbidden -- parses url but playing does not work in url
            //new Lolzor_com()
            //new Vidbull_lol(), new Vidbull_com()
        ]
        return resolvers
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
            return l
        }, [])
    }

    export function scrape(url: string, process: ProcessNode) {
        var responders = resolvers().filter(function(resolver) { return resolver.recognizesUrlMayContainContent(url) })

        if (responders.length == 0) {
            var raw = new Raw()
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

}
