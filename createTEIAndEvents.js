
module.exports = saveDataToTracker;

var ajax = require("./ajax");
var constant=require("./CONSTANTS");
var utility = require('./utility-functions');
var _ = require('underscore')._;
var moment = require("moment");

var format = "YYYY-MM-DD"; 

function getClusterID(callback){
    ajax.getReq(constant.DHIS_URL_BASE+"/api/trackedEntityInstances?&page=1&totalPages=true&pageSize=1&program="+constant.CLUSTER_PROGRAM+"&ouMode=DESCENDANTS&ou="+constant.DHIS_ROOT_OU_UID,constant.auth,function(error,reponse,body){
        if (error){
            __logger.error("Get Cluster ID");
        }
        var body = JSON.parse(body);
          
        callback( body.pager.total)
    })
}

function saveDataToTracker(cluster_tei,clusterEvents,oneCaseEvent,clusterType,callback){
    getClusterID(function(clusterID){
        
        
        var startDate = new Date(cluster_tei.enrollments[0].enrollmentDate);
    //    startDate.setDate(startDate.getDate() - 7);            
        var endDate = new Date(cluster_tei.enrollments[0].enrollmentDate);
      
        cluster_tei.attributes.push({
            "attribute": constant.CLUSTER_TEA_CLUSTER_TYPE,
            "value": clusterType
        })
        cluster_tei.attributes.push({
            "attribute": constant.CLUSTER_TEA_COORDINATE,
            "value": JSON.stringify(oneCaseEvent.coordinate)
        })
        
        cluster_tei.attributes.push({
            "attribute": constant.CLUSTER_TEA_FEATURETYPE,
            "value": "POINT"
        })
        cluster_tei.attributes.push({
            "attribute": constant.CLUSTER_TEA_IS_ACTIVE,
            "value": "true"
        })
        cluster_tei.attributes.push({
            "attribute": constant.CLUSTER_TEA_CLUSTER_METHOD,
            "value": "FIXED"
        })

        ajax.getReq(constant.DHIS_URL_BASE+"/api/trackedEntityInstances/"+cluster_tei.trackedEntityInstance,constant.auth,getTEI)
        
        function getTEI(error,response,body){
            
            if (error){
                __logger.error("fetch Cluster TEI");
                return;
            }
            
            var response = JSON.parse(body);
            
            if (response.httpStatus == "Not Found"){
                cluster_tei.attributes.push({
                    "attribute": constant.CLUSTER_TEA_CLUSTERID,
                    "value": "CLUSTER"+clusterID+ "_"+moment(startDate).format(format)
                })
                makeNewTEI();
            }else{callback(); return;
                cluster_tei.attributes.push({
                    "attribute": constant.CLUSTER_TEA_CLUSTERID,
                    "value": "CLUSTER"+(clusterID-1) + "_"+moment(startDate).format(format)
                })              
                
                ajax.putReq(constant.DHIS_URL_BASE+"/api/trackedEntityInstances/"+cluster_tei.trackedEntityInstance,cluster_tei,constant.auth,function(error,response,body){
                    if (error){
                        __logger.error("Update Cluster")
                    }
                    
                    __logger.info("Updated Cluster with UID -"+body.response.reference)
                    callback();
                    
                });

            }
            
        }

        function makeNewTEI(){
            
            ajax.postReq(constant.DHIS_URL_BASE+"/api/trackedEntityInstances",cluster_tei,constant.auth,teiSave);
            
            function teiSave(error,response,body){
                if (error){
                    __logger.error("POst Cluster TEI");
                    return;
                }
                
                __logger.info("Saved Cluster with UID -"+body.response.importSummaries[0].reference)
                callback();
            }                 
        }
    })
}