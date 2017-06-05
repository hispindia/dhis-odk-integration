var express = require('express');
var http = require('http');
var request = require('request');
var _dhis2odk = require('./dhis2odk');
var constant=require("./CONSTANTS");
var CronJob = require('cron').CronJob;
var alerts = require('./threshold-alerts');

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

var dhis2odk_ipd = new _dhis2odk({
    odkhost : constant.ODKURL_HOST,
    odkpath : constant.ODK2DHIS["eDFSS_IPD_V3"].ODK_URL_PATH,
    odkpathdata : constant.ODK2DHIS["eDFSS_IPD_V3"].ODK_URL_PATH_DATA,
    odkport : constant.ODKURL_PORT,
    odkusername : constant.ODK_USERNAME,
    odkpassword : constant.ODK_PASSWORD,
    odkformid : constant.ODK2DHIS["eDFSS_IPD_V3"].ODK_formId,
    odkquestionprefixid : constant.ODK2DHIS["eDFSS_IPD_V3"].ODK_questionPrefixId,
    odkquestionvillage : constant.ODK2DHIS["eDFSS_IPD_V3"].ODK_QUESTION_VILLAGE,
    odkeventDateKey : constant.ODK2DHIS["eDFSS_IPD_V3"].ODK_eventDateKey,
    odkeventUIDKey : constant.ODK2DHIS["eDFSS_IPD_V3"].ODK_eventUIDKey,

    dhis_trackedEntity : constant.ODK2DHIS["eDFSS_IPD_V3"].DHIS_TE,
    dhis_program : constant.ODK2DHIS["eDFSS_IPD_V3"].DHIS_PROGRAM,
    dhis_programStage : constant.ODK2DHIS["eDFSS_IPD_V3"].DHIS_PROGRAMSTAGE,
    dhis_categoryCombo : constant.ODK2DHIS["eDFSS_IPD_V3"].DHIS_CC,

});


var dhis2odk_opd = new _dhis2odk({
    odkhost : constant.ODKURL_HOST,
    odkpath : constant.ODK2DHIS["eDFSS_OPD_V3"].ODK_URL_PATH,
    odkpathdata : constant.ODK2DHIS["eDFSS_OPD_V3"].ODK_URL_PATH_DATA,
    odkport : constant.ODKURL_PORT,
    odkusername : constant.ODK_USERNAME,
    odkpassword : constant.ODK_PASSWORD,
    odkformid : constant.ODK2DHIS["eDFSS_OPD_V3"].ODK_formId,
    odkquestionprefixid : constant.ODK2DHIS["eDFSS_OPD_V3"].ODK_questionPrefixId,
    odkquestionvillage : constant.ODK2DHIS["eDFSS_OPD_V3"].ODK_QUESTION_VILLAGE,
    odkeventDateKey : constant.ODK2DHIS["eDFSS_OPD_V3"].ODK_eventDateKey,
    odkeventUIDKey : constant.ODK2DHIS["eDFSS_OPD_V3"].ODK_eventUIDKey,

    dhis_trackedEntity : constant.ODK2DHIS["eDFSS_OPD_V3"].DHIS_TE,
    dhis_program : constant.ODK2DHIS["eDFSS_OPD_V3"].DHIS_PROGRAM,
    dhis_programStage : constant.ODK2DHIS["eDFSS_OPD_V3"].DHIS_PROGRAMSTAGE,
    dhis_categoryCombo : constant.ODK2DHIS["eDFSS_OPD_V3"].DHIS_CC,

});




