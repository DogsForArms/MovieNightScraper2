/// <reference path="MovieNightAPI.d.ts" />
declare module MovieNightAPI {
    function niceFilter(rawTitle: string): string;
    interface LabeledStreams {
        quality: string;
        streamUrl: string;
    }
    class Content {
        title: string;
        image: string;
        duration: number;
        streamUrl: string;
        streamUrls: LabeledStreams[];
        mediaIdentifier: string;
        needsClientIp: boolean;
        mimeType: string;
        uid: string;
        domain: string;
        resolverName: string;
        constructor(obj: any, res: MovieNightAPI.Resolver<any>);
    }
    function createContent(obj: any, res: Resolver<any>, process: ProcessNode): void;
}

/// <reference path="../../vendor/es6-promise.d.ts" />
/// <reference path="../../vendor/request.d.ts" />
/// <reference path="../../vendor/node.d.ts" />
/// <reference path="Content.d.ts" />
declare var Request: any;
declare module MovieNightAPI {
    module ResolverCommon {
        function get(url: string, res: Resolver<any>, process: ProcessNode): Promise<string>;
        function headOnly(url: string, res: Resolver<any>, process: ProcessNode): Promise<string>;
        function request(options: any, res: Resolver<any>, process: ProcessNode): Promise<string>;
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
        constructor(code: ResolverErrorCode, description: string, resolver?: Resolver<any>);
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
    interface Resolver<TMediaId> {
        domain: string;
        name: string;
        needsClientFetch: boolean;
        recognizesUrlMayContainContent(url: string): boolean;
        resolveId(mediaIdentifier: TMediaId, process: ProcessNode): void;
        scrape(url: string, process: ProcessNode): void;
    }
}

interface RegExp {
    execute(str: string): string;
}
interface StringToRegExpMap {
    [s: string]: RegExp;
}
interface StringToStringMap {
    [s: string]: string;
}
interface RegExpConstructor {
    executeAll(obj: StringToRegExpMap, str: string): StringToStringMap;
}

/// <reference path="../MovieNightAPI.d.ts" />
/// <reference path="../Content.d.ts" />
/// <reference path="../Resolver.d.ts" />
/// <reference path="../../../vendor/es6-promise.d.ts" />
/// <reference path="../../../vendor/colors.d.ts" />
/// <reference path="../../RegExp/RegExp.d.ts" />
declare module MovieNightAPI {
    class Vodlocker_com implements Resolver<string> {
        domain: string;
        name: string;
        needsClientFetch: boolean;
        mediaIdRegExp: RegExp[];
        recognizesUrlMayContainContent(url: string): boolean;
        resolveId(mediaIdentifier: string, process: ProcessNode): void;
        scrape(url: string, process: ProcessNode): void;
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

/// <reference path="../vendor/colors.d.ts" />
/// <reference path="../vendor/command-line-args.d.ts" />
/// <reference path="MovieNightAPI/resolvers/Vodlocker_com.d.ts" />
/// <reference path="MovieNightAPI/MovieNightAPI.d.ts" />
/// <reference path="MovieNightAPI/ProcessNode.d.ts" />
declare var colors: any;
declare var cliArgs: CommandLineArgs;
declare var optionalCommandLineConfigs: CommandLineConfig[];
declare var requiredCommandLineConfigs: CommandLineConfig[];
declare var cli: Cli;
declare var options: any;
declare var hasNeededArgs: boolean;
declare var usage: any;

declare module MovieNightAPI {
    function scrape(url: string, process: ProcessNode): void;
}
