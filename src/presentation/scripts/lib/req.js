/** 
 * Tiny modularizer of js to bring izolation and namespace-based module naming. 
 */
(function(global){
    /**
     * Defines new module.
     *
     * @param {string} [namespace] - Target namespace. If not defined - create 
     *                               unnamed module without ability to export.
     * @param {Function} moduleFunc - Module function wrapper.
     * 
     * @example
     * // Create new module in the 'app.core' namespace and export something
     * define('app.core', function(exports, require) {
     *      var transport = require('app.core.transport');
     *      exports.Initializer = function() { ... }
     * });
     *
     * @example
     * // Create new unnamed module which does not need export anything
     * define(function(require) {
     *      var Initializer = require('app.core.Initializer');
     *      // ...
     * });
     */
    function define () {
        // Check arguments.
        if (typeof arguments[0] === 'string' 
         && typeof arguments[1] === 'function') {
            var namespace = arguments[0];
            var moduleFunc = arguments[1];
        } else if (typeof arguments[0] === 'function') {
            moduleFunc = arguments[0];
        } else {
            throw new Error('Invalid arguments');
        }
        
        // Init module.
        if (!!namespace) {
            // Named module with export.
            var nsObj = require(namespace, true);
            moduleFunc(nsObj, require);
        } else {
            // Unnamed module.
            moduleFunc(require);
        }
    }
    
    /** 
     * Returns existing namespace or creates new one.
     *
     * @param {string} namespace - The namespace (e.g. 'my.namespace').
     * @param {bool} [createIfNotFound=false] - Indicates whether create new leafs in
     *                                          namespace tree if not found or throw error.
     * 
     * @example
     * // Create new namespace
     * require('app.core', true);
     *
     * // Add deeper leaf to existing namespace tree
     * // without clearing parent namespaces
     * require('app.core.transport', true);
     *
     * @example
     * // Get existing namespace
     * var core = require('app.core');
     * var transport = require('app.core.transport');
     */
    function require (namespace, createIfNotFound) {
        var nsParentArr = namespace.split('.');
        var nsCurrentStr = nsParentArr.pop();
        var nsParentStr = nsParentArr.join('.');
        
        // Get parent namespace
        var target = nsParentStr === '' ? global : require(nsParentStr, createIfNotFound);
        
        // Create (or get existing) namespace
        if (!target[nsCurrentStr]) { 
            if (createIfNotFound) {
                target[nsCurrentStr] = {};
            } else {
                throw new Error('Namespace was not found: ' + namespace);
            }
        }
        
        return target[nsCurrentStr];
    }
    
    global.define = define;
})(this);
