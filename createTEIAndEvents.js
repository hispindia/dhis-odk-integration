
module.exports = saveDataToTracker;

var ajax = require("./ajax");
var constant=require("./CONSTANTS");
var utility = require('./utility-functions');
var _ = require('underscore')._;
var moment = require("moment");
var merge = require('deepmerge');

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
        startDate.setDate(startDate.getDate() - 7);            
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

        var tailDate = utility.findValueAgainstId(cluster_tei.attributes,"attribute",constant.CLUSTER_TEA_CLUSTER_TAIL_DATE,"value");

       // ajax.getReq(constant.DHIS_URL_BASE+"/api/trackedEntityInstances/"+cluster_tei.trackedEntityInstance,constant.auth,getTEI)
        
        ajax.getReq(constant.DHIS_URL_BASE+"/api/trackedEntityInstances?filter="+constant.CLUSTER_TEA_CLUSTER_TAIL_DATE+":ge:"+moment(endDate).format(format)+"&ou="+oneCaseEvent.orgUnit+"&program="+constant.CLUSTER_PROGRAM + 
                    "&filter="+constant.CLUSTER_TEA_CLUSTER_TYPE+":eq:"+clusterType+
                    "&filter="+constant.CLUSTER_TEA_IS_ACTIVE + ":eq:true"+
                    "&filter="+constant.CLUSTER_TEA_CLUSTER_METHOD+":eq:FIXED",constant.auth,getTEI)
      
        function getTEI(error,response,body){
            
            if (error){
                __logger.error("fetch Cluster TEI");
                return;
            }
            
            var response = JSON.parse(body);
            
            if (response.trackedEntityInstances.length == 0){
                
                cluster_tei.attributes.push({
                    "attribute": constant.CLUSTER_TEA_CLUSTERID,
                    "value": "CLUSTER"+clusterID+ "_"+cluster_tei.enrollments[0].enrollmentDate
                })
                
                makeNewTEI();
            
            }else{
              
                cluster_tei = doMerging(cluster_tei,response.trackedEntityInstances[0]);
                
                ajax.putReq(constant.DHIS_URL_BASE+"/api/trackedEntityInstances/"+cluster_tei.trackedEntityInstance,cluster_tei,constant.auth,function(error,response,body){
                    if (error){
                        __logger.error("Update Cluster")
                    }
                    
                    __logger.info("Updated Cluster with UID -"+body.response.reference)
                    callback();
                    
                });

            }
            
        }

        function doMerging(current,old){
            //current.trackedEntityInstance = old.trackedEntityInstance;
            var totalAttr = []
            var currentAttrMap = []
            for (var i in current.attributes){
                currentAttrMap[current.attributes[i].attribute] = current.attributes[i].value;
                totalAttr[current.attributes[i].attribute] = true;
            }
            var oldAttrMap = []
            for (var i in old.attributes){
                oldAttrMap[old.attributes[i].attribute] = old.attributes[i].value;
                totalAttr[old.attributes[i].attribute] = true;
            }

            for (var i in totalAttr){               
             //   console.log(i + " - [" + currentAttrMap[i] + " |||| " +oldAttrMap[i]+"]");                
            }
            
            delete old.enrollments;
            var new_casesUID = utility.findValueAgainstId(current.attributes,"attribute",constant.CLUSTER_TEA_CASES_UIDS,"value");
            var old_casesUID = utility.findValueAgainstId(old.attributes,"attribute",constant.CLUSTER_TEA_CASES_UIDS,"value");
            
            new_casesUID = new_casesUID.split(";");
            old_casesUID = old_casesUID.split(";");
            var mergedCases = [];
            for (var key in new_casesUID){
                if (new_casesUID[key] == ""){continue}
                mergedCases[new_casesUID[key]] = true;
            }

            for (var key in old_casesUID){
                if (old_casesUID[key] == ""){continue}
                mergedCases[old_casesUID[key]] = true;
            }
            var mergedCaseUIDs = utility.reduceMapByKey(mergedCases,";");
            utility.putValueAgainstId(current.attributes,"attribute",constant.CLUSTER_TEA_CASES_UIDS,"value",mergedCaseUIDs);
            
            for (var i=0;i<current.attributes.length;i++){
                
                if (current.attributes[i].attribute == constant.CLUSTER_TEA_CLUSTER_INDEX_DATE){continue};
                if (current.attributes[i].attribute == constant.CLUSTER_TEA_CLUSTERID){continue};
                var attrObj = current.attributes[i];
                var value = utility.findValueAgainstId(old.attributes,"attribute",attrObj.attribute,"value");
                if (value){
                    utility.putValueAgainstId(old.attributes,"attribute",attrObj.attribute,"value",attrObj.value);
                }else{
                    old.attributes.push(attrObj);
                }
            }

            oldAttrMap = []
            for (var i in old.attributes){
                oldAttrMap[old.attributes[i].attribute] = old.attributes[i].value;
                totalAttr[old.attributes[i].attribute] = true;
            }
            for (var i in totalAttr){               
         //       console.log("> "+i + " - [" +oldAttrMap[i]+"]");                
            }
       //     console.log("-------------------------------------------")
            return old;            
        }

        function makeNewTEI(){
            
            var oldAttrMap = [];
            var totalAttr = [];
            var old = cluster_tei;
            for (var i in old.attributes){
                oldAttrMap[old.attributes[i].attribute] = old.attributes[i].value;
                totalAttr[old.attributes[i].attribute] = true;
            }
            for (var i in totalAttr){               
             //   console.log("<> "+i + " - [" +oldAttrMap[i]+"]");                
            }
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