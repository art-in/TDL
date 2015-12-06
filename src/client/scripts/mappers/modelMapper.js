/** Data objects to model mapper */
define(['models/Task', 'models/Project'],
    function(Task, Project) {
        
        function mapTask(taskDO) {
            var task = new Task();

            task.id = taskDO.id.toString();
            task.description = taskDO.description.toString();
            task.position = parseInt(taskDO.position, 10);
            task.progress = parseFloat(taskDO.progress);
            task.progressDoneOn = taskDO.progressDoneOn && new Date(taskDO.progressDoneOn); // ISO date string
            task.projectId = taskDO.projectId && taskDO.projectId.toString();

            return task;
        }
        
        function mapTasks(taskDOs) {
            return taskDOs.map(mapTask);
        }
        
        function mapProject(projectDO) {
            var project = new Project();
            
            project.id = projectDO.id.toString();
            project.name = projectDO.name.toString();
            project.tags = projectDO.tags;
            project.color = projectDO.color.toString();
            
            return project;
        }
        
        function mapProjects(projectDOs) {
            return projectDOs.map(mapProject);
        }
        
        return {
            mapTask: mapTask,
            mapTasks: mapTasks,
            
            mapProject: mapProject,
            mapProjects: mapProjects
        };
    });