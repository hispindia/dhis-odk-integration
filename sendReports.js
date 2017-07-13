const phantom = require('phantom');
var ajax = require("./ajax");
const moment  = require('moment');
const phantomReport  = require('./phantomReport');
var constant=require("./CONSTANTS");

const BASE_URL = constant.DHIS_URL_BASE;
const DEST_PATH_BASE = constant.DEST_PATH_BASE;

const today = moment(new Date()).format("YYYY-MM-DD");


function reportSender(){

    function getEmailIdFromUserGroup(uGroupId,callback){
        ajax.getReq(constant.DHIS_URL_BASE + "/api/userGroups/"+uGroupId+"?fields=id,users[id,name,email]",constant.auth,function(error,response,body){
            if (error){
                console.log("User fetch error");
                callback("harsh.atal@gmail.com;");
                return;
            }
            
            var users = JSON.parse(body).users;
            var emailStr = "";
            for (var key in users){
                if (users[key].email){
                emailStr = emailStr + users[key].email + ";";
                }
            }
            emailStr = emailStr.substr(0,emailStr.length-1);
            callback(emailStr);
        })
    }
    
    function getEMail(callback){
        getEmailIdFromUserGroup(constant.EMAIL_GROUP_UID,function(emailTO){
            getEmailIdFromUserGroup(constant.EMAIL_GROUP_CC_UID,function(emailCC){
                callback(emailTO,emailCC)
            })
        })
    }
    
    function sendPhantomReport(BASE_URL,REPORT_URL,DEST_PATH_BASE,subject,body,to,cc,reportName,fileFormat,timeout){
        
        var attachmentLocation = DEST_PATH_BASE+reportName + fileFormat;
        var emailUrl =  BASE_URL+"/dhis-web-maintenance-dataadmin/sendEmail.action?subject="+subject+"&body="+body+"&attachmentLocation="+attachmentLocation+"&email_address_to="+to+"&email_address_cc="+cc;
        setTimeout(function(){
            new phantomReport( {
                BASE_URL :BASE_URL,
                REPORT_URL : REPORT_URL,
                OUTPUT_PATH : attachmentLocation,
                EMAIL_URL : emailUrl
            },function(response){
            })
        },timeout)
        
        
    }


    this.init = function(date){
        getEMail(function(emailTO,emailCC){
            var body = "Dear Sir/Madam ,<br/><br/> Please find attached report for date "+date+". <br/><br/><br/> Regards<br/>Application";
            var reportName,subject;
            var timeout = 1000;


            reportName = "DR1_ADD_"+date;
            subject = reportName;
            sendPhantomReport(
                BASE_URL,
                "dhis-web-reporting/generateHtmlReport.action?uid=h1H4IHmV05B&ou=mnbTnDyJ37p&startdate="+date+"&enddate="+date+"&type=1",                
                DEST_PATH_BASE ,
                subject,
                body,
                emailTO,
                emailCC,
                reportName,
                ".pdf",
                timeout
                );
                

            reportName = "DR1_AFI_"+date;
            subject = reportName;
            sendPhantomReport(
                BASE_URL,
                "dhis-web-reporting/generateHtmlReport.action?uid=h1H4IHmV05B&ou=mnbTnDyJ37p&startdate="+date+"&enddate="+date+"&type=2",                
                DEST_PATH_BASE ,
                subject,
                body,
                emailTO,
                emailCC,
                reportName,
                ".pdf",
                timeout*5
                );

            reportName = "DR1_LAB_"+date;
            subject = reportName;
            sendPhantomReport(
                BASE_URL,
                "dhis-web-reporting/generateHtmlReport.action?uid=h1H4IHmV05B&ou=mnbTnDyJ37p&startdate="+date+"&enddate="+date+"&type=3",                
                DEST_PATH_BASE ,
                subject,
                body,
                emailTO,
                emailCC,
                reportName,
                ".pdf",
                timeout*10
                );

            reportName = "Form-A_"+date;
            subject = reportName;
            sendPhantomReport(
                BASE_URL,
                "dhis-web-reporting/generateHtmlReport.action?uid=Ez8dVZHdPEm&ou=mnbTnDyJ37p&startdate="+date+"&enddate="+date,                
                DEST_PATH_BASE ,
                subject,
                body,
                emailTO,
                emailCC,
                reportName,
                ".pdf",
                timeout*15
                );


            reportName = "Form-B_"+date;
            subject = reportName;
            sendPhantomReport(
                BASE_URL,
                "dhis-web-reporting/generateHtmlReport.action?uid=CVLrlTvIK9I&ou=mnbTnDyJ37p&startdate="+date+"&enddate="+date,                
                DEST_PATH_BASE ,
                subject,
                body,
                emailTO,
                emailCC,
                reportName,
                ".pdf",
                timeout*20
                );

           
            reportName = "Daily_Summary_"+date;
            subject = reportName;
            sendPhantomReport(
                BASE_URL,
                "dhis-web-reporting/generateHtmlReport.action?uid=IzcRhuml41p&ou=mnbTnDyJ37p&date="+date,                
                DEST_PATH_BASE ,
                subject,
                body,
                emailTO,
                emailCC,
                reportName,
                ".pdf"
                );

/*
            date = moment(date).format("YYYYMMDD");
            reportName = "Preventive_And_Control_Measures_By_RRT_"+date;
            subject = reportName;
            sendPhantomReport(
                BASE_URL,
                "dhis-web-reporting/generateHtmlReport.action?uid=duaxAwBCQ0p&ou=mnbTnDyJ37p&date="+date,                
                DEST_PATH_BASE ,
                subject,
                body,
                emailTO,
                emailCC,
                reportName,
                ".pdf"
                );
  */            
            });              
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