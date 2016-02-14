interface RegExp {
    execute(str: string): string;
    executeAll(str: string): string[];
    execAll(str: string): RegExpExecArray[];
}
interface RegExpConstructor {
    curryExecute(str: string): ((reg: RegExp) => (string));
}

/// <reference path="../../../vendor/es6-promise.d.ts" />
/// <reference path="../../../vendor/colors.d.ts" />
/// <reference path="../../Tools/RegExp.d.ts" />
declare module MovieNightAPI {
    class Vodlocker_com implements Resolver<string> {
        domain: string;
        name: string;
        needsClientRefetch: boolean;
        recognizesUrlMayContainContent(url: string): boolean;
        resolveId(mediaIdentifier: string, process: ProcessNode): void;
        mediaIdExtractors: ((url: string) => string)[];
        scrape(url: string, process: ProcessNode): void;
        private scrapeVodlockerLol(url, process);
    }
}

declare module MovieNightAPI {
    enum ResolverErrorCode {
        InternetFailure = 0,
        FileRemoved = 1,
        InsufficientData = 2,
        UnexpectedLogic = 3,
        InvalidMimeType = 4,
        NoResponders = 5,
    }
    class ResolverError {
        code: ResolverErrorCode;
        description: string;
        taskName: string;
        constructor(code: ResolverErrorCode, description: string, mediaOwnerInfo?: MediaOwnerInfo);
    }
    enum ResultType {
        Error = 0,
        Content = 1,
        Contents = 2,
    }
    interface Result {
        type: ResultType;
        content?: Content;
        contents?: Content[];
        error?: ResolverError;
    }
    interface MediaOwnerInfo {
        domain: string;
        name: string;
        needsClientRefetch: boolean;
    }
    interface MediaFinder {
        recognizesUrlMayContainContent(url: string): boolean;
        scrape(url: string, process: ProcessNode): void;
    }
    interface Resolver<T> extends MediaFinder, MediaOwnerInfo {
        resolveId(mediaIdentifier: T, process: ProcessNode): void;
        mediaIdExtractors: ((url: string) => (string))[];
    }
}

/// <reference path="../../vendor/es6-promise.d.ts" />
/// <reference path="../../vendor/request.d.ts" />
/// <reference path="../../vendor/node.d.ts" />
/// <reference path="Resolver.d.ts" />
declare var Request: any;
declare module MovieNightAPI {
    module ResolverCommon {
        function beautify(ugly: string): any;
        function get(url: string, mediaOwnerInfo: MediaOwnerInfo, process: ProcessNode): Promise<string>;
        function formPost(url: string, postParams: any, mediaOwnerInfo: MediaOwnerInfo, process: ProcessNode): Promise<string>;
        function getMimeType(url: string, mediaOwnerInfo: MediaOwnerInfo, process: ProcessNode): Promise<string>;
        function request(options: any, mediaOwnerInfo: MediaOwnerInfo, process: ProcessNode): Promise<string>;
        function raiseFileNotFoundError(res: Resolver<string>, url: string, process: ProcessNode): void;
    }
    function extractMediaId(res: Resolver<string>, url: string, process?: ProcessNode): string;
    function getHiddenPostParams(html: string): any;
}

declare module MovieNightAPI {
    interface ProcessHandler {
        (results: Result[], process: ProcessNode): void;
    }
    class ProcessNode {
        parent: ProcessNode;
        uid: number;
        private children;
        finished: boolean;
        private updateBlock;
        constructor(updateBlock: ProcessHandler, parent?: ProcessNode);
        newChildProcess(): ProcessNode;
        process(results: Result[]): void;
        processOne(result: Result): void;
    }
}

/// <reference path="../../../vendor/es6-promise.d.ts" />
/// <reference path="../../../vendor/colors.d.ts" />
/// <reference path="../../Tools/RegExp.d.ts" />
declare module MovieNightAPI {
    class Gorillavid_in implements Resolver<string> {
        domain: string;
        name: string;
        needsClientRefetch: boolean;
        mediaIdExtractors: ((url: string) => (string))[];
        recognizesUrlMayContainContent(url: string): boolean;
        resolveId(mediaIdentifier: string, process: ProcessNode): void;
        scrape(url: string, process: ProcessNode): void;
    }
}

declare var btoa2: any;
declare module MovieNightAPI {
    class Raw implements MediaFinder {
        recognizesUrlMayContainContent(url: string): boolean;
        scrape(url: string, process: ProcessNode): void;
    }
}

