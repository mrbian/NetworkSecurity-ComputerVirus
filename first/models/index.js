/**
 * 引入文件
 *
 * @Author bian
 * @CreateDate 2016.11.28
 */

var fs = require('fs');
var path = require('path');
var Sequelize = require('sequelize');

var configs = require('./../instances/config.js');

var sequelize = new Sequelize(configs.db.toString(), {
    logging: function () {}
});

//  autoload
fs
    .readdirSync( __dirname)
    .filter(function (file) {
        return (file.indexOf('.') !== 0) && (file !== 'index.js' &&  file !== 'migrate.js');
    })
    .forEach(function (file) {
        try {
            sequelize.import(path.join(__dirname, file));
        } catch (e) {
            console.log(e);
        }
    });

// auto associate
var models = sequelize.models;
Object.keys(sequelize.models).forEach(function (modelName) {
    if (models[modelName].options.hasOwnProperty('associate')) {
        models[modelName].options.associate(models);
    }
});

module.exports = sequelize;
