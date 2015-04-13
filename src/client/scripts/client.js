/**
 * Main client-side module.
 */
define('client', 
      ['ko',
       'viewmodels/binder',
       'viewmodels/gate',
       'viewmodels/AppViewModel'], 
    function (ko, binder, gate, AppViewModel) {
    
    // Create root view model
    var appVM = new AppViewModel();
    
    binder.setupBindings();
    gate.setupHandlers(appVM.state);
    
    appVM.loadState();
    
    ko.applyBindings(appVM);
});