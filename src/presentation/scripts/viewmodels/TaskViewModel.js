define('TDL.presentation.viewmodels', function(exports, require) {

    var ko = require('ko');
    var transport = require('TDL.presentation.lib.transport');
    
    exports.TaskViewModel = function (task) {
        this.id = ko.observable(null);
        this.description = ko.observable(null);
        this.progress = ko.observable(null); // [0;1]
        
        if (task) {
            this.id(task._id);
            this.description(task.description);
            this.progress(task.progress);
        }
        
        this.inEditMode = ko.observable(false);
        
        // Description saved before entering edit mode
        var descriptionBeforeEdit = this.description.peek();
        
        this.inEditMode.subscribe(function(inEditMode) {
            // Save/restore description before/after editing
            if (inEditMode) {
                descriptionBeforeEdit = self.description.peek();
            } else {
                self.description(descriptionBeforeEdit);
            }
        });
        
        var self = this;
        
        this.toggleEditMode = function() {
            self.inEditMode(!self.inEditMode());
        };
        
        this.saveDescription = function() {
            if (self.description() !== descriptionBeforeEdit) {
                var parameters = [
                    {key: 'taskId', value: self.id()},
                    {key: 'description', value: self.description()}
                ];
            
                transport.callServerAPI(transport.apiMethods.updateTask, parameters);
                
                descriptionBeforeEdit = self.description.peek();
            }
            
            self.toggleEditMode();
        };
        
        //noinspection JSUnresolvedFunction
        this.progressDone = ko.computed(
            {
                read: function () {
                    return self.progress() == 1;
                },
                write: function (checked) {
                    self.progress(checked ? 1 : 0);
        
                    var parameters = [
                        {key: 'taskId', value: self.id()},
                        {key: 'progress', value: self.progress()}
                    ];
        
                    transport.callServerAPI(transport.apiMethods.updateTask, parameters);
                }
            });
    };
});