/**
 * Main client-side module.
 */
define('client', 
      ['ko',
       'lib/messageBus',
       'viewmodels/binder',
       'viewmodels/gate',
       'viewmodels/AppViewModel'], 
    function (ko, messageBus, binder, gate, AppViewModel) {
    
    // Create root view model
    var appVM = new AppViewModel();
    
    binder.setupBindings();
    gate.setupHandlers(appVM.state);
    
    messageBus.publish('loading');
    
    ko.applyBindings(appVM);
});