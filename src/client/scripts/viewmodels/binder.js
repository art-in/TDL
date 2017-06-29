/**
 * Binds view and view models.
 * 
 * Note: I prefer unobtrusive binding - no behavior in HTML.
 * But we loose native KO templating with this. Since contents of script 
 * type='text/html' template tags are not part of the queryable layout.
 */
define(['jquery',
        'unobtrusive-knockout', 
        'lib/knockout-bindings'],
        function($) {
        
        /** Setup KO bindings */
        function setupBindings() {
            
            $('.main').dataBind({ visible: 'true' }); // Prevent FOUC
            
            // Task List
            
            $('.main-tasks').dataBind({ visible: '$root.views.taskList.active' });
            
            $('.main-tasks .action-bar .add-button').dataBind({ click: '$root.views.taskList.toggleAddMode.bind($root.views.taskList)' });
            $('.main-tasks .action-bar .go-projects').dataBind({ click: '$root.views.taskList.goProjects' });
            $('.main-tasks .action-bar .filter-button').dataBind({ click: '$root.views.taskList.toggleFilterPanel.bind($root.views.taskList)' });

            $('.main-tasks .action-bar .menu').dataBind({ visible: '!$root.views.taskList.inAddMode()' });
            $('.main-tasks .action-bar .new-task').dataBind({ visible: '$root.views.taskList.inAddMode' });
            $('.main-tasks .action-bar .filter').dataBind({ visible: '$root.views.taskList.filterPanelShown' });

            $('.main-tasks .filter .filter-show-done').dataBind({ checked: '$root.views.taskList.filter.showDone' });
            $('.main-tasks .filter .filter-show-done-since').dataBind({
              enable: '$root.views.taskList.filter.showDone',
              value: '$root.views.taskList.filter.showDoneSince'
            });

            $('.main-tasks .filter .filter-shown-count').dataBind({ html: '$root.views.taskList.filter.shownCount' });
            $('.main-tasks .filter .filter-total-count').dataBind({ html: '$root.views.taskList.filter.totalCount' });

            $('.new-task-input').dataBind({ editableHTML: '$root.views.taskList.newTaskDescription',
                                            sanitizeHtml: 'true',
                                            returnKeyPress: '$root.views.taskList.addTask()',
                                            escapeKeyPress: '$root.views.taskList.toggleAddMode()',
                                            contentSelect: '$root.views.taskList.inAddMode' });
            
            $('.new-task .add-button').dataBind({ click: '$root.views.taskList.addTask.bind($root.views.taskList)' });
            $('.new-task .cancel-button').dataBind({ click: '$root.views.taskList.toggleAddMode.bind($root.views.taskList)' });
            
            $('.new-task select.projects').dataBind({foreach: "{ data: $root.views.taskList.projectsToSelect, as: 'project' }", 
                                                     enable : '$root.views.taskList.projectsToSelect().length > 1',
                                                     selectedChildVM: '$root.views.taskList.newTaskProject'});
                                            
            $('select.projects option').dataBind({ text: 'project.name' });
            
            $('.task-list').dataBind({ foreach: "{ data: $root.views.taskList.tasks, as: 'task' }",
                                       sortable: "{ draggableClass: 'task'," +
                                                 "  handleClass: 'task-drag-handle'," +
                                                 "  ghostClass: 'task-drag-ghost'," + 
                                                 "  scrollSensitivity: 100," + 
                                                 "  scrollSpeed: 15," + 
                                                 "  onUpdate: $root.views.taskList.dragTask.bind($root.views.taskList) }"});
            
            $('.task').dataBind({ css: { "'editing'": 'task.inEditMode',
                                         "'done'": 'task.progressDone' }});
            $('.task-shift-up-button').dataBind({ click: '$root.views.taskList.shiftTaskUp.bind($root.views.taskList)' });
            $('.task-shift-down-button').dataBind({ click: '$root.views.taskList.shiftTaskDown.bind($root.views.taskList)' });
            $('.task-remove').dataBind({ visible: '!task.inEditMode()' });
            $('.task-remove-button').dataBind({ click: 'task.toggleRemoveMode.bind(task)',
                                         visible: '!task.inRemoveMode()' });
            $('.task-remove-confirm-button').dataBind({ click: '$root.views.taskList.removeTask.bind($root.views.taskList)',
                                                visible: 'task.inRemoveMode()' });
            $('.task-remove-cancel-button').dataBind({ click: 'task.toggleRemoveMode.bind(task)',
                                                visible: 'task.inRemoveMode()' });
            
            $('.task-progress').dataBind({ css: { "'task-progress-checkbox-checked'": 'task.progressDone' }});
            $('.task-progress-checkbox').dataBind({ checked: 'task.progressDone' });
            $('.task-shift').dataBind({ visible: '!task.inEditMode()' });
            $('.task-drag-handle').dataBind({ visible: '!task.inEditMode() && !task.inRemoveMode()' });

            $('.task-edit').dataBind({ visible: '!task.inRemoveMode()' });
            $('.task-edit select.projects').dataBind({ visible: 'task.inEditMode()',
                                                       foreach: "{ data: $root.views.taskList.projectsToSelect, as: 'project' }",
                                                       enable : '$root.views.taskList.projectsToSelect().length > 1',
                                                       selectedChildVM: 'task.project'});
            $('.task-edit-button').dataBind({ click: 'task.toggleEditMode',
                                              visible: '!task.inEditMode()' });
            $('.task-edit-save-button').dataBind({ click: 'task.save',
                                                   visible: 'task.inEditMode() && task.description()' });
            $('.task-edit-cancel-button').dataBind({ click: 'task.toggleEditMode',
                                                     visible: 'task.inEditMode' });
            $('.task-properties').dataBind({ style: { "'background-color'": 'task.projectColor' },
                                             css: {"'expanded'": 'task.expanded'},
                                             // observe properties block and not description block,
                                             // because resize sensor will not work inside contenteditable div
                                             contentFits: "task.fits",
                                             height: 'task.height',
                                             animationInProgress: 'task.expandAnimationInProgress' });
            $('.task-properties-project-name').dataBind({ visible: 'task.projectName',
                                               html: 'task.projectName' });
            $('.task-properties-description').dataBind({ editableHTML: 'task.description',
                                              sanitizeHtml: 'true',
                                              wrapUrls: '!task.inEditMode()',
                                              contentEditable: 'task.inEditMode',
                                              returnKeyPress: 'task.save()',
                                              escapeKeyPress: 'task.toggleEditMode()' });
            $('.task-properties-progress-doneon').dataBind({
              visible: 'task.progressDoneOn',
              html: 'task.progressDoneOnString'
            });
            $('.task-properties-collapse').dataBind({
                click: 'task.collapse',
                visible: 'task.expanded() && !task.inEditMode() && !task.fitsInCollapsed()'
            });
            $('.task-properties-expand').dataBind({
                click: 'task.expand',
                visible: '!task.expanded() && !task.inEditMode() && !task.fitsInCollapsed()'
            });
            
            // Project List                                  
                                              
            $('.main-projects').dataBind({ visible: '$root.views.projectList.active' });
            
            $('.main-projects .action-bar .add-button').dataBind({ click: '$root.views.projectList.toggleAddMode.bind($root.views.projectList)' });
            $('.go-tasks').dataBind({ click: '$root.views.projectList.goTasks' });
            
            $('.main-projects .action-bar .menu').dataBind({ visible: '!$root.views.projectList.inAddMode()' });
            $('.main-projects .action-bar .new-project').dataBind({ visible: '$root.views.projectList.inAddMode' });
            
            $('.new-project-properties-item-value.name').dataBind({ editableText: '$root.views.projectList.newProjectName',
                                                               sanitizeHtml: 'true',
                                                               returnKeyPress: '$root.views.projectList.addProject()',
                                                               escapeKeyPress: '$root.views.projectList.toggleAddMode()',
                                                               contentSelect: '$root.views.projectList.inAddMode' });
            $('.new-project-properties-item-value.tags').dataBind({ editableText: '$root.views.projectList.newProjectTags',
                                                               sanitizeHtml: 'true',
                                                               returnKeyPress: '$root.views.projectList.addProject()',
                                                               escapeKeyPress: '$root.views.projectList.toggleAddMode()' });
            $('.new-project-properties-item input.color').dataBind({ value: '$root.views.projectList.newProjectColor' });
            
            $('.new-project .add-button').dataBind({ click: '$root.views.projectList.addProject.bind($root.views.projectList)' });
            $('.new-project .cancel-button').dataBind({ click: '$root.views.projectList.toggleAddMode.bind($root.views.projectList)' });
            
            $('.project-list').dataBind({ foreach: "{ data: $root.state.projects, as: 'project' }" });
            
            $('.project').dataBind({ css: { "'editing'": 'project.inEditMode' }});
            $('.project-remove').dataBind({ visible: '!project.inEditMode()' });
            $('.project-remove-button').dataBind({ click: 'project.toggleRemoveMode.bind(project)',
                                                   visible: '!project.inRemoveMode()'});
            $('.project-remove-confirm-button').dataBind({ click: '$root.views.projectList.removeProject.bind($root.views.projectList)',
                                                           visible: 'project.inRemoveMode()' });
            $('.project-remove-cancel-button').dataBind({ click: 'project.toggleRemoveMode',
                                                          visible: 'project.inRemoveMode'});


            $('.project-edit').dataBind({ visible: '!project.inRemoveMode()' });
            $('.project-edit-button').dataBind({ click: 'project.toggleEditMode',
                                                 visible: '!project.inEditMode()' });
            $('.project-edit-save-button').dataBind({ click: 'project.save',
                                                      visible: 'project.inEditMode() && project.name()' });
            $('.project-edit-cancel-button').dataBind({ click: 'project.toggleEditMode',
                                                        visible: 'project.inEditMode' });                                                   
            $('.project-properties').dataBind({ style: { "'background-color'": 'project.color' }});
            $('.project-properties-value.name').dataBind({ editableText: 'project.name',
                                                           sanitizeHtml: 'true',
                                                           wrapUrls: '!project.inEditMode()',
                                                           contentEditable: 'project.inEditMode',
                                                           returnKeyPress: 'project.save()',
                                                           escapeKeyPress: 'project.toggleEditMode()',
                                                           contentSelect: 'project.inEditMode' });
            $('.project-properties-value.tags').dataBind({ editableText: 'project.tags',
                                                           sanitizeHtml: 'true',
                                                           contentEditable: 'project.inEditMode',
                                                           returnKeyPress: 'project.save()',
                                                           escapeKeyPress: 'project.toggleEditMode()' });
            $('.project-properties input.color').dataBind({ value: 'project.color',
                                                            visible: 'project.inEditMode' });
        }
        
        return {
            setupBindings: setupBindings
        };
    });
