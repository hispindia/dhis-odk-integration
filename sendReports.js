const phantom = require('phantom');
const moment  = require('moment');
const phantomReport  = require('./phantomReport');
var constant=require("./CONSTANTS");

const BASE_URL = "http://139.162.61.147/nieodk/";
const DEST_PATH_BASE = "/home/harsh/Desktop/sms/phantomjs/";
const today = moment(new Date()).format("YYYY-MM-DD");


function reportSender(){

    this.init = function(){
          
     // AFI DR1
        new phantomReport( {
            BASE_URL :BASE_URL,
            REPORT_URL : "dhis-web-reporting/generateHtmlReport.action?uid=h1H4IHmV05B&ou=mnbTnDyJ37p&startdate="+today+"&enddate="+today+"&type=1",
            OUTPUT_PATH : DEST_PATH_BASE+"/DR1-AFI_"+today+".pdf"
        },function(response){
            // Send Email Here
        })

     // ADD DR1
        new phantomReport( {
            BASE_URL :BASE_URL,
            REPORT_URL : "dhis-web-reporting/generateHtmlReport.action?uid=h1H4IHmV05B&ou=mnbTnDyJ37p&startdate="+today+"&enddate="+today+"&type=2",
            OUTPUT_PATH : DEST_PATH_BASE+"/DR1-ADD_"+today+".pdf"
        },function(response){
            // Send Email Here
        })
        
        // Daily Summary
        new phantomReport( {
            BASE_URL :BASE_URL,
            REPORT_URL : "dhis-web-reporting/generateHtmlReport.action?uid=WHXtUWlxpbS",
            OUTPUT_PATH : DEST_PATH_BASE+"/Daily_Summary_"+today+".pdf"
        },function(response){
            // Send Email Here
        })
        /*
         *
          *Same for other reports
          *
          */

    }

   
}


module.exports = new reportSender();