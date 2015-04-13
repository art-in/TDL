define(['data/storage', 'mappers/modelMapper', 'business/projectManager', 'models/Task'],
    function(storage, modelMapper, projectManager, Task) {
    
        //region Public
    
        /**
         * Gets tasks.
         *
         * @param {function} cb - first call is local state, second - server state.
         */
        function getTasks (cb) {
            storage.getTasks(function (error, taskDOs) {
                if (error) { cb(error); return; }
                
                var tasks = modelMapper.mapTasks(taskDOs);
                cb(false, tasks);
            });
        }

        /**
         * Adds new task.
         *
         * @param {string} description
         * @param {string} projectId
         * @param {function} cb - delivers local state of tasks
         */
        function addTask (description, projectId, cb) {
            if (!description)
                throw new Error('Invalid description: ' + description);
            
            if (projectId === undefined) {
                throw new Error('Invalid project ID: ' + projectId);
            }
            
            var newTask = new Task();
            newTask.description = description;
            newTask.position = 0;
            newTask.progress = 0;
            
            // Set project
            projectManager.getProjects(true, function(error, projects) {
                if (error) { cb(error); return; }
                
                // Tags in task description has higher priority than selected project
                var projectIdByDescription = getProjectIdByDescription(newTask.description, projects);
                projectIdByDescription !== null && (projectId = projectIdByDescription);
                
                newTask.projectId = projectId;
                
                storage.addTask(newTask, function (error, taskDOs) {
                    if (error) { cb(error); return; }
                    
                    var tasks = modelMapper.mapTasks(taskDOs);
                    cb(false, tasks);
                }); 
            });
        }
        
        /**
         * Updates task properties.
         *
         * @param {string} taskId
         * @param {Object} properties
         * @param {function} cb - delivers local state of tasks
         */
        function updateTask (taskId, properties, cb) {
            if (!taskId) throw Error('Invalid task ID: ' + taskId);
            
            // Validate properties
            var propertyNames = Object.getOwnPropertyNames(properties);
            if (propertyNames.length === 0) {
                throw Error('No task properties to update');
            }

            var validPropertyNames = Object.getOwnPropertyNames(new Task());
            propertyNames.forEach(function (prop) {
                if (validPropertyNames.indexOf(prop) === -1) {
                    throw Error('Unknown property to update: ' + prop);
                }
            });
            
            // Assign project
            projectManager.getProjects(true, function(error, projects) {
                if (error) { cb(error); return; }
                
                if (properties.description !== undefined) {
                    var projectIdByDescription = getProjectIdByDescription(properties.description, projects);
                    projectIdByDescription !== null && (properties.projectId = projectIdByDescription);
                }
                
                storage.updateTask(taskId, properties, function(error, taskDOs) {
                    if (error) { cb(error); return; }
                    
                    var tasks = modelMapper.mapTasks(taskDOs);
                    cb(false, tasks);
                });
            });
        }
        
        /**
         * Moves task to new position.
         *
         * @param {string} taskId
         * @param {number} newPosition
         * @param {function} cb - delivers local state of tasks
         */
        function moveTask (taskId, newPosition, cb) {
            if (!taskId) throw Error('Invalid task ID: ' + taskId);
            
            if (newPosition === undefined || typeof newPosition !== 'number')
                throw new Error('Invalid new position: ' + newPosition);

            storage.updateTask(taskId, {position: newPosition}, cb);
        }

        /**
         * Deletes task.
         *
         * @param {string} taskId
         * @param {function} cb - delivers local state of tasks
         */
        function deleteTask (taskId, cb) {
            if (!taskId) throw Error('Invalid task ID: ' + taskId);
            
            storage.deleteTask(taskId, function (error, taskDOs) {
                if (error) { cb(error); return; }
                
                var tasks = modelMapper.mapTasks(taskDOs);
                cb(false, tasks);
            });
        }

        //endregion

        //region Private
        
        /**
         * Determines project by tags in task description.
         * @returns {string} projectId or null if no tags found.
         */
        function getProjectIdByDescription(description, projects) {
            var projectId = null;
            
            projects.forEach(function (project) {
                project.tags.forEach(function(tag) {
                    var tagExp = new RegExp('\u0023' + tag + '\\b'); // '#s'
                    if (tagExp.test(description)) {
                        projectId = project.id;
                    }
                });
            });
            
            return projectId;
        }
        
        //endregion
        
        return {
            getTasks: getTasks,
            addTask: addTask,
            updateTask: updateTask,
            moveTask: moveTask,
            deleteTask: deleteTask
        };
    });
