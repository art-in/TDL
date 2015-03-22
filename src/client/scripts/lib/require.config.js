/** 
 * Main RequireJs config file.
 */

var require = {
    baseUrl: 'scripts',
    paths: {
        'jquery': 'lib/vendor/jquery-2.1.3',
        'ko': 'lib/vendor/knockout-3.3.0',
        'unobtrusive-knockout': 'lib/vendor/jquery.unobtrusive-knockout',
        'Sortable': 'lib/vendor/Sortable'
    },
    shim: {
        'jquery': {
            exports: ['jQuery']
        },
        'unobtrusive-knockout': {
            deps: ['jquery', 'ko']
        }
    },
    "waitSeconds": 120
};
