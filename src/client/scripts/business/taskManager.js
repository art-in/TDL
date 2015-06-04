define(['co', 'data/storage', 'mappers/modelMapper', 'business/projectManager', 'models/Task'],
    function(co, storage, modelMapper, projectManager, Task) {
    
        //region Public
        
        /**
         * Gets tasks.
         * 
         * @return {object} local and server state promises
         */
        function getTasks () {
            return {
                local: co.wrap(function*() { 
                    return storage.getTasksLocal().then(modelMapper.mapTasks);
                }),
                server: co.wrap(function*() {
                    return storage.getTasks().then(modelMapper.mapTasks);
                })
            };
        }
        
        /**
         * Adds new task.
         *
         * @param {string} description
         * @param {string} projectId
         * @return {Promise}
         */
        function addTask (description, projectId) {
            return co(function*() {
                
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
                var projects = yield projectManager.getProjects().local();
                
                // Tags in task description has higher priority than selected project
                var projectIdByDescription = getProjectIdByDescription(newTask.description, projects);
                projectIdByDescription !== null && (projectId = projectIdByDescription);
                
                newTask.projectId = projectId;
                
                yield storage.addTask(newTask);
            });
        }
        
        /**
         * Updates task properties.
         *
         * @param {string} taskId
         * @param {Object} properties
         * @return {Promise}
         */
        function updateTask (taskId, properties) {
            return co(function*() {
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
                var projects = yield projectManager.getProjects().local();
                    
                if (properties.description !== undefined) {
                    var projectIdByDescription = getProjectIdByDescription(properties.description, projects);
                    projectIdByDescription !== null && (properties.projectId = projectIdByDescription);
                }
                
                yield storage.updateTask(taskId, properties);
            });
        }
        
        /**
         * Moves task to new position.
         *
         * @param {string} taskId
         * @param {number} newPosition
         * @return {Promise}
         */
        function moveTask (taskId, newPosition) {
            return co(function*() {
                if (!taskId) throw Error('Invalid task ID: ' + taskId);
                
                if (newPosition === undefined || typeof newPosition !== 'number')
                    throw new Error('Invalid new position: ' + newPosition);
    
                yield storage.updateTask(taskId, {position: newPosition});
            });
        }

        /**
         * Deletes task.
         *
         * @param {string} taskId
         * @return {Promise}
         */
        function deleteTask (taskId) {
            return co(function*() {
                if (!taskId) throw Error('Invalid task ID: ' + taskId);
                yield storage.deleteTask(taskId);
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
