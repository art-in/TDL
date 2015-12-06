define(['lib/helpers'], function(helpers) {

    /**
     * Represents task - atomic work item with fully defined scope and
     * predictable execution time. Can be either done or not done.
     *
     * @constructor
     */
    function Task() {
        this.id = helpers.uid();
        this.description = '';
        this.position = 0; // Int
        this.progress = 0; // Float [0;1]
        this.progressDoneOn = null; // Date
        this.projectId = null; // string
    }

    return Task;
});