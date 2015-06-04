define(['co'], function(co) {
    
    /**
     * Gets tasks.
     * 
     * @return {Promise}
     */
    function getTasks() {
        return co(function*() {
            return JSON.parse(localStorage.tasks);
        });
    }
    
    /**
     * Sets tasks.
     * 
     * @return {Promise}
     */
    function setTasks(tasks) {
        return co(function*() {
            localStorage.tasks = JSON.stringify(tasks);
        });
    }
    
    /**
     * Adds new task.
     *
     * @param {Task} newTask
     * @return {Promise}
     */
    function addTask(newTask) {
        return co(function*() {
            var taskPosition = newTask.position;
            var tasks = shiftTaskPositions(taskPosition, null, 1);
            tasks.push(newTask);
            tasks.sort(tasksComparer);
            localStorage.tasks = JSON.stringify(tasks);
        });
    }
    
    /**
     * Updates properties of existing task.
     *
     * @param {string} taskId
     * @param {Object} properties
     * @return {Promise}
     */
    function updateTask(taskId, properties) {
        return co(function*() {
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
    
            tasks.sort(tasksComparer);
            localStorage.tasks = JSON.stringify(tasks);
        });
    }
    
    /**
     * Deletes task.
     *
     * @param {string} taskId
     * @return {Promise}
     */
    function deleteTask(taskId) {
        return co(function*() {
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
    
            tasks.sort(tasksComparer);
            localStorage.tasks = JSON.stringify(tasks);
        });
    }
    
    /**
     * Gets projects.
     *
     * @return {Promise}
     */
    function getProjects() {
        return co(function*() {
            return JSON.parse(localStorage.projects);
        });    
    }
    
    /**
     * Sets projects.
     *
     * @return {Promise}
     */
    function setProjects(projects) {
        return co(function*() {
            localStorage.projects = JSON.stringify(projects);
        });
    }
    
    /**
     * Adds new project.
     *
     * @param {Project} newProject
     * @return {Promise}
     */
    function addProject(newProject) {
        return co(function*() {
            var projects = JSON.parse(localStorage.projects);
            projects.push(newProject);
            localStorage.projects = JSON.stringify(projects);
        });
    }
    
    /**
     * Updates properties of existing project.
     *
     * @param {string} projectId
     * @param {Object} properties
     * @return {Promise}
     */
    function updateProject(projectId, properties) {
        return co(function*() {
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
        });
    }
    
    /**
     * Deletes project.
     *
     * @param {string} projectId
     * @return {Promise}
     */
    function deleteProject(projectId) {
        return co(function*() {
            var projects = JSON.parse(localStorage.projects);
    
            var targetProject = projects.filter(function(p) {
                return p.id === projectId;
            })[0];
    
            if (targetProject === undefined)
                throw new Error('Project to delete was not found.');
    
            var targetProjectIndex = projects.indexOf(targetProject);
    
            projects.splice(targetProjectIndex, 1);
    
            localStorage.projects = JSON.stringify(projects);
        });
    }
    
    //region Private methods
    
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
    
    function tasksComparer(taskA, taskB) {
        if (taskA.position < taskB.position) {
            return -1;
        }

        if (taskA.position > taskB.position) {
            return 1;
        }

        return 0;
    }

    !function initStorage() {
        !localStorage.tasks && (localStorage.tasks = '[]');
        !localStorage.projects && (localStorage.projects = '[]');
    }();
    
    //endregion
    
    return {
        getTasks: getTasks,
        setTasks: setTasks,
        addTask: addTask,
        updateTask: updateTask,
        deleteTask: deleteTask,
        
        getProjects: getProjects,
        setProjects: setProjects,
        addProject: addProject,
        updateProject: updateProject,
        deleteProject: deleteProject
    };
    
});