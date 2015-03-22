define(['lib/helpers'], function(helpers) {

    /**
     * Represents task.
     *
     * @constructor
     * @param {string} description
     */
    function Task(description) {
        this.id = helpers.guid();
        this.description = description;
        this.position = null;
        this.progress = null; // Float. [0;1]
    }

    /**
     * Converts properties of the task to correct types.
     *
     * @example
     * // Updating task properties from custom object, while adjusting types
     * var task = new Task();
     * task.adjustTypes({position: "10"});
     *
     * @example
     * // Create custom object and adjust types of its properties
     * var properties = {position: "10"};
     * properties = Task.prototype.adjustTypes.call(null, properties);
     *
     * @param {Object} obj - properties
     */
    Task.prototype.adjustTypes = function (obj) {
        var target = this != window ? this : obj;

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
    };

    return Task;
});