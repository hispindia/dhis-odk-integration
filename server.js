var _dhis2odk = require('./dhis2odk');
var constant=require("./CONSTANTS");
var CronJob = require('cron').CronJob;
var clusterHistoric = require('./clusterHistoric');
var moment = require("moment");

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


__logger.info("Starting service");

var job = new CronJob({
    cronTime: '00 59 13 * * *',
    onTick: function() {

          //var startDate = moment("12-31-2016", "MM-DD-YYYY");;
          //var endDate = moment();
        
            
              new _dhis2odk().init(function(){
              var startDate = moment("12-31-2016", "MM-DD-YYYY");;
              //  startDate = startDate.setDate(startDate.getDate() - 50);            
              var endDate = moment();
              
              new clusterHistoric(startDate,endDate);
              });
          
        //new clusterHistoric(startDate,endDate);

     //   var reportSender = require('./sendReports');            
      //  reportSender.init();

    },
    start: false,
    runOnInit : true
});

job.start();