var dhis2odk_lab = new _dhis2odk({
    odkhost : constant.ODKURL_HOST,
    odkpath : constant.ODK2DHIS["DPHL_Lab_V1"].ODK_URL_PATH,
    odkpathdata : constant.ODK2DHIS["DPHL_Lab_V1"].ODK_URL_PATH_DATA,
    odkport : constant.ODKURL_PORT,
    odkusername : constant.ODK_USERNAME,
    odkpassword : constant.ODK_PASSWORD,
    odkformid : constant.ODK2DHIS["DPHL_Lab_V1"].ODK_formId,
    odkquestionprefixid : constant.ODK2DHIS["DPHL_Lab_V1"].ODK_questionPrefixId,
    odkquestionvillage : constant.ODK2DHIS["DPHL_Lab_V1"].ODK_QUESTION_VILLAGE,
    odkeventDateKey : constant.ODK2DHIS["DPHL_Lab_V1"].ODK_eventDateKey,
    odkeventUIDKey : constant.ODK2DHIS["DPHL_Lab_V1"].ODK_eventUIDKey,

    dhis_trackedEntity : constant.ODK2DHIS["DPHL_Lab_V1"].DHIS_TE,
    dhis_program : constant.ODK2DHIS["DPHL_Lab_V1"].DHIS_PROGRAM,
    dhis_programStage : constant.ODK2DHIS["DPHL_Lab_V1"].DHIS_PROGRAMSTAGE,
    dhis_categoryCombo : constant.ODK2DHIS["DPHL_Lab_V1"].DHIS_CC,

});



var dhis2odk_ipd_aggregate = new _dhis2odk({
    odkhost : constant.ODKURL_HOST,
    odkpath : constant.ODK2DHIS["IPD_Aggregate_V1"].ODK_URL_PATH,
    odkpathdata : constant.ODK2DHIS["IPD_Aggregate_V1"].ODK_URL_PATH_DATA,
    odkport : constant.ODKURL_PORT,
    odkusername : constant.ODK_USERNAME,
    odkpassword : constant.ODK_PASSWORD,
    odkformid : constant.ODK2DHIS["IPD_Aggregate_V1"].ODK_formId,
    odkquestionprefixid : constant.ODK2DHIS["IPD_Aggregate_V1"].ODK_questionPrefixId,
    odkquestionvillage : constant.ODK2DHIS["IPD_Aggregate_V1"].ODK_QUESTION_VILLAGE,
    odkeventDateKey : constant.ODK2DHIS["IPD_Aggregate_V1"].ODK_eventDateKey,
    odkeventUIDKey : constant.ODK2DHIS["IPD_Aggregate_V1"].ODK_eventUIDKey,

    dhis_trackedEntity : constant.ODK2DHIS["IPD_Aggregate_V1"].DHIS_TE,
    dhis_program : constant.ODK2DHIS["IPD_Aggregate_V1"].DHIS_PROGRAM,
    dhis_programStage : constant.ODK2DHIS["IPD_Aggregate_V1"].DHIS_PROGRAMSTAGE,
    dhis_categoryCombo : constant.ODK2DHIS["IPD_Aggregate_V1"].DHIS_CC,

});



var dhis2odk_test = new _dhis2odk({
    odkhost : constant.ODKURL_HOST,
    odkpath : constant.ODK2DHIS["Test"].ODK_URL_PATH,
    odkpathdata : constant.ODK2DHIS["Test"].ODK_URL_PATH_DATA,
    odkport : constant.ODKURL_PORT,
    odkusername : constant.ODK_USERNAME,
    odkpassword : constant.ODK_PASSWORD,
    odkformid : constant.ODK2DHIS["Test"].ODK_formId,
    odkquestionprefixid : constant.ODK2DHIS["Test"].ODK_questionPrefixId,
    odkquestionvillage : constant.ODK2DHIS["Test"].ODK_QUESTION_VILLAGE,
    odkeventDateKey : constant.ODK2DHIS["Test"].ODK_eventDateKey,
    odkeventUIDKey : constant.ODK2DHIS["Test"].ODK_eventUIDKey,

    dhis_trackedEntity : constant.ODK2DHIS["Test"].DHIS_TE,
    dhis_program : constant.ODK2DHIS["Test"].DHIS_PROGRAM,
    dhis_programStage : constant.ODK2DHIS["Test"].DHIS_PROGRAMSTAGE,
    dhis_categoryCombo : constant.ODK2DHIS["Test"].DHIS_CC,

});

var server = app.listen(8000, function () {
    var host = server.address().address
    var port = server.address().port

    __logger.info("Server listening at http://%s:%s", host, port);

    var job = new CronJob({
        cronTime: '00 59 23 * * *',
        onTick: function() {
            
            dhis2odk_test.init();
            //alerts.init();
        },
        start: false,
        runOnInit : true
    });

    job.start();

})


