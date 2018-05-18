var _dhis2odk = require('./dhis2odk');
var constant=require("./CONSTANTS");
var CronJob = require('cron').CronJob;
var clusterHistoric = require('./clusterHistoric');
var moment = require("moment");
var express = require('express');

var eventService = require('./updateEvent');


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

var server = app.listen(8000, function () {
    var host = server.address().address
    var port = server.address().port

    __logger.info("Server listening at http://%s:%s", host, port);
    
})


// Open API for sending email
app.get('/sendClusterInformationReport', function(req, res){
    var name = req.query.name
    var tei =req.query.tei

    var ou = req.query.ou;
    var reportSender = require('./sendReports');            

    reportSender.makeClusterInformationReportAndSendEmail(name,tei,ou,function(){
        
    })
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end('ok');
    
})


// Open API for sending email for daily report
app.get('/sendDailyReports', function(req, res){
    var date = req.query.date

    if (!date){
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end('No date passed(YYYY-MM-DD)');
        return;
    }
    var reportSender = require('./sendReports');            
    reportSender.init(moment(date, "MM-DD-YYYY").format("YYYY-MM-DD"));

    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end('ok');
    
})


__logger.info("Starting service");
var job = new CronJob({
    cronTime: '00 59 13 * * *',
    onTick: function() {
        
        new _dhis2odk().init(function(){

 	  eventService.getRecentEventDate(function(error,response,body){
                if (error){
                    __logger.error("Error Fetching latest date Event")
                }
                var events = JSON.parse(body).events;

                var endDate = moment();
                var startDate = new Date();
                startDate = moment("10-01-2016", "MM-DD-YYYY");
                if (events.length >0){
                    startDate = events[0].eventDate;
                }
                //  endDate = moment("10-10-2016", "MM-DD-YYYY");
                
              new clusterHistoric(startDate,endDate,function(){
                  var reportSender = require('./sendReports');            
                  reportSender.init(moment(new Date()).format("YYYY-MM-DD"));
              });
                
            })
            
        });  
        
        
     //       var reportSender = require('./sendReports');            
     //       reportSender.init(moment(new Date()).format("YYYY-MM-DD"));
        
    },
    start: false,
    runOnInit : true
});

job.start();


