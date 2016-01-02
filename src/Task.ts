

var numTasks: number = 0

enum ResultType{
	None = -1, Error, Media, Task
}
class Result{
	type: ResultType = ResultType.None
}

class Content{}

class Task 
{
	identifier: number = numTasks++
	streamResults: boolean = false
}

interface TaskUpdateBlock { (results: [Result], isFinished: boolean) }

interface TaskInterface
{
	domain?: string 
	// recognizesUrl(url: string): boolean;
	resolveId(mediaId: string, update: TaskUpdateBlock)
	
}

class Task1 extends Task implements TaskInterface
{
	// name = "Task1"
	resolveId(mediaId: string, update: TaskUpdateBlock)
	{
		update([new Result()], true)
	}
}