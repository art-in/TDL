/** Models to view models mapper. */
define(['models/Task', 'viewmodels/TaskViewModel',
        'models/Project', 'viewmodels/ProjectViewModel'],
        function (Task, TaskVM,
                  Project, ProjectVM) {
            
            /**
             * Maps task model to task view model.
             * @param [ProjectViewModel[]] projectVMs - project VMs which will be looked up
             *                                          to assign correct project VM to the task VM.
             */
            function mapTask(task, projectVMs) {
                if (projectVMs === undefined) 
                    throw new Error('Project VMs should be specified for correct Task model-viewmodel mapping');
                
                var taskVM = new TaskVM();
                
                taskVM.id(task.id);
                taskVM.description(task.description);
                taskVM.position(task.position);
                taskVM.progress(task.progress);
                taskVM.progressDoneOn(task.progressDoneOn);
                taskVM.project(null);
                
                if (projectVMs) {
                    var projectVM = projectVMs.filter(function(projectVM) {
                        return projectVM.id() === task.projectId;
                    })[0];
                    
                    if (projectVM !== undefined) {
                        taskVM.project(projectVM);
                    } else {
                        // If no project was found for task - set null project viewmodel.
                        taskVM.project((new ProjectVM()).id(task.projectId));
                    }
                }
                
                return taskVM;
            }
            
            function mapTasks (tasks, projectVMs) {
                  return tasks.map(function(task) {
                      return mapTask(task, projectVMs);
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
                        taskVM.project(targetProjectVM);
                    } else {
                        taskVM.project(new ProjectVM());
                    }
                });
            }
            
            function mapProject(project) {
                var projectVM = new ProjectVM();
                
                projectVM.id(project.id);
                projectVM.name(project.name);
                projectVM.tags(JSON.stringify(project.tags));
                projectVM.color(project.color);
                
                return projectVM;
            }
            
            function mapProjects(projects) {
                return projects.map(mapProject);
            }
            
            return {
                mapTask: mapTask,
                mapTasks: mapTasks,
                assignProjectsToTasks: assignProjectsToTasks,
                
                mapProject: mapProject,
                mapProjects: mapProjects
            };
        });