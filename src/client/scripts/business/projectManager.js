define(['data/storage', 'mappers/modelMapper', 'models/Project'],
    function(storage, modelMapper, Project) {

        /**
         * Gets projects.
         *
         * @param {boolean} [localOnly=false] - get local state only
         * @param {function} callback - first call is local state, second - server state.
         */
        function getProjects (localOnly, cb) {
            typeof localOnly === 'function' && (cb = localOnly, localOnly = false);
            
            storage.getProjects(localOnly, function(error, projectDOs) {
                if (error) { cb(error); return; }
                
                var projects = modelMapper.mapProjects(projectDOs);
                cb(false, projects);
            });
        }
        
        /**
         * Adds new project.
         *
         * @param {string} name
         * @param {string[]} tags
         * @param {string} color
         * @param {function} cb - delivers local state of projects
         */
        function addProject (name, tags, color, cb) {
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
            
            storage.addProject(newProject, function (error, projectDOs) {
                if (error) { cb(error); return; }
                
                var projects = modelMapper.mapProjects(projectDOs);
                cb(false, projects);
            }); 
        }
        
        /**
         * Updates project properties.
         *
         * @param {string} projectId
         * @param {Object} properties
         * @param {function} cb - delivers local state of projects
         */
        function updateProject (projectId, properties, cb) {
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
            
            storage.updateProject(projectId, properties, function(error, projectDOs) {
                if (error) { cb(error); return; }
                
                var projects = modelMapper.mapProjects(projectDOs);
                cb(false, projects);
            });
        }
        
        /**
         * Deletes project.
         *
         * @param {string} projectId
         * @param {function} cb - delivers local state of projects
         */
        function deleteProject (projectId, cb) {
            if (!projectId) throw Error('Invalid project ID: ' + projectId);
            
            storage.deleteProject(projectId, function (error, projectDOs) {
                if (error) { cb(error); return; }
                
                var projects = modelMapper.mapProjects(projectDOs);
                cb(false, projects);
            });
        }

        return {
            getProjects: getProjects,
            addProject: addProject,
            updateProject: updateProject,
            deleteProject: deleteProject
        };
    });