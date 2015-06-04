define(function() {

    /**
     * HTTP requests queue, which guarantees:
     * - sequential sending (next request sent after previous is fully done),
     * - delivery to the server (if network error occured - retry process started)
     *   even after page reload (all requests are preserved in local storage).
     *
     * @example
     * var queue = new RequestQueue();
     *
     * queue.push('api/methodA', {param1: '1', param2: '2'}, cbA);
     * queue.push('api/methodB', null, cbB);
     *
     * @constructor
     */
    function RequestQueue() {

        // Load preserved requests
        !localStorage._requests && (localStorage._requests = '[]');

        this.requests = JSON.parse(localStorage._requests);

        this.currentRequest = null;
        this.xhr = new XMLHttpRequest();

        next.call(this);
    }

    RequestQueue.prototype.retryDelay = 300000; // 5 minutes

    /**
     * Pushes request to the queue.
     *
     * @param requestOpts
     * @param requestOpts.url
     * @param requestOpts.params
     * @param requestOpts.tail - if on its turn there are some more requests in the queue,
     *                           it will not be sent, but moved to the tail instead.
     * @param [cb]
     */
    RequestQueue.prototype.push = function (requestOpts, cb) {

        if (!requestOpts.url) throw new Error('Invalid arguments');

        requestOpts.params = requestOpts.params || null;

        // Compose request parameters
        var url = requestOpts.url;

        if (requestOpts.params) {
            url += "?";

            var paramNames = Object.getOwnPropertyNames(requestOpts.params);
            for (var i = 0; i < paramNames.length; i++) {
                var paramName = paramNames[i];

                var paramJSON = JSON.stringify(requestOpts.params[paramName]);
                url += paramName + "=" + encodeURIComponent(paramJSON);

                i != paramNames.length - 1 && (url += "&");
            }
        }

        var request = {
            callback: cb,
            url: url,
            tail: requestOpts.tail
        };

        // Preserve it
        this.requests.push(request);
        preserve.call(this);

        next.call(this);

        return {push: this.push.bind(this)};
    };

    function next () {
        if (this.currentRequest !== null) return;

        if (this.requests.length === 0) {
            this.currentRequest = null;
            return;
        }

        this.currentRequest = this.requests[0];

        trySend.call(this);
    }

    function trySend() {
        if (this.currentRequest === null) throw new Error('Current request is empty');

        if (this.currentRequest.tail && this.requests.length > 0 &&
            !this.requests.every(function(r) { return r.tail; })) {

            removeRequest.call(this, this.currentRequest);
            this.requests.push(this.currentRequest);
            preserve.call(this);

            this.currentRequest = null;
            next.call(this);
            return;
        }

        send.call(this, this.currentRequest, function () {
            this.currentRequest.callback &&
            this.currentRequest.callback.apply(null, arguments);

            removeRequest.call(this, this.currentRequest);
            preserve.call(this);

            this.currentRequest = null;
            next.call(this);
        }.bind(this));
    }

    /**
     * Sends request to the server.
     *
     * @param {Object} request
     * @param {function} cb - receives error and response text
     */
    function send (request, cb) {

        var onStateChange =  function () {
            if (this.xhr.readyState == XMLHttpRequest.DONE) {
                logResponse.call(this, request.url);

                if (this.xhr.status === 0 || 
                    this.xhr.status === 502 || // Bad Gateway
                    this.xhr.status === 503) { // Service Unavailable
                    // Connection failed. Retry later.
                    setTimeout(trySend.bind(this), this.retryDelay);
                    return;
                }
                
                if (this.xhr.status === 404 || // Not Found
                    this.xhr.status === 500) { // Internal Server Error
                    // Bad thing happend on server. 
                    // Return error and go to next request.
                    cb(new Error(this.xhr.responseText+' ['+this.xhr.status+']'));
                    return;
                }

                var responseText = this.xhr.responseText;

                if (responseText.length > 0)
                    try {
                        JSON.parse(responseText);
                    } catch (e) {
                        // Response corrupted. Retry now.
                        console.log('Response corrupted. Retring now.');
                        setTimeout(trySend.bind(this), 1);
                        return;
                    }

                cb(false, responseText);
            }
        };

        this.xhr.onreadystatechange = onStateChange.bind(this);
        
        if (this.xhr.readyState === XMLHttpRequest.HEADERS_RECEIVED ||
            this.xhr.readyState === XMLHttpRequest.LOADING) {
            console.warn('Previous request was not completed');
        }
        
        this.xhr.open("GET", request.url, true);
        this.xhr.send(null);

        console.log('GET ' + request.url);
    }

    function removeRequest(request) {
        var requestIdx = this.requests.indexOf(request);
        if (requestIdx === -1) throw Error('Invalid request to remove from queue');

        this.requests.splice(requestIdx, 1);
    }

    function preserve() {
        localStorage._requests = JSON.stringify(this.requests);
    }

    function logResponse(url) {
        var responseText = this.xhr.responseText;
        var responseStatus = this.xhr.status;
        
        if (responseStatus === 0 || 
            responseStatus === 502 ||
            responseStatus === 503) {
            return;
        }
        
        var maxUrlLengthBeforeNewline = 120;
        var maxResponseTextBeforeCollapse = 100;
        
        if (responseStatus === 500) {
            console.error('GET ' + url + ' ' + (url.length > maxUrlLengthBeforeNewline ? '\r\n' : '') +
                'SERVER FAILED [' + responseStatus + '] ("' + responseText + '")');
            return;
        }

        var logHeader;

        if (responseText.length === 0) {
            logHeader = 'GET ' + url + ' ' + (url.length > maxUrlLengthBeforeNewline ? '\r\n' : '') + 
                'DONE [' + responseStatus + '] (response empty)';
        } else if (responseText.length <= maxResponseTextBeforeCollapse) {
            logHeader = 'GET ' + url + ' ' + (url.length > maxUrlLengthBeforeNewline ? '\r\n' : '') +
                'DONE [' + responseStatus + '] (response: ' + responseText + ')';
        } else {
            logHeader = 'GET ' + url + ' ' + (url.length > maxUrlLengthBeforeNewline ? '\r\n' : '') +
                'DONE [' + responseStatus + '] (response length: ' + responseText.length + ')';
        }

        console.groupCollapsed(logHeader);
        console.log(responseText);
        console.groupEnd();
    }

    return RequestQueue;
});