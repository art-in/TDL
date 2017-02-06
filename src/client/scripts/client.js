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
    
    // create root view model
    var appVM = new AppViewModel();
    
    // setup handlers
    binder.setupBindings();
    gate.setupHandlers(appVM.state);
    
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            messageBus.publish('appShown');
        }
    });

    // init
    messageBus.publish('appInit');
    
    ko.applyBindings(appVM);
});