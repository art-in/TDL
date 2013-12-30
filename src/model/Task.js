exports.Task = Task;

function Task(description) {
    this.Description = description;
    this.Position = null;
    this.Progress = null; /* Float. [0;1] */
}