import {Resolver} from '../Resolver'
import {ProcessNode} from '../ProcessNode'
import {ResolverCommon, extractMediaId} from '../ResolverCommon'
import {Content, UrlStream, finishedWithContent} from '../Content'
import {pairResolversWithUrls, resolvers} from '../Public'


module MovieNightAPI {
    export class Opentuner_is implements Resolver<string>
    {
        domain = 'opentuner.is'
        name = 'OpenTuner'
        needsClientRefetch = true

        mediaIdExtractors: ((url: string) => (string))[] = [
            function(url) { return /opentuner\.is\/go\.php\?url=(.*?)(\/|'|"|$)/.execute(url) }
        ]

        resolveId(mediaIdentifier: string, process: ProcessNode) {
            let self = this
            let Base64 = require('js-base64').Base64
            let url = Base64.decode(mediaIdentifier)

            let res = resolvers().filter(function(resolver) {
                return resolver.domain != self.domain
            })
            pairResolversWithUrls(res, [url], process).forEach(function(pair) {
                pair.resolvers[0].scrape(pair.url, pair.process)
            })
        }

        recognizesUrlMayContainContent(url: string): boolean {
            return extractMediaId(this, url) != null
        }

        scrape(url: string, process: ProcessNode) {
            extractMediaId(this, url, process)
        }
    }
}
