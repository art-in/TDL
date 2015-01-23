exports.Task = Task;

function Task(description) {
    this.description = description;
    this.position = null;
    this.progress = null; /* Float. [0;1] */
}

// Converts properties to right types,
// in passed obj or current instance of task.
Task.prototype.adjustTypes = function (obj) {
    var target = this != global ? this : obj;
    
    if (target.description !== undefined && typeof target.description != 'string') {
        target.description = target.description.toString();
    }
    
    if (target.position !== undefined && typeof target.position != 'number') {
        target.position = parseInt(target.position);
    }
    
    if (target.progress !== undefined && typeof target.progress != 'number') {
        target.progress = parseInt(target.progress);
    }
    
    return target;
}