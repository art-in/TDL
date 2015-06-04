define(['co', 'data/storage', 'mappers/modelMapper', 'models/Project'],
    function(co, storage, modelMapper, Project) {

        //region Public
        
        /**
         * Gets projects.
         *
         * @return {object} local and server state promises
         */
        function getProjects () {
            return {
                local: co.wrap(function*() { 
                    return storage.getProjectsLocal().then(modelMapper.mapProjects);
                }),
                server: co.wrap(function*() {
                    return storage.getProjects().then(modelMapper.mapProjects);
                })
            };
        }
        
        /**
         * Adds new project.
         *
         * @param {string} name
         * @param {string[]} tags
         * @param {string} color
         * @return {Promise}
         */
        function addProject (name, tags, color) {
            return co(function*() {
                if (!name)
                    throw new Error('Invalid name: ' + name);
                
                if (!tags || tags.length === undefined)
                    throw new Error('Invalid tags: ' + tags);
                
                if (!color)
                    throw new Error('Invalid color: ' + color);
    
                var newProject = new Project();
                newProject.name = name;
                newProject.tags = tags || [];
                newProject.color = color;
                
                yield storage.addProject(newProject);
            });
        }
        
        /**
         * Updates project properties.
         *
         * @param {string} projectId
         * @param {Object} properties
         * @return {Promise}
         */
        function updateProject (projectId, properties) {
            return co(function*() {
                if (!projectId) throw Error('Invalid project ID: ' + projectId);
                
                // Validate properties
                var propertyNames = Object.getOwnPropertyNames(properties);
                if (propertyNames.length === 0) {
                    throw Error('No project properties to update');
                }
    
                var validPropertyNames = Object.getOwnPropertyNames(new Project());
                propertyNames.forEach(function (prop) {
                    if (validPropertyNames.indexOf(prop) === -1) {
                        throw Error('Unknown property to update: ' + prop);
                    }
                });
                
                yield storage.updateProject(projectId, properties);
            });
        }
        
        /**
         * Deletes project.
         *
         * @param {string} projectId
         * @return {Promise}
         */
        function deleteProject (projectId) {
            return co(function*() {
                if (!projectId) throw Error('Invalid project ID: ' + projectId);
                yield storage.deleteProject(projectId);
            });
        }
        
        //endregion

        return {
            getProjects: getProjects,
            addProject: addProject,
            updateProject: updateProject,
            deleteProject: deleteProject
        };
    });