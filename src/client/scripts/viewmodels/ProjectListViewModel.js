define(['ko', 'lib/messageBus'], function(ko, messageBus) {
    
    function ProjectListViewModel(state) {
        this.state = state;
        this.active = ko.observable(false);
        
        this.newProjectName = ko.observable('');
        this.newProjectTags = ko.observable('');
        this.newProjectColor = ko.observable(defaultColor);
        
        this.inAddMode = ko.observable(false);
    }
    
    var defaultColor = '#d3eef8';
    
    ProjectListViewModel.prototype.goTasks = function() {
        messageBus.publish('switchingView', 'taskList');
    };
    
    ProjectListViewModel.prototype.toggleAddMode = function() {
        this.emptyNewProject();
        this.inAddMode(!this.inAddMode());
    };
    
    ProjectListViewModel.prototype.addProject = function () {
        var name = this.newProjectName();
        var tagsJSON = this.newProjectTags();
        var color = this.newProjectColor();
        
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
    
        this.emptyNewProject();
        
        messageBus.publish('addingProject', {
            name: name,
            tags: tags,
            color: color
        });
        
        this.toggleAddMode();
    };
    
    ProjectListViewModel.prototype.emptyNewProject = function () {
        this.newProjectName('');
        this.newProjectTags('');
        this.newProjectColor(defaultColor);
    };
    
    ProjectListViewModel.prototype.removeProject = function (projectVM) {
         messageBus.publish('deletingProject', { id: projectVM.id() });
    };

    return ProjectListViewModel;
});