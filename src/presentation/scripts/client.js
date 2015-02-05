define('client', 
      ['jquery', 
       'ko', 
       'viewmodels/TaskListViewModel', 
       'unobtrusive-knockout', 
       'lib/knockout-bindings'], 
    function ($, ko, TaskListViewModel) {
    
    // Init.
    setupBindings();

    var taskListViewModel = new TaskListViewModel();
    ko.applyBindings(taskListViewModel);

    taskListViewModel.reloadTasks();
    
    // Setup KO bindings.
    function setupBindings() {
        $('.new-task-input').dataBind({ editableHTML: '$root.newTaskDescription',
                                        returnKeyPress: '$root.addTask' });
        $('.add-new-task-button').dataBind({ click: '$root.addTask' });
        $('.task-list').dataBind({ foreach: '$root.tasks',
                                   sortable: "{ draggableClass: 'task'," +
                                             " handleClass: 'task-drag-handle'," +
                                             " ghostClass: 'task-drag-ghost'," + 
                                             " onUpdate: $root.dragTask }"});
        $('.task-shift-up-button').dataBind({ click: '$root.shiftTaskUp' });
        $('.task-shift-down-button').dataBind({ click: '$root.shiftTaskDown' });
        $('.task-remove-button').dataBind({ click: '$root.removeTask',
                                            visible: '!$data.inEditMode()' });
    
        $('.task-progress').dataBind({ css: { "'task-progress-checkbox-checked'": '$data.progressDone' }});
        $('.task-progress-checkbox').dataBind({ checked: '$data.progressDone' });
        $('.task-shift').dataBind({ visible: '!$data.inEditMode()' });
        $('.task-drag-handle').dataBind({ visible: '!$data.inEditMode()'});
        $('.task-edit-button').dataBind({ click: '$data.toggleEditMode',
                                          visible: '!$data.inEditMode()' });
        $('.task-edit-save-button').dataBind({ click: '$data.saveDescription',
                                               visible: '$data.inEditMode() && $data.description()' });
        $('.task-edit-cancel-button').dataBind({ click: '$data.toggleEditMode',
                                                 visible: '$data.inEditMode' });                                                   
        $('.task-description').dataBind({ editableHTML: '$data.description',
                                          contentEditable: '$data.inEditMode',
                                          css: { "'editing'": '$data.inEditMode' },
                                          returnKeyPress: '$data.saveDescription',
                                          contentSelect: '$data.inEditMode',
                                          backgroundColorTag:
                                              "{ source: $data.description, " +
                                              "  tags: [{ tag: '(#|№)(com|common)', color: '#C4F2EA', default: true }," +
                                              "         { tag: '(#|№)(c|с|craft)', color: '#FFE1B7' }," +
                                              "         { tag: '(#|№)(s|sport|сп|спорт)', color: '#C1F2C1' }]}" });
    }
});