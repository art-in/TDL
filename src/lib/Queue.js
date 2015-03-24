/**
 * The functions queue,
 * which executed sequentially, one after another.
 *
 * @param logEnabled
 * @constructor
 */
function Queue(logEnabled) {
    this.jobQueue = [];
    this.currentJob = null;

    this.logEnabled = logEnabled;
}

/**
 * Pushes job to the queue.
 *
 * @example
 * queue.push(function(cb) {
 *      // Job 1
 *      cb();
 * })
 * .push(function(cb) {
 *      // Job 2
 *      cb();
 * });
 *
 * @example
 * function(cb) {
     *  queue.push(cb, function(cb) {
     *       some.async.method(function() {
     *           cb();
     *       });
     *  }
     * }
 *
 * @param {function} [jobCb] - callback that should be called after job done
 * @param {function} job
 */
Queue.prototype.push = function (jobCb, job) {
    // Check arguments
    if (arguments.length === 0 || arguments.length > 2)
        throw new Error('Invalid arguments count');
    else if
        ((arguments.length === 1 && typeof arguments[0] !== 'function') ||
        (arguments.length === 2 && typeof arguments[1] !== 'function'))
        throw new Error('Invalid arguments type');

    if (arguments.length == 1) {
        job = arguments[0];
        jobCb = undefined;
    }

    log.call(this, 'Queueing job "' + job.name + '" (queue length = ' + (this.jobQueue.length) + ')');

    // Add method call to the queue
    this.jobQueue.push(function () {
        log.call(this, 'Executing "' + job.name + '" (queue length = ' + (this.jobQueue.length) + ')');
        logTime.call(this, 'Job "' + job.name + '" finished');

        job(function () {
            logTimeEnd.call(this, 'Job "' + job.name + '" finished');

            // Execute callback of currently running job
            jobCb && jobCb.apply(null, arguments);

            // Call next method from the queue
            next.call(this);
        }.bind(this));
    }.bind(this));

    // Call job immediately if no method currently running
    if (this.currentJob === null) {
        log.call(this, 'Empty queue HIT');
        next.call(this);
    }

    return {push: this.push.bind(this)};
};

function next() {
    // Pop & execute next job
    if (this.jobQueue.length === 0) {
        this.currentJob = null;
    } else {
        this.currentJob = this.jobQueue.shift();
        this.currentJob();
    }
}

//region Logging

function log () {
    this.logEnabled && console.log.apply(console, arguments);
}

function logTime () {
    this.logEnabled && console.time.apply(console, arguments);
}

function logTimeEnd () {
    this.logEnabled && console.timeEnd.apply(console, arguments);
}

//endregion

exports.Queue = Queue;