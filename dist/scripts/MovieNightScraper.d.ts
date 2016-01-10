/// <reference path="../../../vendor/es6-promise.d.ts" />
/// <reference path="../../../vendor/colors.d.ts" />
declare module MovieNightAPI {
    class Vodlocker_com implements Resolver<string> {
        domain: string;
        name: string;
        needsClientRefetch: boolean;
        mediaIdRegExp: RegExp[];
        recognizesUrlMayContainContent(url: string): boolean;
        resolveId(mediaIdentifier: string, process: ProcessNode): void;
        scrape(url: string, process: ProcessNode): void;
    }
}

declare module MovieNightAPI {
    enum ResolverErrorCode {
        InternetFailure = 0,
        InsufficientData = 1,
        UnexpectedLogic = 2,
        InvalidMimeType = 3,
        NoResponders = 4,
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
    }
}

/// <reference path="../../vendor/es6-promise.d.ts" />
/// <reference path="../../vendor/request.d.ts" />
/// <reference path="../../vendor/node.d.ts" />
/// <reference path="Resolver.d.ts" />
declare var Request: any;
declare module MovieNightAPI {
    module ResolverCommon {
        function get(url: string, mediaOwnerInfo: MediaOwnerInfo, process: ProcessNode): Promise<string>;
        function getMimeType(url: string, mediaOwnerInfo: MediaOwnerInfo, process: ProcessNode): Promise<string>;
        function request(options: any, mediaOwnerInfo: MediaOwnerInfo, process: ProcessNode): Promise<string>;
    }
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

declare module MovieNightAPI {
    class Raw implements MediaFinder {
        recognizesUrlMayContainContent(url: string): boolean;
        scrape(url: string, process: ProcessNode): void;
    }
}

/// <reference path="Resolver.d.ts" />
/// <reference path="resolvers/Raw.d.ts" />
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

declare module MovieNightAPI {
    function niceFilter(rawTitle: string): string;
    interface LabeledStreams {
        quality: string;
        streamUrl: string;
    }
    class Content {
        mediaIdentifier: string;
        title: string;
        snapshotImageUrl: string;
        posterImageUrl: string;
        duration: number;
        streamUrl: string;
        streamUrls: LabeledStreams[];
        mimeType: string;
        uid: string;
        needsClientRefetch: boolean;
        domain: string;
        mediaOwnerName: string;
        constructor(mediaOwner: MediaOwnerInfo, mediaIdentifier: string);
    }
    function mimeTypeIsValid(mimeType: string): boolean;
    function finishedWithContent(content: Content, mediaOwnerInfo: MediaOwnerInfo, process: ProcessNode): void;
}
