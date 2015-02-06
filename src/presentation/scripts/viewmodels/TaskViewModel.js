define(['ko', 'lib/transport'], function(ko, transport) {

    /** 
     * Task view model.
     * 
     * @constructor
     * @param {Task} task - task model.
     */
    function TaskViewModel (task) {
        this.id = ko.observable(null);
        this.description = ko.observable(null);
        this.progress = ko.observable(null); // [0;1]
        
        if (task) {
            // Map from the model.
            this.id(task._id);
            this.description(task.description);
            this.progress(task.progress);
        }
    
        /**
         * Indicates weither view model is currently in edit mode.
         */
        this.inEditMode = ko.observable(false);
        
        /**
         * Indicates whether task is done.
         */
        this.progressDone = ko.computed(
        {
            read: function () {
                return this.progress() == 1;
            }.bind(this),
            write: function (checked) {
                this.progress(checked ? 1 : 0);
                this.saveProgress();
            }.bind(this)
        });
        
        // Description saved before entering edit mode
        this.descriptionBeforeEdit = this.description.peek();
        
        // Save/restore description before/after editing
        this.inEditMode.subscribe(function(inEditMode) {
            if (inEditMode) {
                this.descriptionBeforeEdit = this.description.peek();
            } else {
                this.description(this.descriptionBeforeEdit);
            }
        }.bind(this));
    }
    
    /**
     * Toggles edit/not-edit mode of the task view.
     */
    TaskViewModel.prototype.toggleEditMode = function() {
            this.inEditMode(!this.inEditMode());
    };
    
    /**
     * Sends current task description to the server.
     */
    TaskViewModel.prototype.saveDescription = function() {
        if (this.description() !== this.descriptionBeforeEdit) {
            var parameters = [
                {key: 'taskId', value: this.id()},
                {key: 'description', value: this.description()}
            ];
        
            transport.callServerAPI(transport.apiMethods.updateTask, parameters);
            
            this.descriptionBeforeEdit = this.description.peek();
        }
        
        this.toggleEditMode();
    };
    
    /**
     * Sends current task progress to the server.
     */
    TaskViewModel.prototype.saveProgress = function () {
        var parameters = [
            {key: 'taskId', value: this.id()},
            {key: 'progress', value: this.progress()}
        ];

        transport.callServerAPI(transport.apiMethods.updateTask, parameters);
    };
    
    return TaskViewModel;
});