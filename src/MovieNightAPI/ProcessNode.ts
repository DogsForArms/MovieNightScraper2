import {Result} from './Resolver'
import * as all from '../Tools/RegExp.extensions'
var count = 0;
function UID(): number {
    return count++
}

export interface ProcessHandler {
    (results: Result[], process: ProcessNode): void
}

export class ProcessNode {

    uid: number = UID()
    private children: ProcessNode[] = []
    finished = false
    private updateBlock: ProcessHandler

    constructor(updateBlock: ProcessHandler, public parent?: ProcessNode) {
        var self = this
        self.updateBlock = function(results: [Result], process: ProcessNode) {
            if (self.finished) {
                console.log("Task finished prematurely.".red.bold)
            }
            var numTotal = self.children.length
            var numFinished = self.children.filter(function(node) { return node.finished }).length

            self.finished = (numTotal == numFinished)
            updateBlock(results, self)
        }

    }

    newChildProcess(): ProcessNode {
        var self = this
        var child = new ProcessNode(self.updateBlock, self)
        self.children.push(child)
        return child
    }

    process(results: Result[]) {
        var self = this
        self.updateBlock(results, self)
    }
    processOne(result: Result) {
        var self = this
        self.updateBlock([result], self)
    }
}

