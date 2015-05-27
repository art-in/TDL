var expect = require('../../node_modules/chai/index').expect,
    co = require('../../node_modules/co'),
    Promise = require('../../node_modules/bluebird').Promise,
    server = require('../server'),
    db = require('../db');

describe('API', function() {

    var dbContext;

    //region before/after

    before(co.wrap(function*(){
        dbContext = yield db.connect();
    }));

    beforeEach(co.wrap(function*(){
        yield dbContext.dropDatabase();
    }));

    after(co.wrap(function*(){
        yield dbContext.close();
    }));

    //endregion

    context('getTasks', function () {

        it('should return array', co.wrap(function*(){
            var data = yield server.request('api/getTasks');
            
            var tasks = JSON.parse(data.toString());
            
            expect(tasks).to.be.an.instanceof(Array);
            expect(tasks).to.have.length(0);
        }));

        it('should return existing task from the storage', co.wrap(function*(){
            var task = {
                id: 'task1'
            };

            var col = yield dbContext.collection(db.taskCollection);
            yield col.insert(task);
            
            var data = yield server.request('api/getTasks');
            
            var tasksActual = JSON.parse(data.toString());

            expect(tasksActual).to.have.length(1);
            expect(tasksActual[0].id).to.equal('task1');
        }));

        it('should return tasks sorted by position', co.wrap(function*(){
            var task1 = { id: 'task1', position: 1 };
            var task2 = { id: 'task2', position: 0 };
            var task3 = { id: 'task3', position: 2 };

            var col = yield dbContext.collection(db.taskCollection);
            
            yield Promise.all([
                col.insert(task1),
                col.insert(task2),
                col.insert(task3)
            ]);
            
            var data = yield server.request('api/getTasks');
            var tasks = JSON.parse(data);
            
            tasks.forEach(function (task, taskIdx) {
                expect(task.position).to.equal(taskIdx);
            });
        }));

        it('should not return _id field in tasks', co.wrap(function*(){
            var task1 = { id: 'myShortId1', _id: 'long_database_id_1klhahffqwef'};
            var task2 = { id: 'myShortId2', _id: 'long_database_id_2klhahffqwef'};
            var task3 = { id: 'myShortId3', _id: 'long_database_id_3klhahffqwef'};

            var col = yield dbContext.collection(db.taskCollection);
            
            yield Promise.all([
                col.insert(task1),
                col.insert(task2),
                col.insert(task3)
            ]);
            
            var data = yield server.request('api/getTasks');
            var tasks = JSON.parse(data);
            
            tasks.forEach(function (task) {
                expect(task).not.to.have.ownProperty('_id');
            });
        }));

    });

    context('addTask', function() {

        it('should add new task to the storage', co.wrap(function*(){
            var expectedTask = {
                id: 'myTask',
                description: 'Description for task',
                position: 0,
                progress: 1
            };

            yield server.request('api/addTask?newTask=' + encodeURIComponent(JSON.stringify(expectedTask)));
            
            var col = yield dbContext.collection(db.taskCollection);
            var tasks = yield col.find({}, {_id: 0}).toArray();
            
            expect(tasks).to.have.length(1);
            expect(tasks[0]).to.deep.equal(expectedTask);
        }));

        it('should fail with status 500 if new task is not specified', co.wrap(function*(){
            yield server
                .request({
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
            
            yield server
                .request({
                    path: 'api/addTask?newTask=',
                    resolveWithFullResponse: true
                })
                .then(function (response) {
                    throw response;
                })
                .catch(function (response) {
                    expect(response.statusCode).to.equal(500);
                    expect(response.error).to.equal('New task should be specified');
                });
            
            yield server
                .request({
                    path: 'api/addTask?newTask={}',
                    resolveWithFullResponse: true
                })
                .then(function (response) {
                    throw response;
                })
                .catch(function (response) {
                    expect(response.statusCode).to.equal(500);
                    expect(response.error).to.equal('New task should be specified');
                });
        }));
        
        it('should fail with status 500 if invalid new task JSON specified', co.wrap(function*() {
            yield server
                .request({
                    path: 'api/addTask?newTask={invalid_json_here}',
                    resolveWithFullResponse: true
                })
                .then(function(response) {
                    throw response;
                })
                .catch(function(response) {
                    expect(response.statusCode).to.equal(500);
                    expect(response.error).to.equal('Invalid argument specified');
                })
        }));
        
        it('should shift existing tasks below one position down', co.wrap(function*(){
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

            var col = yield dbContext.collection(db.taskCollection);
            yield Promise.all(existingTasks.map(function (task) {
                return col.insert(task);
            }));
            
            yield server.request('api/addTask?newTask=' + encodeURIComponent(JSON.stringify(newTask)));
            
            var tasks = yield col.find({}, {_id: 0}).toArray();
            
            expect(tasks).to.deep.include.members(expectedTasks);
        }));
        
        context('when calling in parallel', function() {
            
            it('should not produce tasks with duplicate positions', co.wrap(function*() {
                
                yield Promise.all([
                    server.request('api/addTask?newTask=' + encodeURIComponent(JSON.stringify({ position: 0 }))),
                    server.request('api/addTask?newTask=' + encodeURIComponent(JSON.stringify({ position: 0 })))
                ]);
                
                var col = yield dbContext.collection(db.taskCollection);
                var tasks = yield col
                    .find({}, {_id:0})
                    .sort({position:1})
                    .toArray();
                
                tasks.forEach(function (task, taskIdx) {
                    expect(task.position).to.equal(taskIdx);
                })
            }));
            
        });
        
    });

    context('updateTask', function () {

        it('should update existing task in the storage', co.wrap(function*(){
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

            var col = yield dbContext.collection(db.taskCollection);
            yield col.insert(existingTask);
            
            yield server.request('api/updateTask?' +
                'taskId=' + encodeURIComponent(JSON.stringify('myTask')) + '&' +
                'properties=' + encodeURIComponent(JSON.stringify(updateProperties)));
            
            var tasks = yield col.find({}, {_id: 0}).toArray();
            
            expect(tasks).to.have.length(1);
            expect(tasks[0]).to.deep.equal(expectedTask);
        }));

        it('should fail with status 500 if task ID is not specified', co.wrap(function*(){
            yield server
                .request({
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
        }));

        it('should fail with status 500 if properties is not specified', co.wrap(function*(){
            yield server
                .request({
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
        }));

        it('should fail with status 500 if task to update was not found', co.wrap(function*(){
            var updateProperties = {
                description: 'Description for task UPDATED',
                position: 1,
                progress: 0
            };

            yield server
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
        }));

        it('should shift existing tasks below one position down', co.wrap(function*(){
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

            var col = yield dbContext.collection(db.taskCollection);
            
            yield Promise.all(existingTasks.map(function (task) {
                return col.insert(task);
            }));
            
            yield server.request('api/updateTask?' +
                'taskId=' + encodeURIComponent(JSON.stringify(updateTaskId)) + '&' +
                'properties=' + encodeURIComponent(JSON.stringify(updateProperties)));
               
            var tasks = yield col.find({}, {_id: 0}).toArray();
            
            expect(tasks).to.deep.include.members(expectedTasks);
        }));
        
        context('when calling in parallel', function() {
            
            it('should not produce tasks with duplicate positions', co.wrap(function*() {
                
                var existingTasks = [];
                for(var i=0; i<10; i++) {
                    existingTasks.push({id: i, position: i});
                }
                
                var col = yield dbContext.collection(db.taskCollection);
                yield Promise.all(existingTasks.map(function(task) {
                    return col.insert(task);
                }))
                
                yield Promise.all([
                    server.request('api/updateTask?' +
                            'taskId=' + encodeURIComponent(JSON.stringify(existingTasks[0].id)) + '&' +
                            'properties=' + encodeURIComponent(JSON.stringify({position: 5 }))),
                    server.request('api/updateTask?' +
                            'taskId=' + encodeURIComponent(JSON.stringify(existingTasks[1].id)) + '&' +
                            'properties=' + encodeURIComponent(JSON.stringify({position: 5 })))
                ]);
                
                var tasks = yield col
                    .find({}, {_id:0})
                    .sort({position:1})
                    .toArray();
                
                tasks.forEach(function (task, taskIdx) {
                    expect(task.position).to.equal(taskIdx);
                })
            }));
            
        });
        
    });

    context('deleteTask', function () {

        it('should delete existing task', co.wrap(function*(){
            var existingTask = { id: 'myTask'};

            var col = yield dbContext.collection(db.taskCollection);
            yield col.insert(existingTask);
            
            yield server.request('api/deleteTask?' + 
                'taskId=' + encodeURIComponent(JSON.stringify('myTask')));
                
            var tasks = yield col.find({}).toArray();
            
            expect(tasks).to.have.length(0);
        }));

        it('should shift existing tasks below one position up', co.wrap(function*(){
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

            var col = yield dbContext.collection(db.taskCollection);
            
            yield Promise.all(existingTasks.map(function (task) {
                return col.insert(task);
            }));
            
            yield server.request('api/deleteTask?' + 
                'taskId=' + encodeURIComponent(JSON.stringify(taskToDelete)));
            var tasks = yield col.find({}, {_id: 0}).toArray();
            
            expect(tasks).to.deep.include.members(expectedTasks);
        }));

        it('should fail with status 500 if task ID is not specified', co.wrap(function*(){
            yield server
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
        }));

        it('should fail with status 500 if task to delete was not found', co.wrap(function*(){
            yield server
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
        }));

    });

    context('getProjects', function () {

        it('should return array', co.wrap(function*(){
            var data = yield server.request('api/getProjects')
            
            var projects = JSON.parse(data.toString());
            expect(projects).to.be.an.instanceof(Array);
            expect(projects).to.have.length(0);
        }));

        it('should return existing project from the storage', co.wrap(function*(){
            var project = {
                id: 'project1'
            };

            var col = yield dbContext.collection(db.projectCollection);
            
            yield col.insert(project);
            
            var data = yield server.request('api/getProjects');
            var projectsActual = JSON.parse(data.toString());

            expect(projectsActual).to.have.length(1);
            expect(projectsActual[0].id).to.equal('project1');
        }));

        it('should not return _id field in projects', co.wrap(function*(){

            var project1 = { id: 'myShortId1', _id: 'long_database_id_1klhahffqwef'};
            var project2 = { id: 'myShortId2', _id: 'long_database_id_2klhahffqwef'};
            var project3 = { id: 'myShortId3', _id: 'long_database_id_3klhahffqwef'};

            var col = yield dbContext.collection(db.projectCollection);
            
            yield Promise.all([
                col.insert(project1),
                col.insert(project2),
                col.insert(project3)
            ]);
            
            var data = yield server.request('api/getProjects');
            
            var projects = JSON.parse(data);
            projects.forEach(function (project) {
                expect(project).not.to.have.ownProperty('_id');
            })
        }));

    });

    context('addProject', function () {

        it('should add new project to the storage', co.wrap(function*(){
            var newProject = {
                id: 'myProject',
                name: 'Description for project',
                tags: ['tag1'],
                color: '#000'
            };

            yield server.request('api/addProject?' + 
                'newProject=' + encodeURIComponent(JSON.stringify(newProject)))
            
            var col = yield dbContext.collection(db.projectCollection);
            var projects = yield col.find({}, {_id: 0}).toArray();
            
            expect(projects).to.have.length(1);
            expect(projects[0]).to.deep.equal(newProject);
        }));

        it('should fail with status 500 if new project is not specified', co.wrap(function*(){
            yield server
                .request({
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
            
            yield server
                .request({
                    path: 'api/addProject?newProject=',
                    resolveWithFullResponse: true
                })
                .then(function (response) {
                    throw response;
                })
                .catch(function (response) {
                    expect(response.statusCode).to.equal(500);
                    expect(response.error).to.equal('New project should be specified');
                });
                
            yield server
                .request({
                    path: 'api/addProject?newProject={}',
                    resolveWithFullResponse: true
                })
                .then(function (response) {
                    throw response;
                })
                .catch(function (response) {
                    expect(response.statusCode).to.equal(500);
                    expect(response.error).to.equal('New project should be specified');
                });
        }));
        
        it('should fail with status 500 if invalid argument JSON specified', co.wrap(function*() {
            yield server
                .request({
                    path: 'api/addProject?newProject={invalid_json_here}',
                    resolveWithFullResponse: true
                })
                .then(function(response) {
                    throw response;
                })
                .catch(function(response) {
                    expect(response.statusCode).to.equal(500);
                    expect(response.error).to.equal('Invalid argument specified');
                })
        }));

    });

    context('updateProject', function () {

        it('should update existing project in the storage', co.wrap(function*(){
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

            var col = yield dbContext.collection(db.projectCollection);
            yield col.insert(existingProject);
            
            yield server.request('api/updateProject?' +
                'projectId=' + encodeURIComponent(JSON.stringify(projectToUpdate)) + '&' +
                'properties=' + encodeURIComponent(JSON.stringify(updateProperties)));
            
            var projects = yield col.find({}, {_id: 0}).toArray();
            
            expect(projects).to.have.length(1);
            expect(projects[0]).to.deep.equal(expectedProject);
        }));

        it('should fail with status 500 if project ID is not specified', co.wrap(function*(){
            yield server
                .request({
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
        }));

        it('should fail with status 500 if properties is not specified', co.wrap(function*(){
            yield server
                .request({
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
        }));

    });

    context('deleteProject', function () {

        it('should delete existing project', co.wrap(function*(){
            var existingProject = { id: 'myProject'};

            var col = yield dbContext.collection(db.projectCollection);
            yield col.insert(existingProject);
            
            yield server.request('api/deleteProject?' + 
                'projectId=' + encodeURIComponent(JSON.stringify('myProject')));
                
            var projects = yield col.find({}).toArray();
            
            expect(projects).to.have.length(0);
        }));

        it('should fail with status 500 if project ID is not specified', co.wrap(function*(){
            yield server
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
        }));

    });

});
