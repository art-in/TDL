define(['ko', 'lib/messageBus'], function(ko, messageBus) {
   
    function ProjectViewModel(state) {
        this.state = state;
        
        this.id = ko.observable(null);
        this.name = ko.observable(null);
        this.tags = ko.observable(null);
        this.color = ko.observable(null);
        
        this.inEditMode = ko.observable(false);
        
        this.stateBeforeEdit = { 
            name: this.name(),
            tags: this.tags(),
            color: this.color()
        };
        
        this.inEditMode.subscribe(function(inEditMode) {
            if (inEditMode) {
                this.stateBeforeEdit.name = this.name();
                this.stateBeforeEdit.tags = this.tags();
                this.stateBeforeEdit.color = this.color();
            } else {
                this.name(this.stateBeforeEdit.name);
                this.tags(this.stateBeforeEdit.tags);
                this.color(this.stateBeforeEdit.color);
            }
        }.bind(this));
    }
    
    ProjectViewModel.prototype.toggleEditMode = function() {
        this.inEditMode(!this.inEditMode());
    };
    
    ProjectViewModel.prototype.save = function() {
        if (this.name() !== this.stateBeforeEdit.name ||
            this.tags() !== this.stateBeforeEdit.tags ||
            this.color() !== this.stateBeforeEdit.color) {
            
            var name = this.name();
            var tagsJSON = this.tags();
            var color = this.color();
        
            // Validate new project.
            if (!name) {
                alert('Name is empty');
                return;
            }
        
            var tags;
            try {
                tags = JSON.parse(tagsJSON || '[]');
            } catch (e) {
            } finally {
                if (!tags || tags.length === undefined) {
                    alert('Invalid array JSON');
                    return;
                }
            }
        
            if (!color) {
                alert('Color is empty');
                return;
            }
            
            messageBus.publish('updatingProject', {
                    id: this.id(), 
                    properties: { 
                        name: name,
                        tags: tags,
                        color: color
                    }
                });
        }
        
        this.toggleEditMode();
    };
    
    return ProjectViewModel;
});