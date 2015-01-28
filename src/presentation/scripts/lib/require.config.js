requirejs.config({
    baseUrl: 'scripts',
    paths: {
        'jquery': 'lib/vendor/jquery-2.1.3',
        'ko': 'lib/vendor/knockout-3.2.0',
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
    } 
});

define(['client']);