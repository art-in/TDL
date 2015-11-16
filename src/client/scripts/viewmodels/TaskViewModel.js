define(['ko', 'lib/messageBus'], function(ko, messageBus) {

    function TaskViewModel (state) {
        this.state = state;

        this.id = ko.observable('');
        this.description = ko.observable('');
        this.progress = ko.observable(0); // [0;1]
        this.project = ko.observable(null); // ProjectViewModel

        /** Indicates weither view model is currently in edit mode. */
        this.inEditMode = ko.observable(false);

        /** Indicates whether task is fully done. */
        this.progressDone = ko.computed(
          {
            read: function() {
              return this.progress() == 1;
            }.bind(this),
            write: function(checked) {
              this.progress(checked ? 1 : 0);
              this.saveProgress();
            }.bind(this)
          });

        /** State before entering edit mode */
        this.stateBeforeEdit = {
          description: this.description.peek(),
          project: this.project()
        };

        // Save/restore description before/after editing
        this.inEditMode.subscribe(function(inEditMode) {
          if (inEditMode) {
            this.stateBeforeEdit.description = this.description.peek();
            this.stateBeforeEdit.project = this.project();
          } else {
            this.description(this.stateBeforeEdit.description);
            this.project(this.stateBeforeEdit.project);
          }
        }.bind(this));

        this.projectColor = ko.computed({
          read: function() {
            return !!this.project() ? this.project().color() : '';
          }.bind(this)
        });

        this.projectName = ko.computed({
          read: function() {
            return !!this.project() ? this.project().name() : '';
          }.bind(this)
        });

        /** Indicates weither view model is currently in remove mode. */
        this.inRemoveMode = ko.observable(false);
    }
    
    /**
     * Toggles edit/not-edit mode of the task view.
     */
    TaskViewModel.prototype.toggleEditMode = function() {
        this.inEditMode(!this.inEditMode());
    };
    
    TaskViewModel.prototype.save = function() {
        if (this.description() !== this.stateBeforeEdit.description ||
            this.project() !== this.stateBeforeEdit.project) {
            
            messageBus.publish('updatingTask', {
                    id: this.id(), 
                    properties: { 
                        description: this.description(),
                        projectId: this.project() && this.project().id()
                    }
                });
        }
        
        this.toggleEditMode();
    };
    
    /**
     * Sends current task progress to the server.
     */
    TaskViewModel.prototype.saveProgress = function () {
        messageBus.publish('updatingTask', {
            id: this.id(), 
            properties: { progress: this.progress() }
        });
    };

    /**
     * Sets remove mode to task.
     */
    TaskViewModel.prototype.toggleRemoveMode = function () {
        this.inRemoveMode(!this.inRemoveMode());
    };
    
    return TaskViewModel;
});