"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RunStatus = exports.WorkflowStatus = void 0;
var WorkflowStatus;
(function (WorkflowStatus) {
    WorkflowStatus["DRAFT"] = "draft";
    WorkflowStatus["PUBLISHED"] = "published";
    WorkflowStatus["ARCHIVED"] = "archived";
})(WorkflowStatus || (exports.WorkflowStatus = WorkflowStatus = {}));
var RunStatus;
(function (RunStatus) {
    RunStatus["PENDING"] = "pending";
    RunStatus["RUNNING"] = "running";
    RunStatus["SUCCESS"] = "success";
    RunStatus["FAILED"] = "failed";
    RunStatus["CANCELLED"] = "cancelled";
})(RunStatus || (exports.RunStatus = RunStatus = {}));
//# sourceMappingURL=types.js.map