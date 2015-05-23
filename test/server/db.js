var config = require('./config'),
    MongoClient = require('mongodb-promise').MongoClient;

var db;

exports.connect = MongoClient.connect.bind(MongoClient, config.get('dbConnectionString'));

exports.taskCollection = 'tasks';
exports.projectCollection = 'projects';