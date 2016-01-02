declare var numTasks: number;
declare enum ResultType {
    None = -1,
    Error = 0,
    Media = 1,
    Task = 2,
}
declare class Result {
    type: ResultType;
}
declare class Content {
}
declare class Task {
    identifier: number;
    streamResults: boolean;
}
interface TaskUpdateBlock {
    (results: [Result], isFinished: boolean): any;
}
interface TaskInterface {
    domain?: string;
    resolveId(mediaId: string, update: TaskUpdateBlock): any;
}
declare class Task1 extends Task implements TaskInterface {
    resolveId(mediaId: string, update: TaskUpdateBlock): void;
}