declare module MovieNightAPI {
    enum StreamType {
        Url = 0,
        Rtmp = 1,
    }
    interface Stream {
        name?: string;
        type: StreamType;
        mimeType: string;
        isValid(): boolean;
    }
    class UrlStream implements Stream {
        url: string;
        type: StreamType;
        mimeType: string;
        name: string;
        constructor(url: string);
        isValid(): boolean;
    }
    class RtmpStream implements Stream {
        server: string;
        file: string;
        type: StreamType;
        mimeType: string;
        name: string;
        constructor(server: string, file: string);
        isValid(): boolean;
    }
    function niceFilter(rawTitle: string): string;
    interface LabeledStream {
        quality: string;
        stream: Stream;
    }
    class Content {
        mediaIdentifier: string;
        title: string;
        snapshotImageUrl: string;
        posterImageUrl: string;
        duration: number;
        streams: Stream[];
        uid: string;
        needsClientRefetch: boolean;
        domain: string;
        mediaOwnerName: string;
        constructor(mediaOwner: MediaOwnerInfo, mediaIdentifier: string);
    }
    function mimeTypeIsValid(mimeType: string): boolean;
    function finishedWithContent(content: Content, mediaOwnerInfo: MediaOwnerInfo, process: ProcessNode): void;
}

/// <reference path="../../../vendor/es6-promise.d.ts" />
/// <reference path="../../../vendor/colors.d.ts" />
/// <reference path="../../Tools/RegExp.d.ts" />
/// <reference path="../Resolver.d.ts" />
/// <reference path="../Content.d.ts" />
declare module MovieNightAPI {
    class Allmyvideos_net implements Resolver<string> {
        domain: string;
        name: string;
        needsClientRefetch: boolean;
        recognizesUrlMayContainContent(url: string): boolean;
        resolveId(mediaIdentifier: string, process: ProcessNode): void;
        mediaIdExtractors: ((url: string) => string)[];
        scrape(url: string, process: ProcessNode): void;
    }
}

/// <reference path="../../../vendor/es6-promise.d.ts" />
/// <reference path="../../../vendor/colors.d.ts" />
/// <reference path="../../Tools/RegExp.d.ts" />
/// <reference path="../Resolver.d.ts" />
/// <reference path="../ResolverCommon.d.ts" />
/// <reference path="../ProcessNode.d.ts" />
/// <reference path="../Content.d.ts" />
declare module MovieNightAPI {
    class Exashare_com implements Resolver<string> {
        domain: string;
        name: string;
        needsClientRefetch: boolean;
        recognizesUrlMayContainContent(url: string): boolean;
        resolveId(mediaIdentifier: string, process: ProcessNode): void;
        mediaIdExtractors: ((url: string) => string)[];
        scrape(url: string, process: ProcessNode): void;
    }
}

/// <reference path="../../../vendor/es6-promise.d.ts" />
/// <reference path="../../../vendor/colors.d.ts" />
/// <reference path="../../Tools/RegExp.d.ts" />
/// <reference path="../Resolver.d.ts" />
/// <reference path="../ResolverCommon.d.ts" />
/// <reference path="../ProcessNode.d.ts" />
/// <reference path="../Content.d.ts" />
declare module MovieNightAPI {
    class Vidlockers_ag implements Resolver<string> {
        domain: string;
        name: string;
        needsClientRefetch: boolean;
        recognizesUrlMayContainContent(url: string): boolean;
        resolveId(mediaIdentifier: string, process: ProcessNode): void;
        mediaIdExtractors: ((url: string) => string)[];
        scrape(url: string, process: ProcessNode): void;
    }
}

/// <reference path="../../../vendor/es6-promise.d.ts" />
/// <reference path="../../../vendor/colors.d.ts" />
/// <reference path="../../Tools/RegExp.d.ts" />
/// <reference path="../Resolver.d.ts" />
/// <reference path="../ResolverCommon.d.ts" />
/// <reference path="../ProcessNode.d.ts" />
/// <reference path="../Content.d.ts" />
declare var Base64: any;
declare module MovieNightAPI {
    class Bakavideo_tv implements Resolver<string> {
        domain: string;
        name: string;
        needsClientRefetch: boolean;
        recognizesUrlMayContainContent(url: string): boolean;
        mediaIdExtractors: ((url: string) => string)[];
        resolveId(mediaIdentifier: string, process: ProcessNode): void;
        scrape(url: string, process: ProcessNode): void;
    }
}

