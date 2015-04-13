/** Interface to business layer */
define(['business/taskManager', 'business/projectManager'],
    function(taskManager, projectManager) {
            
            var exports = {};
            
            // Combine managers
            for (var exp in taskManager) {
                exports[exp] = taskManager[exp];
            }
            
            for (exp in projectManager) {
                exports[exp] = projectManager[exp];
            }
            
            return exports;
    });