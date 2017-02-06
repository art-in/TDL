/** Models to view models mapper. */
define(['models/Task', 'viewmodels/TaskViewModel',
        'models/Project', 'viewmodels/ProjectViewModel',
        'lib/helpers'],
        function (Task, TaskVM,
                  Project, ProjectVM,
                  helpers) {
            
            /**
             * Maps task model to task view model.
             * 
             * @param {object} task - task model
             * @param {TaskViewModel[]} prevTaskVMs - existing task VMs to update if possible
             * @param {ProjectViewModel[]} projectVMs - project VMs which will be looked up
             *                                          to assign correct project VM to the task VM.
             */
            function mapTask(task, prevTaskVMs, projectVMs) {
                if (projectVMs === undefined) 
                    throw new Error('Project VMs should be specified for correct Task model-viewmodel mapping');
                
                // update existing VM if possible
                var taskVM = prevTaskVMs.find(t => t.id() === task.id);

                if (!taskVM) {
                     taskVM = new TaskVM();

                     taskVM.id(task.id);
                     taskVM.project(null);
                }

                taskVM.description(task.description);
                taskVM.position(task.position);
                taskVM.progress(task.progress);

                // KO comparer will compare date objects by refs
                // which will always lead to different objects, while
                // underlying dates can be the same
                if (!helpers.datesEqual(
                    taskVM.progressDoneOn(), task.progressDoneOn)) {
                    taskVM.progressDoneOn(task.progressDoneOn);
                }
                
                if (projectVMs) {
                    var projectVM = projectVMs.filter(function(projectVM) {
                        return projectVM.id() === task.projectId;
                    })[0];
                    
                    if (projectVM !== undefined) {
                        // check objects before update, because
                        // KO compares same VMs to false (for whatever reason)
                        if (taskVM.project() !== projectVM) {
                            taskVM.project(projectVM);
                        }
                    } else {
                        // If no project was found for task - set null project viewmodel.
                        taskVM.project((new ProjectVM()).id(task.projectId));
                    }
                }
                
                return taskVM;
            }
            
            function mapTasks (tasks, prevTaskVMs, projectVMs) {
                  return tasks.map(function(task) {
                      return mapTask(task, prevTaskVMs, projectVMs);
                  });
            }
            
            /**
             * Assigns new project view models to each task view model in the set.
             * Useful when projects was updated, but tasks still refer to old project VMs.
             */
            function assignProjectsToTasks(taskVMs, projectVMs) {
                if (taskVMs === undefined || taskVMs.length === undefined)
                    throw new Error('Invalid task view models');
                    
                if (projectVMs === undefined || projectVMs.length === undefined)
                    throw new Error('Invalid project view models');
                
                taskVMs.forEach(function(taskVM) {
                    var targetProjectVM = projectVMs.filter(function(projectVM) {
                        return projectVM.id() === taskVM.project().id();
                    })[0];
                    
                    if (targetProjectVM) {
                        // check objects before update, because
                        // KO compares same VMs to false (for whatever reason)
                        if (taskVM.project() !== targetProjectVM) {
                            taskVM.project(targetProjectVM);
                        }
                    } else {
                        taskVM.project(new ProjectVM());
                    }
                });
            }
            
            function mapProject(project, prevProjectVMs) {

                // update existing VM if possible
                var projectVM = prevProjectVMs.find(p => p.id() === project.id);

                if (!projectVM) {
                    projectVM = new ProjectVM();
                    
                    projectVM.id(project.id);
                }

                projectVM.name(project.name);
                projectVM.tags(JSON.stringify(project.tags));
                projectVM.color(project.color);
                
                return projectVM;
            }
            
            function mapProjects(projects, prevProjectVMs) {
                return projects.map(function(project) {
                    return mapProject(project, prevProjectVMs);
                });
            }
            
            return {
                mapTask: mapTask,
                mapTasks: mapTasks,
                assignProjectsToTasks: assignProjectsToTasks,
                
                mapProject: mapProject,
                mapProjects: mapProjects
            };
        });