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
        if (localStorage.requests === undefined) {
            localStorage.requests = '[]';
        }

        this.requests = JSON.parse(localStorage.requests);

        this.currentRequest = null;

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
            if (xhr.readyState == XMLHttpRequest.DONE) {
                logResponse(request.url, xhr);

                if (xhr.status === 0 || 
                    xhr.status === 502 || // Bad Gateway
                    xhr.status === 503) { // Service Unavailable
                    // Connection failed. Retry later.
                    setTimeout(trySend.bind(this), this.retryDelay);
                    return;
                }

                if (xhr.status === 500) { // Internal Server Error
                    // Bad thing happend on server. Go to next request.
                    cb(true);
                    return;
                }

                var responseData = xhr.responseText;

                if (responseData.length > 0)
                    try {
                        JSON.parse(responseData);
                    } catch (e) {
                        // Response corrupted. Retry now.
                        console.log('Response corrupted. Retring now.');
                        setTimeout(trySend.bind(this), 1);
                        return;
                    }

                cb(false, responseData);
            }
        }.bind(this);

        var onError = function () {
            console.log(xhr.statusText);
            console.groupEnd();
        };

        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = onStateChange;
        xhr.onerror = onError;

        xhr.open("GET", request.url, true);
        xhr.send(null);

        console.log('GET ' + request.url);
    }

    function removeRequest(request) {
        var requestIdx = this.requests.indexOf(request);
        if (requestIdx === -1) throw Error('Invalid request to remove from queue');

        this.requests.splice(requestIdx, 1);
    }

    function preserve() {
        localStorage.requests = JSON.stringify(this.requests);
    }

    function logResponse(url, xhr) {
        if (xhr.status === 0 || 
            xhr.status === 502 ||
            xhr.status === 503) {
            return;
        }

        if (xhr.status === 500) {
            console.error('GET ' + url + ' SERVER FAILED [' + xhr.status + '] ("' + xhr.responseText + '")');
            return;
        }

        var logHeader;

        if (xhr.responseText.length === 0) {
            logHeader = 'GET ' + url + ' DONE [' + xhr.status + '] (response empty)';
        } else if (xhr.responseText.length <= 100) {
            logHeader = 'GET ' + url + ' DONE [' + xhr.status + '] (response: ' + xhr.responseText + ')';
        } else {
            logHeader = 'GET ' + url + ' DONE [' + xhr.status + '] (response length: ' + xhr.responseText.length + ')';
        }

        console.groupCollapsed(logHeader);
        console.log(xhr.responseText);
        console.groupEnd();
    }

    return RequestQueue;
});