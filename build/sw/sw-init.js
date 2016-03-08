/**
 * Initializes service workers on the page
 */

var workers = ['sw-cache.js'];

if ('serviceWorker' in navigator) {
  workers.forEach(function(worker) {
    navigator.serviceWorker.register(worker)
      .then(function(reg) {
        if(reg.installing) {
          console.log(worker + ': installing');
        } else if(reg.waiting) {
          console.log(worker + ': installed');
        } else if(reg.active) {
          console.log(worker + ': active');
        }
      })
      .catch(function(error) {
        console.error(worker + ': registration failed with \n' + error);
      });
  })

}