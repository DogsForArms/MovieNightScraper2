import {Content} from './Content'
import {ProcessNode} from './ProcessNode'

export enum ResolverErrorCode {
    InternetFailure,
    FileRemoved,
    InsufficientData,
    UnexpectedLogic,
    InvalidMimeType,
    NoResponders
}

export class ResolverError {
    code: ResolverErrorCode;
    description: string;

    taskName: string;

    constructor(code: ResolverErrorCode, description: string, mediaOwnerInfo?: MediaOwnerInfo) {
        var self = this
        self.code = code
        self.description = description
        self.taskName = mediaOwnerInfo ? mediaOwnerInfo.name : "MovieNight"
    }
}

export enum ResultType {
    Error, Content, Contents
}
export interface Result {
    type: ResultType
    content?: Content
    contents?: Content[]
    error?: ResolverError
}


export interface MediaOwnerInfo {
    domain: string
    name: string
    needsClientRefetch: boolean
}
export interface MediaFinder // extends MediaOwnerInfo
{
    recognizesUrlMayContainContent(url: string): boolean
    scrape(url: string, process: ProcessNode): void
}
export interface Resolver<T> extends MediaFinder, MediaOwnerInfo {
    resolveId(mediaIdentifier: T, process: ProcessNode): void
    mediaIdExtractors: ((url: string) => (string))[]
}
