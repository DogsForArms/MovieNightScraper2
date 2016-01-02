var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var numTasks = 0;
var ResultType;
(function (ResultType) {
    ResultType[ResultType["None"] = -1] = "None";
    ResultType[ResultType["Error"] = 0] = "Error";
    ResultType[ResultType["Media"] = 1] = "Media";
    ResultType[ResultType["Task"] = 2] = "Task";
})(ResultType || (ResultType = {}));
var Result = (function () {
    function Result() {
        this.type = ResultType.None;
    }
    return Result;
})();
var Content = (function () {
    function Content() {
    }
    return Content;
})();
var Task = (function () {
    function Task() {
        this.identifier = numTasks++;
        this.streamResults = false;
    }
    return Task;
})();
var Task1 = (function (_super) {
    __extends(Task1, _super);
    function Task1() {
        _super.apply(this, arguments);
    }
    // name = "Task1"
    Task1.prototype.resolveId = function (mediaId, update) {
        update([new Result()], true);
    };
    return Task1;
})(Task);
