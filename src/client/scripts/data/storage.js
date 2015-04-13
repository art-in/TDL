define(['lib/transport/apiAgent'],
    function(apiAgent) {

        /**
         * Gets tasks.
         *
         * @param {boolean} [localOnly=false] - get local state only
         * @param {function} cb - first call is local state, second - server state.
         */
        function getTasks (localOnly, cb) {
            typeof localOnly === 'function' && (cb = localOnly, localOnly = false);
            
            if (!localOnly) {
                // Get from server
                apiAgent.getTasks(function(error, tasksJSON) {
                    if (error) { cb(error); return; }
                    localStorage.tasks = tasksJSON;
                    respond(tasksJSON);
                });
            }

            // Get locally
            respond(localStorage.tasks);
            
            function respond(tasksJSON) {
                var tasks = JSON.parse(tasksJSON);
                tasks.sort(tasksComparer);
                cb(false, tasks);
            }
        }

        /**
         * Adds new task.
         *
         * @param {Task} newTask
         * @param {function} cb - delivers local state of tasks
         */
        function addTask (newTask, cb) {
            
            // Add to server
            apiAgent.addTask(newTask);

            // Add locally
            var taskPosition = newTask.position;
            var tasks = shiftTaskPositions(taskPosition, null, 1);
            tasks.push(newTask);
            localStorage.tasks = JSON.stringify(tasks);
            tasks.sort(tasksComparer);
            
            cb(false, tasks);
        }

        /**
         * Updates properties of existing task.
         *
         * @param {string} taskId
         * @param {Object} properties
         * @param {function} cb - delivers local state of tasks
         */
        function updateTask (taskId, properties, cb) {
            // Update on server
            apiAgent.updateTask(taskId, properties);

            // Update locally
            var tasks = JSON.parse(localStorage.tasks);

            var targetTask = tasks.filter(function(t) {
                return t.id === taskId;
            })[0];

            if (targetTask === undefined)
                throw new Error('Task to update was not found.');

            if (properties.position !== undefined) {
                // If changing task position - shift other tasks

                var newPosition = properties.position;

                var oldPosition = targetTask.position;
                var movedDown = newPosition > oldPosition;

                tasks = shiftTaskPositions(
                    movedDown ? oldPosition + 1 : newPosition,
                    movedDown ? newPosition : oldPosition - 1,
                    movedDown ? -1 : 1);
            }

            targetTask = tasks.filter(function(t) {
                return t.id === taskId;
            })[0];

            var propertyNames = Object.getOwnPropertyNames(properties);

            propertyNames.forEach(function(propName) {
               targetTask[propName] = properties[propName];
            });

            localStorage.tasks = JSON.stringify(tasks);

            tasks.sort(tasksComparer);

            cb(false, tasks);
        }

        /**
         * Deletes task.
         *
         * @param {string} taskId
         * @param {function} cb - delivers local state of tasks
         */
        function deleteTask (taskId, cb) {
            // Delete on server
            apiAgent.deleteTask(taskId);

            // Delete locally
            var tasks = JSON.parse(localStorage.tasks);

            var targetTask = tasks.filter(function(t) {
                return t.id === taskId;
            })[0];

            if (targetTask === undefined)
                throw new Error('Task to delete was not found.');

            // Shift positions or all tasks below one position up
            tasks = shiftTaskPositions(targetTask.position, null, -1);

            targetTask = tasks.filter(function(t) {
                return t.id === taskId;
            })[0];

            var targetTaskIndex = tasks.indexOf(targetTask);

            tasks.splice(targetTaskIndex, 1);

            localStorage.tasks = JSON.stringify(tasks);

            tasks.sort(tasksComparer);

            cb(false, tasks);
        }
        
        /**
         * Gets projects.
         *
         * @param {boolean} [localOnly=false] - get local state only
         * @param {function} cb - first call is local state, second - server state.
         */
        function getProjects (localOnly, cb) {
            typeof localOnly === 'function' && (cb = localOnly, localOnly = false);
            
            var respond = function(projectsJSON) {
                var projects = JSON.parse(projectsJSON);
                cb(false, projects);
            };

            if (!localOnly) {
                // Get from server
                apiAgent.getProjects(function(error, projectsJSON) {
                    if (error) { cb(error); return; }
                    localStorage.projects = projectsJSON;
                    respond(projectsJSON);
                });
            }

            // Get locally
            respond(localStorage.projects);
        }
        
        /**
         * Adds new project.
         *
         * @param {Project} newProject
         * @param {function} cb - delivers local state of projects
         */
        function addProject (newProject, cb) {
            
            // Add to server
            apiAgent.addProject(newProject);

            // Add locally
            var projects = JSON.parse(localStorage.projects);
            projects.push(newProject);
            localStorage.projects = JSON.stringify(projects);

            cb(false, projects);
        }
        
        /**
         * Updates properties of existing project.
         *
         * @param {string} projectId
         * @param {Object} properties
         * @param {function} cb - delivers local state of projects
         */
        function updateProject (projectId, properties, cb) {
            
            // Update on server
            apiAgent.updateProject(projectId, properties);

            // Update locally
            var projects = JSON.parse(localStorage.projects);

            var targetProject = projects.filter(function(p) {
                return p.id === projectId;
            })[0];

            if (targetProject === undefined)
                throw new Error('Project to update was not found.');

            var propertyNames = Object.getOwnPropertyNames(properties);

            propertyNames.forEach(function(propName) {
               targetProject[propName] = properties[propName];
            });

            localStorage.projects = JSON.stringify(projects);

            cb(false, projects);
        }
        
        /**
         * Deletes project.
         *
         * @param {string} projectId
         * @param {function} cb - delivers local state of tasks
         */
        function deleteProject (projectId, cb) {
            // Delete on server
            apiAgent.deleteProject(projectId);

            // Delete locally
            var projects = JSON.parse(localStorage.projects);

            var targetProject = projects.filter(function(p) {
                return p.id === projectId;
            })[0];

            if (targetProject === undefined)
                throw new Error('Project to delete was not found.');

            var targetProjectIndex = projects.indexOf(targetProject);

            projects.splice(targetProjectIndex, 1);

            localStorage.projects = JSON.stringify(projects);

            cb(false, projects);
        }
        
        //region Private methods
        
        function tasksComparer(taskA, taskB) {
            if (taskA.position < taskB.position) {
                return -1;
            }

            if (taskA.position > taskB.position) {
                return 1;
            }

            return 0;
        }

        /**
         * Shifts position of tasks in certain range to specified value.
         *
         * @param {number} startPosition
         * @param {number} endPosition
         * @param {number} shift - number of positions to move
         *                         positive number to move further, negavive - to move backwards
         * @returns Local state
         */
        function shiftTaskPositions (startPosition, endPosition, shift) {
            // Shift locally
            startPosition = startPosition !== null ? startPosition : 0;
            endPosition = endPosition !== null ? endPosition : Number.MAX_VALUE;

            var tasks = JSON.parse(localStorage.tasks);

            tasks.forEach(function(task) {
                if (task.position >= startPosition && task.position <= endPosition) {
                    task.position += shift;
                }
            });

            localStorage.tasks = JSON.stringify(tasks);

            tasks.sort(tasksComparer);

            return tasks;
        }
        
        !function initStorage() {
            !localStorage.tasks && (localStorage.tasks = '[]');
            !localStorage.projects && (localStorage.projects = '[]');
        }();
        
        //endregion

         return {
            getTasks: getTasks,
            addTask: addTask,
            updateTask: updateTask,
            deleteTask: deleteTask,
            
            getProjects: getProjects,
            addProject: addProject,
            updateProject: updateProject,
            deleteProject: deleteProject
        };
    });
