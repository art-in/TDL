define(['ko', 'moment', 'lib/messageBus'], function(ko, moment, messageBus) {

    function TaskViewModel (state) {
        this.state = state;

        this.id = ko.observable('');
        this.description = ko.observable('');
        this.position = ko.observable(null); // Int
        this.progress = ko.observable(0); // [0;1]
        this.progressDoneOn = ko.observable(null); // Date
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
              this.progressDoneOn(checked ? new Date() : null);
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

        this.progressDoneOnString = ko.computed({
          read: function() {
            return moment(this.progressDoneOn()).format('MMMM Do YYYY') + ' (done)';
          }.bind(this)
        });

        /** 
         * Indicates weither task properties block
         * is collapsed to short view (starting piece of description) 
         * or expanded to full view
         */
        this.expanded = ko.observable(false);

        /**
         * Indicates weither current task properties container
         * fully fits its contents (no overflows)
         * Note: disregarding collapse/expand state
         */
        this.fits = ko.observable(true);

        /**
         * Current height of task properties container
         */
        this.height = ko.observable();

        /**
         * Height of task properties container in collapsed state
         */
        this.collapsedHeight = ko.observable();

        /**
         * Indicates weither expand/collapse animation is in progress
         */
        this.expandAnimationInProgress = ko.observable(false);

        /**
         * Indicates weither current task properties container
         * fully fits its content, if container is collapsed
         */
        this.fitsInCollapsed = ko.computed({
            read: function() {

                // do not recompute while expand/collapse animation is in progress
                if (this.expandAnimationInProgress() && 
                    this.fitsInCollapsed !== undefined) {
                    return this.fitsInCollapsed.peek();
                }

                if (this.expanded()) {
                    // expanded

                    // ensure collapsed height was cached
                    if (this.collapsedHeight() === undefined) {
                        throw Error('Height of collapsed task block was not cached');
                    }
                    
                    return this.height() <= this.collapsedHeight();

                } else {
                    // collapsed
                    
                    // cache height of container in collapsed state.
                    //
                    // Why cache it?
                    // This is cheapest way to size container with current content,
                    // and hide 'collapse' button if content already fits.
                    // Eg. situation:
                    // We edit task description, adding ton of text, hit save,
                    // and want to see full text to check result and 'collapse' button.
                    // BUT in case we instead clean the description, hit save,
                    // and description perfectly fits into collapsed size, we dont
                    // really want to see 'collapse' button (even in expanded state). 
                    // So we need to check weither it already fits into collapsed view.
                    // And if yes - we can safely hide 'collapse' button.
                    //
                    // Task container is collapsed from the start, so it should work.
                    // Other solution is to append clonned invisible DOM node 
                    // in collapsed state and check resulting size (slow).
                    // Or quickly set collapsed state, check size and expand back (hack).
                    this.collapsedHeight(this.height());
                    
                    return this.fits();
                }
            }.bind(this)
        });
    }
    
    /**
     * Toggles edit/not-edit mode of the task view.
     */
    TaskViewModel.prototype.toggleEditMode = function() {
        this.inEditMode(!this.inEditMode());

        if (this.inEditMode()) {
            this.expand();
        } else {
            this.collapse();
        }
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
            properties: {
              progress: this.progress(),
              progressDoneOn: this.progressDoneOn()
            }
        });
    };

    /**
     * Sets remove mode to task.
     */
    TaskViewModel.prototype.toggleRemoveMode = function () {
        this.inRemoveMode(!this.inRemoveMode());
    };

    /**
     * Collapses task description to short view.
     */
    TaskViewModel.prototype.collapse = function() {
        this.expanded(false);
        this.expandAnimationInProgress(true);
    }

    /**
     * Expands task description to full view.
     */
    TaskViewModel.prototype.expand = function() {
        this.expanded(true);
        this.expandAnimationInProgress(true);
    }

    return TaskViewModel;
});