var express = require('express');
var http = require('http');
var request = require('request');
var _dhis2odk = require('./dhis2odk');
var constant=require("./CONSTANTS");
var CronJob = require('cron').CronJob;

// Initialise
var app = express();



/**
 * Set up CORS Settings
 */ app.use(function (req, res, next) {

     // Website you wish to allow to connect
     res.setHeader('Access-Control-Allow-Origin', '*');

     // Request methods you wish to allow
     res.setHeader('Access-Control-Allow-Methods', 'GET, POST');

     // Request headers you wish to allow
     res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

     // Pass to next layer of middleware
     next();
 });/**
     */

var bodyParser = require('body-parser')
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));


/** Set Up Logging
 */ var winston = require('winston');
global.__logger = new (winston.Logger)({
    level : 'silly',
    transports: [
        new (winston.transports.Console)({
            colorize: true,
            timestamp: true
        }),
        new (winston.transports.File)({
            filename: './logs/server.log',
            timestamp: true
        })
    ]
});
/**
 */

var dhis2odk = new _dhis2odk({
    odkhost : constant.ODKURL_HOST,
    odkpath : constant.ODKURL_PATH,
    odkpathdata : constant.ODKURL_PATH_DATA,
    odkport : constant.ODKURL_PORT,
    odkusername : constant.ODK_USERNAME,
    odkpassword : constant.ODK_PASSWORD
});


var server = app.listen(8000, function () {

    var host = server.address().address
    var port = server.address().port

    __logger.info("Server listening at http://%s:%s", host, port);

    var job = new CronJob({
        cronTime: '00 59 23 * * *',
        onTick: function() {
            dhis2odk.init();
        },
        start: false,
        runOnInit : true
    });

    job.start();

})


