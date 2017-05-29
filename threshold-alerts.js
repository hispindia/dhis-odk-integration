
var ajax = require("./ajax");
var constant=require("./CONSTANTS");
var moment = require("moment");
var utility = require('./utility-functions');

function thresholdAlerts(){
    

    ajax.getReq(constant.DHIS_URL_BASE+"/api/dataElementGroups?fields=id,name,dataElements[id,name]",constant.auth,getDES);
    var labDES;
    
    function getDES(error,response,body){
        if (error){
            
        }
        
        var degroup = JSON.parse(body);
        
        labDES = degroup.dataElements;
    }

    function thresholdViolation(events,days,cases,deUID,deVal){
        var now = new Date();
        var count = 0;
        var teis = [];

        for (var i=0;i<events.length;i++){
            var evDate = new Date(events[i].eventDate);
            var diff = moment(now).diff(evDate,'days');
            if (diff > days){continue}
            var dvs = events[i].dataValues;
            var val = utility.findValueAgainstId(dvs,"dataElement",constant.DE_AFI_CASE,"value");
            if (val == deVal){
                teis.push(events[i].trackedEntityInstance)                  
            }
        }
        
        if (teis.length >= cases){return teis}
        return false;
    }

    function findViolations(event,events){
        
        // check for AFI cases

        
        
    }

    this.checkForHotspot = function(evUID){
debugger
                                           var startDate = new Date();
                                           var format = "YYYY-MM-DD"; 
                                           var EVENT = null;
                                           ajax.getReq(constant.DHIS_URL_BASE+"/api/events/"+evUID,constant.auth,getEvent);

                                           function getEvent(error,response,body){
                                               if (error){ 
                                                   __logger.error("Get Event "); 
                                                   return
                                               }

                                               EVENT = JSON.parse(body);
                                               var orgUnit =  EVENT.orgUnit;
                                               var program = EVENT.program;
                                               
                                               startDate.setDate(startDate.getDate() - 7);            
                                               
                                               ajax.getReq(constant.DHIS_URL_BASE+"/api/events?skipPaging=true&paging=false&orgUnit="+orgUnit+"&program="+constant.eventProgram+"&startDate="+moment(startDate).format(format),constant.auth,getEvents);
                                               
                                               y        }                              
                                           
                                           function getEvents(error,response,body){
                                               if (error){ 
                                                   __logger.error("Get Events "); 
                                                   return
                                               }
                                               
                                               var events = JSON.parse(body).events;

                                               findViolations(EVENT,events)

                                               var cluster_tei = {
                                                   "trackedEntity" : constant.trackedEntity,
                                                   "orgUnit": EVENT.orgUnit,
                                                   "attributes": [ ],
                                                   relationships : [],
                                                   "enrollments": [ {
                                                       "orgUnit": EVENT.orgUnit,
                                                       "program": constant.CLUSTER_PROGRAM,
                                                       "enrollmentDate": new Date(),
                                                       "incidentDate": new Date()
                                                   } ]
                                                   
                                               };

                                               
                                               var clusterFound = false;

                                               var village = utility.findValueAgainstId(EVENT.dataValues,"dataElement",constant.CLUSTER_DE_VILLAGE,"value");


                                               var coordinate = JSON.stringify(EVENT.coordinate);


                                               ajax.getReq(constant.DHIS_URL_BASE+"/api/trackedEntityInstances?ou="+EVENT.orgUnit+"&program="+constant.CLUSTER_PROGRAM + "&filter="+constant.CLUSTER_TEA_ODKINTEGRATIONCODE+":eq:"+village+"&filter="+constant.CLUSTER_TEA_IS_ACTIVE + ":eq:true",constant.auth,getTEI)

                                               function getTEI(error,response,body){

                                                   var isUpdateCase = false;

                                                   if (error){
                                                       __logger.error("Get TEI By UID");
                                                       return;
                                                   }

                                                   var tei = JSON.parse(body).trackedEntityInstances;
                                                   if (tei.length != 0){
                                                       isUpdateCase = true;
                                                       tei = tei[X10];
                                                   }
                                                   
                                                   cluster_tei.attributes.push({
                                                       "attribute": constant.CLUSTER_TEA_COORDINATE,
                                                       "value": coordinate
                                                   })

                                                   cluster_tei.attributes.push({
                                                       "attribute": constant.CLUSTER_TEA_FEATURETYPE,
                                                       "value": "POINT"
                                                   })

                                                   cluster_tei.attributes.push({
                                                       "attribute": constant.CLUSTER_TEA_ODKINTEGRATIONCODE,
                                                       "value": village
                                                   })

                                                   events = filterEvents(events,constant.CLUSTER_DE_VILLAGE,"value",village);

                                                   var teis_1 = thresholdViolation(events,5,3,constant.DE_AFI_CASE,"AFI");

                                                   var teis_2 = thresholdViolation(events,7,5,constant.DE_AFI_CASE,"AFI");

                                                   var teis_3 = thresholdViolation(events,2,3,constant.DE_AFI_CASE,"ADD");

                                                   if (teis_1){
                                                       clusterFound = true;
                                                       cluster_tei.attributes.push({
                                                           "attribute": constant.CLUSTER_TEA_3AFICASE,
                                                           "value": "true"
                                                       })
                                                   }

                                                   for (var i = 0; i < teis_1.length; i++) {
                                                       var rel = {
                                                           relationship: constant.CLUSTER_RELATIONSHIP,
                                                           trackedEntityInstanceA: tei.trackedEntityInstance,
                                                           trackedEntityInstanceB: teis_1[i]
                                                       }
                                                       cluster_tei.relationships.push(rel);
                                                   }

                                                   if (teis_2){
                                                       clusterFound = true;
                                                       cluster_tei.attributes.push({
                                                           "attribute": constant.CLUSTER_TEA_5AFICASE,
                                                           "value": "true"
                                                       })
                                                   }

                                                   for (var i = 0; i < teis_2.length; i++) {
                                                       var rel = {
                                                           relationship: constant.CLUSTER_RELATIONSHIP,
                                                           trackedEntityInstanceA: tei.trackedEntityInstance,
                                                           trackedEntityInstanceB: teis_2[i]
                                                       }
                                                       cluster_tei.relationships.push(rel);
                                                   }


                                                   if (teis_3){
                                                       clusterFound = true;
                                                       cluster_tei.attributes.push({
                                                           "attribute": constant.CLUSTER_TEA_2ADDCASE,
                                                           "value": "true"
                                                       })
                                                   }

                                                   for (var i = 0; i < teis_3.length; i++) {
                                                       var rel = {
                                                           relationship: constant.CLUSTER_RELATIONSHIP,
                                                           trackedEntityInstanceA: tei.trackedEntityInstance,
                                                           trackedEntityInstanceB: teis_3[i]
                                                       }
                                                       cluster_tei.relationships.push(rel);
                                                   }

                                                   var lab_teis = getPositiveCases(events);

                                                   if (lab_teis){
                                                       clusterFound = true;
                                                       cluster_tei.attributes.push({
                                                           "attribute": constant.CLUSTER_TEA_LABCONFIRMED,
                                                           "value": "true"
                                                       })
                                                   }

                                                   for (var i = 0; i < lab_teis.length; i++) {
                                                       var rel = {
                                                           relationship: constant.CLUSTER_RELATIONSHIP,
                                                           trackedEntityInstanceA: tei.trackedEntityInstance,
                                                           trackedEntityInstanceB: lab_teis[i]
                                                       }
                                                       cluster_tei.relationships.push(rel);
                                                   }
                                                   
                                                   
                                                   if (clusterFound){

                                                       cluster_tei.attributes.push({
                                                           "attribute": constant.CLUSTER_TEA_IS_ACTIVE,
                                                           "value": "true"
                                                       })

                                                       if (!isUpdateCase){
                                                           ajax.postReq(constant.DHIS_URL_BASE+"/api/trackedEntityInstances",cluster_tei,constant.auth,teiSave);
                                                       }else{
                                                           ajax.putReq(constant.DHIS_URL_BASE+"/api/trackedEntityInstances/"+tei.trackedEntityInstance,cluster_tei,constant.auth,teiSave);
                                                       }
                                                   }


                                                   function teiSave(error,response,body){
                                                       if (error){
                                                           __logger.error("Save Cluser TEI");
                                                           return;
                                                       }

                                                   }

                                               }

                                           }

                                           function getPositiveCases(events){
                                               
                                               var teis = [];

                                               for (var i=0;i<events.length;i++){
                                                   for (var key in labDES){
                                                       var value = utility.findValueAgainstId(events.dataValues,"dataElement",key,"value");
                                                       if (value == "Positive"){
                                                           teis.push(event[i].trackedEntityInstance)                    
                                                       }
                                                       
                                                   }                
                                               }
                                               
                                               if (teis.length >1) {return teis};
                                               return false;              
                                               
                                           }
                                           
                                           function filterEvents(events,deUID,deValue,_value){
                                               var evs = [];

                                               for (var key in events){
                                                   var value = utility.findValueAgainstId(events[key].dataValues,"dataElement",deUID,deValue);

                                                   if (value == _value){
                                                       evs.push(events[key])
                                                   }
                                               }

                                               return evs;
                                               
                                           }
                                           
                                          }
}

module.exports = new thresholdAlerts();