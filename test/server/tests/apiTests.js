var expect = require('../../node_modules/chai/index').expect,
    server = require('../server'),
    db = require('../db');

describe('API', function() {

    var dbContext;

    //region Teardown

    before(function () {
        return db.connect().then(function (context) {
            dbContext = context;
        });
    });

    beforeEach(function () {
        return dbContext.dropDatabase();
    });

    after(function () {
        dbContext.close();
    });

    //endregion

    describe('getTasks', function () {

        it('returns array', function () {
            return server.request('api/getTasks')
                .then(function (data) {
                    var tasks = JSON.parse(data.toString());
                    expect(tasks).to.be.an.instanceof(Array);
                });
        });

        it('returns 0 tasks when 0 tasks in DB', function () {
            var tasksActual;

            return server.request('api/getTasks')
                .then(function (data) {
                    tasksActual = JSON.parse(data.toString());
                    expect(tasksActual).to.have.length(0);
                });
        });

        it('returns 1 task when 1 task in DB', function () {
            var task = {
                id: 'task1'
            };

            return dbContext
                .collection(db.taskCollection)
                .then(function (col) {
                    return col.insert(task);
                })
                .then(function () {
                    return server.request('api/getTasks');
                })
                .then(function (data) {
                    var tasksActual = JSON.parse(data.toString());

                    expect(tasksActual).to.have.length(1);
                    expect(tasksActual[0].id).to.equal('task1');
                });
        });

    });

});
