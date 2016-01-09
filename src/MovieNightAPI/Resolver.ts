module MovieNightAPI
{
	export enum ResolverErrorCode 
	{
		InternetFailure,
		InsufficientData,
		UnexpectedLogic,
		InvalidMimeType,
		NoResponders
	}
	export class ResolverError 
	{
		code: ResolverErrorCode;
		description: string;

		taskName: string;

		constructor(code: ResolverErrorCode, description: string, resolver?: Resolver<any>) 
		{
			var self = this
			self.code = code
			self.description = description
			self.taskName = resolver ? resolver.name : "MovieNight"
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
	export interface Resolver<TMediaId> 
	{
		domain: string
		name: string
		needsClientFetch: boolean

		recognizesUrlMayContainContent(url: string): boolean
		resolveId(mediaIdentifier: TMediaId, process: ProcessNode): void
		scrape(url: string, process: ProcessNode): void

	}

}