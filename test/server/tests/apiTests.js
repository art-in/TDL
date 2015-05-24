var expect = require('../../node_modules/chai/index').expect,
    server = require('../server'),
    db = require('../db'),
    Promise = require('../../node_modules/bluebird').Promise,
    querystring = require('querystring');

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
        return dbContext.close();
    });

    //endregion

    context('getTasks', function () {

        it('should return array', function () {
            return server.request('api/getTasks')
                .then(function (data) {
                    var tasks = JSON.parse(data.toString());
                    expect(tasks).to.be.an.instanceof(Array);
                    expect(tasks).to.have.length(0);
                });
        });

        it('should return existing task from the storage', function () {
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

        it('should return tasks sorted by position', function () {
            var task1 = { id: 'task1', position: 1 };
            var task2 = { id: 'task2', position: 0 };
            var task3 = { id: 'task3', position: 2 };

            return dbContext
                .collection(db.taskCollection)
                .then(function (col) {
                    return Promise.all([
                        col.insert(task1),
                        col.insert(task2),
                        col.insert(task3)])
                })
                .then(function () {
                    return server.request('api/getTasks')
                })
                .then(function (data) {
                    var tasks = JSON.parse(data);
                    tasks.forEach(function (task, taskIdx) {
                        expect(task.position).to.equal(taskIdx);
                    })
                })
        });

        it('should not return _id field in tasks', function () {

            var task1 = { id: 'myShortId1', _id: 'long_database_id_1klhahffqwef'};
            var task2 = { id: 'myShortId2', _id: 'long_database_id_2klhahffqwef'};
            var task3 = { id: 'myShortId3', _id: 'long_database_id_3klhahffqwef'};

            return dbContext
                .collection(db.taskCollection)
                .then(function (col) {
                    return Promise.all([
                        col.insert(task1),
                        col.insert(task2),
                        col.insert(task3)])
                })
                .then(function () {
                    return server.request('api/getTasks');
                })
                .then(function (data) {
                    var tasks = JSON.parse(data);
                    tasks.forEach(function (task) {
                        expect(task).not.to.have.ownProperty('_id');
                    })
                })
        });

    });

    context('addTask', function () {

        it('should add new task to the storage', function () {
            var expectedTask = {
                id: 'myTask',
                description: 'Description for task',
                position: 0,
                progress: 1
            };

            return server
                .request('api/addTask?newTask=' + encodeURIComponent(JSON.stringify(expectedTask)))
                .then(function () {
                    return dbContext.collection(db.taskCollection);
                })
                .then(function (col) {
                    return col.find({}, {_id: 0}).toArray();
                })
                .then(function (tasks) {
                    expect(tasks).to.have.length(1);
                    expect(tasks[0]).to.deep.equal(expectedTask);
                });
        });

        it('should fail with status 500 if new task is not specified', function () {
            return server.request({
                path: 'api/addTask',
                resolveWithFullResponse: true
            })
                .then(function (response) {
                    throw response;
                })
                .catch(function (response) {
                    expect(response.statusCode).to.equal(500);
                    expect(response.error).to.equal('New task should be specified');
                });
        });

        it('should shift existing tasks below one position down', function () {
            var existingTasks = [
                { id: 'task1', position: 0 },
                { id: 'task2', position: 1 },
                { id: 'task3', position: 2 }
            ];

            var newTask = { id: 'task4', position: 1 };

            var expectedTasks = [
                { id: 'task1', position: 0 },
                { id: 'task4', position: 1 }, // ← inserted
                { id: 'task2', position: 2 }, // ↓ shifted
                { id: 'task3', position: 3 }  // ↓ shifted
            ];

            return dbContext
                .collection(db.taskCollection)
                .then(function (col) {
                    return Promise.all(existingTasks.map(function (task) {
                        return col.insert(task);
                    }));
                })
                .then(function () {
                    return server.request('api/addTask?newTask=' + encodeURIComponent(JSON.stringify(newTask)));
                })
                .then(function () {
                    return dbContext.collection(db.taskCollection);
                })
                .then(function (col) {
                    return col.find({}, {_id: 0}).toArray();
                })
                .then(function (tasks) {
                    expect(tasks).to.deep.include.members(expectedTasks);
                });
        });

    });

    context('updateTask', function () {

        it('should update existing task in the storage', function () {
            var existingTask = {
                id: 'myTask',
                description: 'Description for task',
                position: 0,
                progress: 1
            };

            var updateProperties = {
                description: 'Description for task UPDATED',
                position: 1,
                progress: 0
            };

            var expectedTask = {
                id: 'myTask',
                description: 'Description for task UPDATED',
                position: 1,
                progress: 0
            };

            return dbContext
                .collection(db.taskCollection)
                .then(function (col) {
                    return col.insert(existingTask);
                })
                .then(function () {
                    return server.request('api/updateTask?' +
                        'taskId=' + encodeURIComponent(JSON.stringify('myTask')) + '&' +
                        'properties=' + encodeURIComponent(JSON.stringify(updateProperties)));
                })
                .then(function () {
                    return dbContext.collection(db.taskCollection);
                })
                .then(function (col) {
                    return col.find({}, {_id: 0}).toArray();
                })
                .then(function (tasks) {
                    expect(tasks).to.have.length(1);
                    expect(tasks[0]).to.deep.equal(expectedTask);
                })
                .catch(function (response) {
                    throw response;
                })
        });

        it('should fail with status 500 if task ID is not specified', function () {
            return server.request({
                path: 'api/updateTask?properties=' + encodeURIComponent(JSON.stringify({})),
                resolveWithFullResponse: true
            })
                .then(function (response) {
                    throw response;
                })
                .catch(function (response) {
                    expect(response.statusCode).to.equal(500);
                    expect(response.error).to.equal('Task ID should be specified');
                });
        });

        it('should fail with status 500 if properties is not specified', function () {
            return server.request({
                path: 'api/updateTask?taskId=' + encodeURIComponent(JSON.stringify('taskId')),
                resolveWithFullResponse: true
            })
                .then(function (response) {
                    throw response;
                })
                .catch(function (response) {
                    expect(response.statusCode).to.equal(500);
                    expect(response.error).to.equal('Properties should be specified');
                });
        });

        it('should fail with status 500 if task to update was not found', function () {
            var updateProperties = {
                description: 'Description for task UPDATED',
                position: 1,
                progress: 0
            };

            return server
                .request({
                    path: 'api/updateTask?' +
                        'taskId=' + encodeURIComponent(JSON.stringify('myTask')) + '&' +
                        'properties=' + encodeURIComponent(JSON.stringify(updateProperties)),
                    resolveWithFullResponse: true
                })
                .then(function (response) {
                    throw response;
                })
                .catch(function (response) {
                    expect(response.statusCode).to.be.equal(500);
                });
        });

        it('should shift existing tasks below one position down', function () {
            var existingTasks = [
                { id: 'task1', position: 0 },
                { id: 'task2', position: 1 },
                { id: 'task3', position: 2 }
            ];

            var updateTaskId = 'task2';
            var updateProperties = { position: 2 };

            var expectedTasks = [
                { id: 'task1', position: 0 },
                { id: 'task3', position: 1 }, // ↑ shifted
                { id: 'task2', position: 2 }  // ← updated
            ];

            return dbContext
                .collection(db.taskCollection)
                .then(function (col) {
                    return Promise.all(existingTasks.map(function (task) {
                        return col.insert(task);
                    }));
                })
                .then(function () {
                    return server.request('api/updateTask?' +
                        'taskId=' + encodeURIComponent(JSON.stringify(updateTaskId)) + '&' +
                        'properties=' + encodeURIComponent(JSON.stringify(updateProperties)));
                })
                .then(function () {
                    return dbContext.collection(db.taskCollection);
                })
                .then(function (col) {
                    return col.find({}, {_id: 0}).toArray();
                })
                .then(function (tasks) {
                    expect(tasks).to.deep.include.members(expectedTasks);
                });
        });

    });

    context('deleteTask', function () {

        it('should delete existing task', function () {
            var existingTask = { id: 'myTask'};

            return dbContext
                .collection(db.taskCollection)
                .then(function (col) {
                    return col.insert(existingTask);
                })
                .then(function () {
                    return server
                        .request('api/deleteTask?taskId=' + encodeURIComponent(JSON.stringify('myTask')));
                })
                .then(function () {
                    return dbContext.collection(db.taskCollection);
                })
                .then(function (col) {
                    return col.find({}).toArray();
                })
                .then(function (tasks) {
                    expect(tasks).to.have.length(0);
                });
        });

        it('should shift existing tasks below one position up', function () {
            var existingTasks = [
                { id: 'task1', position: 0 },
                { id: 'task2', position: 1 },
                { id: 'task3', position: 2 }
            ];

            var taskToDelete = 'task2';
            var expectedTasks = [
                { id: 'task1', position: 0 },
                { id: 'task3', position: 1 } // ↑ shifted
            ];

            return dbContext
                .collection(db.taskCollection)
                .then(function (col) {
                    return Promise.all(existingTasks.map(function (task) {
                        return col.insert(task);
                    }));
                })
                .then(function () {
                    return server.request('api/deleteTask?taskId=' + encodeURIComponent(JSON.stringify(taskToDelete)));
                })
                .then(function () {
                    return dbContext.collection(db.taskCollection);
                })
                .then(function (col) {
                    return col.find({}, {_id: 0}).toArray();
                })
                .then(function (tasks) {
                    expect(tasks).to.deep.include.members(expectedTasks);
                });
        });

        it('should fail with status 500 if task ID is not specified', function () {
            return server
                .request({
                    path: 'api/deleteTask',
                    resolveWithFullResponse: true
                })
                .then(function (response) {
                    throw response;
                })
                .catch(function (response) {
                    expect(response.statusCode).to.equal(500);
                    expect(response.error).to.equal('Task ID should be specified');
                });
        });

        it('should fail with status 500 if task to delete was not found', function () {
            return server
                .request({
                    path: 'api/deleteTask?taskId=' + encodeURIComponent(JSON.stringify('myTask')),
                    resolveWithFullResponse: true
                })
                .then(function (response) {
                    throw response;
                })
                .catch(function (response) {
                    expect(response.statusCode).to.equal(500);
                });
        });

    });

    context('getProjects', function () {

        it('should return array', function () {
            return server.request('api/getProjects')
                .then(function (data) {
                    var projects = JSON.parse(data.toString());
                    expect(projects).to.be.an.instanceof(Array);
                    expect(projects).to.have.length(0);
                });
        });

        it('should return existing project from the storage', function () {
            var project = {
                id: 'project1'
            };

            return dbContext
                .collection(db.projectCollection)
                .then(function (col) {
                    return col.insert(project);
                })
                .then(function () {
                    return server.request('api/getProjects');
                })
                .then(function (data) {
                    var projectsActual = JSON.parse(data.toString());

                    expect(projectsActual).to.have.length(1);
                    expect(projectsActual[0].id).to.equal('project1');
                });
        });

        it('should not return _id field in projects', function () {

            var project1 = { id: 'myShortId1', _id: 'long_database_id_1klhahffqwef'};
            var project2 = { id: 'myShortId2', _id: 'long_database_id_2klhahffqwef'};
            var project3 = { id: 'myShortId3', _id: 'long_database_id_3klhahffqwef'};

            return dbContext
                .collection(db.projectCollection)
                .then(function (col) {
                    return Promise.all([
                        col.insert(project1),
                        col.insert(project2),
                        col.insert(project3)])
                })
                .then(function () {
                    return server.request('api/getProjects');
                })
                .then(function (data) {
                    var projects = JSON.parse(data);
                    projects.forEach(function (project) {
                        expect(project).not.to.have.ownProperty('_id');
                    })
                })
        });

    });

    context('addProject', function () {

        it('should add new project to the storage', function () {
            var newProject = {
                id: 'myProject',
                name: 'Description for project',
                tags: ['tag1'],
                color: '#000'
            };

            return server
                .request('api/addProject?newProject=' + encodeURIComponent(JSON.stringify(newProject)))
                .then(function () {
                    return dbContext.collection(db.projectCollection);
                })
                .then(function (col) {
                    return col.find({}, {_id: 0}).toArray();
                })
                .then(function (projects) {
                    expect(projects).to.have.length(1);
                    expect(projects[0]).to.deep.equal(newProject);
                });
        });

        it('should fail with status 500 if new project is not specified', function () {
            return server.request({
                path: 'api/addProject',
                resolveWithFullResponse: true
            })
                .then(function (response) {
                    throw response;
                })
                .catch(function (response) {
                    expect(response.statusCode).to.equal(500);
                    expect(response.error).to.equal('New project should be specified');
                });
        });

    });

    context('updateProject', function () {

        it('should update existing project in the storage', function () {
            var existingProject = {
                id: 'myProject',
                name: 'Description for project',
                tags: ['tag1'],
                color: '#000'
            };

            var projectToUpdate = 'myProject';
            var updateProperties = {
                name: 'Description for project UPDATED',
                tags: ['tag1', 'UPDATED'],
                color: '#FFF'
            };

            var expectedProject = {
                id: 'myProject',
                name: 'Description for project UPDATED',
                tags: ['tag1', 'UPDATED'],
                color: '#FFF'
            };

            return dbContext
                .collection(db.projectCollection)
                .then(function (col) {
                    return col.insert(existingProject);
                })
                .then(function () {
                    return server.request('api/updateProject?' +
                        'projectId=' + encodeURIComponent(JSON.stringify(projectToUpdate)) + '&' +
                        'properties=' + encodeURIComponent(JSON.stringify(updateProperties)));
                })
                .then(function () {
                    return dbContext.collection(db.projectCollection);
                })
                .then(function (col) {
                    return col.find({}, {_id: 0}).toArray();
                })
                .then(function (projects) {
                    expect(projects).to.have.length(1);
                    expect(projects[0]).to.deep.equal(expectedProject);
                })
                .catch(function (response) {
                    throw response;
                })
        });

        it('should fail with status 500 if project ID is not specified', function () {
            return server.request({
                path: 'api/updateProject?properties=' + encodeURIComponent(JSON.stringify({})),
                resolveWithFullResponse: true
            })
                .then(function (response) {
                    throw response;
                })
                .catch(function (response) {
                    expect(response.statusCode).to.equal(500);
                    expect(response.error).to.equal('Project ID should be specified');
                });
        });

        it('should fail with status 500 if properties is not specified', function () {
            return server.request({
                path: 'api/updateProject?projectId=' + encodeURIComponent(JSON.stringify('projectId')),
                resolveWithFullResponse: true
            })
                .then(function (response) {
                    throw response;
                })
                .catch(function (response) {
                    expect(response.statusCode).to.equal(500);
                    expect(response.error).to.equal('Properties should be specified');
                });
        });

    });

    context('deleteProject', function () {

        it('should delete existing project', function () {
            var existingProject = { id: 'myProject'};

            return dbContext
                .collection(db.projectCollection)
                .then(function (col) {
                    return col.insert(existingProject);
                })
                .then(function () {
                    return server
                        .request('api/deleteProject?projectId=' + encodeURIComponent(JSON.stringify('myProject')));
                })
                .then(function () {
                    return dbContext.collection(db.projectCollection);
                })
                .then(function (col) {
                    return col.find({}).toArray();
                })
                .then(function (projects) {
                    expect(projects).to.have.length(0);
                });
        });

        it('should fail with status 500 if project ID is not specified', function () {
            return server
                .request({
                    path: 'api/deleteProject',
                    resolveWithFullResponse: true
                })
                .then(function (response) {
                    throw response;
                })
                .catch(function (response) {
                    expect(response.statusCode).to.equal(500);
                    expect(response.error).to.equal('Project ID should be specified');
                });
        });

    });

});
