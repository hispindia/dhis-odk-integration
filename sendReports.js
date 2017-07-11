const phantom = require('phantom');
var ajax = require("./ajax");
const moment  = require('moment');
const phantomReport  = require('./phantomReport');
var constant=require("./CONSTANTS");

const BASE_URL = constant.DHIS_URL_BASE;
const DEST_PATH_BASE = "/tomcat_nieodk/dhis_home/documents";
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
    
    this.makeClusterInformationReportAndSendEmail = function(name,tei,ou,callback){
            
        ajax.getReq(BASE_URL+"/api/users?fields=id,name,email&filter=dataViewOrganisationUnits.id:eq:"+ou+"&paging=false",constant.auth, function (error, response, body) {
	    if (error){
                console.log("Error user email fetch")
                return
            }
            
            var users = JSON.parse(body).users;
            var emailStr = "";
            for (var key in users){
                emailStr = emailStr + users[key].email + ",";
            }
            emailStr = emailStr.substr(0,emailStr.length-1);
            var reportPathAndName= DEST_PATH_BASE + name;
            var emailUrl =  BASE_URL+"/dhis-web-maintenance-dataadmin/sendEmail.action?subject=Cluster%20Information%20Report%20&body=Dear%20Sir,%20PFA%20report.%20Thanks&attachmentLocation="+reportPathAndName+"&email_address_to="+emailStr+"&email_address_cc="+emailStr;
            
            new phantomReport( {
                BASE_URL : BASE_URL,
                REPORT_URL : "dhis-web-reporting/generateHtmlReport.action?uid="+constant.Reports.ClusterInformation.id+"&tei="+tei,
                OUTPUT_PATH : DEST_PATH_BASE+name,
                EMAIL_URL : emailUrl
            },function(reportPathAndName,emailURL){
                
                
            })    
           
        });        
    }
}


module.exports = new reportSender();