/// <reference path="../../../vendor/es6-promise.d.ts" />
/// <reference path="../../../vendor/colors.d.ts" />
/// <reference path="../../Tools/RegExp.d.ts" />
/// <reference path="../Resolver.d.ts" />
/// <reference path="../ResolverCommon.d.ts" />
/// <reference path="../ProcessNode.d.ts" />
/// <reference path="../Content.d.ts" />
declare module MovieNightAPI {
    class Powvideo_net implements Resolver<string> {
        domain: string;
        name: string;
        needsClientRefetch: boolean;
        recognizesUrlMayContainContent(url: string): boolean;
        resolveId(mediaIdentifier: string, process: ProcessNode): void;
        mediaIdExtractors: ((url: string) => (string))[];
        scrape(url: string, process: ProcessNode): void;
    }
}

/// <reference path="../../../vendor/es6-promise.d.ts" />
/// <reference path="../../../vendor/colors.d.ts" />
/// <reference path="../../Tools/RegExp.d.ts" />
/// <reference path="../Resolver.d.ts" />
/// <reference path="../ResolverCommon.d.ts" />
/// <reference path="../ProcessNode.d.ts" />
/// <reference path="../Content.d.ts" />
declare module MovieNightAPI {
    class Bestreams_net implements Resolver<string> {
        domain: string;
        name: string;
        needsClientRefetch: boolean;
        recognizesUrlMayContainContent(url: string): boolean;
        mediaIdExtractors: ((url: string) => string)[];
        resolveId(mediaIdentifier: string, process: ProcessNode): void;
        scrape(url: string, process: ProcessNode): void;
    }
}

declare module MovieNightAPI {
    class Vidbull_lol implements Resolver<string> {
        name: string;
        domain: string;
        needsClientRefetch: boolean;
        recognizesUrlMayContainContent(url: string): boolean;
        mediaIdExtractors: ((url: string) => string)[];
        resolveId(mediaIdentifier: string, process: ProcessNode): void;
        scrape(url: string, process: ProcessNode): void;
    }
}

declare module MovieNightAPI {
    class Vidbull_com implements Resolver<string> {
        name: string;
        domain: string;
        needsClientRefetch: boolean;
        static vidbullEmbededContentRegexMediaId: RegExp;
        recognizesUrlMayContainContent(url: string): boolean;
        mediaIdExtractors: ((url: string) => string)[];
        resolveId(mediaIdentifier: string, process: ProcessNode): void;
        scrape(url: string, process: ProcessNode): void;
    }
}

/// <reference path="../../../vendor/es6-promise.d.ts" />
/// <reference path="../../../vendor/colors.d.ts" />
/// <reference path="../../Tools/RegExp.d.ts" />
declare module MovieNightAPI {
    class Thevideo_me implements Resolver<string> {
        domain: string;
        name: string;
        needsClientRefetch: boolean;
        recognizesUrlMayContainContent(url: string): boolean;
        resolveId(mediaIdentifier: string, process: ProcessNode): void;
        mediaIdExtractors: ((url: string) => string)[];
        scrape(url: string, process: ProcessNode): void;
    }
}

/// <reference path="../../../vendor/es6-promise.d.ts" />
/// <reference path="../../../vendor/colors.d.ts" />
/// <reference path="../../Tools/RegExp.d.ts" />
declare module MovieNightAPI {
    class Mycollection_net implements Resolver<string> {
        domain: string;
        name: string;
        needsClientRefetch: boolean;
        mediaIdExtractors: ((url: string) => (string))[];
        resolveId(mediaIdentifier: string, process: ProcessNode): void;
        recognizesUrlMayContainContent(url: string): boolean;
        scrape(url: string, process: ProcessNode): void;
    }
}

/// <reference path="../../../vendor/es6-promise.d.ts" />
/// <reference path="../../../vendor/colors.d.ts" />
/// <reference path="../../Tools/RegExp.d.ts" />
declare module MovieNightAPI {
    class Lolzor_com implements Resolver<string> {
        domain: string;
        name: string;
        needsClientRefetch: boolean;
        mediaIdExtractors: ((url: string) => (string))[];
        resolveId(mediaIdentifier: string, process: ProcessNode): void;
        recognizesUrlMayContainContent(url: string): boolean;
        scrape(url: string, process: ProcessNode): void;
    }
}

/// <reference path="../../../vendor/es6-promise.d.ts" />
/// <reference path="../../../vendor/colors.d.ts" />
/// <reference path="../../Tools/RegExp.d.ts" />
declare module MovieNightAPI {
    class Filehoot_com implements Resolver<string> {
        domain: string;
        name: string;
        needsClientRefetch: boolean;
        mediaIdExtractors: ((url: string) => (string))[];
        resolveId(mediaIdentifier: string, process: ProcessNode): void;
        recognizesUrlMayContainContent(url: string): boolean;
        scrape(url: string, process: ProcessNode): void;
    }
}

