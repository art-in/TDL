define(['co', './apiAgent', './localStorageAgent'],
    function(co, apiAgent, localStorageAgent) {

        /**
         * Gets tasks from server.
         *
         * @return {Promise} server state
         */
        function getTasks () {
            return co(function*() {
                var tasks = yield apiAgent.getTasks();
                localStorageAgent.setTasks(tasks);
                return tasks;
            });
        }
        
        /**
         * Gets tasks from local storage.
         *
         * @return {Promise} local state
         */
        function getTasksLocal() {
            return localStorageAgent.getTasks();
        }

        /**
         * Adds new task.
         *
         * @param {Task} newTask
         * @return {Promise} local state
         */
        function addTask (newTask) {
            apiAgent.addTask(newTask);
            return localStorageAgent.addTask(newTask);
        }

        /**
         * Updates properties of existing task.
         *
         * @param {string} taskId
         * @param {Object} properties
         * @return {Promise} local state
         */
        function updateTask (taskId, properties) {
            apiAgent.updateTask(taskId, properties);
            return localStorageAgent.updateTask(taskId, properties);
        }

        /**
         * Deletes task.
         *
         * @param {string} taskId
         * @return {Promise} local state
         */
        function deleteTask (taskId) {
            apiAgent.deleteTask(taskId);
            return localStorageAgent.deleteTask(taskId);
        }
        
        /**
         * Gets projects from server.
         *
         * @return {Promise} server state
         */
        function getProjects () {
            return co(function*() {
                var projects = yield apiAgent.getProjects();
                localStorageAgent.setProjects(projects);
                return projects;
            });
        }
        
        /**
         * Gets projects from local storage.
         *
         * @return {Promise} local state
         */
        function getProjectsLocal() {
            return localStorageAgent.getProjects();
        }
        
        /**
         * Adds new project.
         *
         * @param {Project} newProject
         * @return {Promise} local state
         */
        function addProject (newProject) {
            apiAgent.addProject(newProject);
            return localStorageAgent.addProject(newProject);
        }
        
        /**
         * Updates properties of existing project.
         *
         * @param {string} projectId
         * @param {Object} properties
         * @return {Promise} local state
         */
        function updateProject (projectId, properties) {
            apiAgent.updateProject(projectId, properties);
            return localStorageAgent.updateProject(projectId, properties);
        }
        
        /**
         * Deletes project.
         *
         * @param {string} projectId
         * @return {Promise} local state
         */
        function deleteProject (projectId) {
            apiAgent.deleteProject(projectId);
            return localStorageAgent.deleteProject(projectId);
        }

         return {
            getTasks: getTasks,
            getTasksLocal: getTasksLocal,
            addTask: addTask,
            updateTask: updateTask,
            deleteTask: deleteTask,
            
            getProjects: getProjects,
            getProjectsLocal: getProjectsLocal,
            addProject: addProject,
            updateProject: updateProject,
            deleteProject: deleteProject
        };
    });
