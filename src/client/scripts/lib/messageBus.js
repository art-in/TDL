define(function() {
    
    var eventTypes = [];
    
    function publish(eventType, data) {
        if(!eventTypes.some(function (type) { return type === eventType; }))
            console.warn('Publishing event with no subscribers: ' + eventType + ' (' + JSON.stringify(data) + ')');
        
        document.dispatchEvent(new CustomEvent(eventType, {'detail': data}));
    }
    
    function subscribe(eventType, handler) {
        eventTypes.push(eventType);
        
        document.addEventListener(eventType, function(e) {
            handler(e.detail);
        });
    }
    
    return {
        publish: publish,
        subscribe: subscribe
    };
});