/// <reference path="../../../vendor/es6-promise.d.ts" />
/// <reference path="../../../vendor/colors.d.ts" />
/// <reference path="../../Tools/RegExp.d.ts" />
declare module MovieNightAPI {
    class Allvid_ch implements Resolver<string> {
        domain: string;
        name: string;
        needsClientRefetch: boolean;
        private vrot(s);
        mediaIdExtractors: ((url: string) => (string))[];
        resolveId(mediaIdentifier: string, process: ProcessNode): void;
        recognizesUrlMayContainContent(url: string): boolean;
        scrape(url: string, process: ProcessNode): void;
    }
}

/// <reference path="../../../vendor/es6-promise.d.ts" />
/// <reference path="../../../vendor/colors.d.ts" />
/// <reference path="../../Tools/RegExp.d.ts" />
declare module MovieNightAPI {
    class Openload_co implements Resolver<string> {
        domain: string;
        name: string;
        needsClientRefetch: boolean;
        mediaIdExtractors: ((url: string) => (string))[];
        resolveId(mediaIdentifier: string, process: ProcessNode): void;
        recognizesUrlMayContainContent(url: string): boolean;
        scrape(url: string, process: ProcessNode): void;
    }
}

/// <reference path="../../../vendor/es6-promise.d.ts" />
/// <reference path="../../../vendor/colors.d.ts" />
/// <reference path="../../Tools/RegExp.d.ts" />
declare module MovieNightAPI {
    class Ishared_eu implements Resolver<string> {
        domain: string;
        name: string;
        needsClientRefetch: boolean;
        mediaIdExtractors: ((url: string) => (string))[];
        resolveId(mediaIdentifier: string, process: ProcessNode): void;
        recognizesUrlMayContainContent(url: string): boolean;
        scrape(url: string, process: ProcessNode): void;
    }
}

/// <reference path="../../../vendor/es6-promise.d.ts" />
/// <reference path="../../../vendor/colors.d.ts" />
/// <reference path="../../Tools/RegExp.d.ts" />
declare module MovieNightAPI {
    class Flashx_tv implements Resolver<string> {
        domain: string;
        name: string;
        needsClientRefetch: boolean;
        mediaIdExtractors: ((url: string) => (string))[];
        resolveId(mediaIdentifier: string, process: ProcessNode): void;
        recognizesUrlMayContainContent(url: string): boolean;
        scrape(url: string, process: ProcessNode): void;
    }
}

/// <reference path="Resolver.d.ts" />
/// <reference path="resolvers/Gorillavid_in.d.ts" />
/// <reference path="resolvers/Raw.d.ts" />
/// <reference path="resolvers/Allmyvideos_net.d.ts" />
/// <reference path="resolvers/Exashare_com.d.ts" />
/// <reference path="resolvers/Vidlockers_ag.d.ts" />
/// <reference path="resolvers/Bakavideo_tv.d.ts" />
/// <reference path="resolvers/Powvideo_net.d.ts" />
/// <reference path="resolvers/Bestreams_net.d.ts" />
/// <reference path="resolvers/Vidbull_lol.d.ts" />
/// <reference path="resolvers/Vidbull_com.d.ts" />
/// <reference path="resolvers/Thevideo_me.d.ts" />
/// <reference path="resolvers/Mycollection_net.d.ts" />
/// <reference path="resolvers/Lolzor_com.d.ts" />
/// <reference path="resolvers/Filehoot_com.d.ts" />
/// <reference path="resolvers/Allvid_ch.d.ts" />
/// <reference path="resolvers/Openload_co.d.ts" />
/// <reference path="resolvers/Ishared_eu.d.ts" />
/// <reference path="resolvers/Flashx_tv.d.ts" />
declare module MovieNightAPI {
    function resolvers(): Resolver<string>[];
    function scrape(url: string, process: ProcessNode): void;
}

/// <reference path="../vendor/colors.d.ts" />
/// <reference path="../vendor/command-line-args.d.ts" />
/// <reference path="MovieNightAPI/resolvers/Vodlocker_com.d.ts" />
/// <reference path="MovieNightAPI/ResolverCommon.d.ts" />
/// <reference path="MovieNightAPI/ProcessNode.d.ts" />
/// <reference path="MovieNightAPI/Public.d.ts" />
declare var colors: any;
declare var cliArgs: CommandLineArgs;
declare var optionalCommandLineConfigs: CommandLineConfig[];
declare var requiredCommandLineConfigs: CommandLineConfig[];
declare var cli: Cli;
declare var options: any;
declare var hasNeededArgs: boolean;
declare var usage: any;

declare function logError(error: Error): void;
declare var log: any;
declare var a: {
    b: number;
};
declare var d: string;
