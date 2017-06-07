
var ajax = require("./ajax");
var constant=require("./CONSTANTS");
var moment = require("moment");
var utility = require('./utility-functions');
var merge = require('deepmerge');

function thresholdAlerts(){
    
  //  ajax.getReq(constant.DHIS_URL_BASE+"/api/dataElementGroups?fields=id,name,dataElements[id,name]",constant.auth,getDES);
    var labDES;
    
    function getDES(error,response,body){
        if (error){
            __logger.error("dataelementgroups fetch")
        }
        
        var degroup = JSON.parse(body);        
        labDES = degroup.dataElements;
    }

  /*  var clusterCasesToShowDES;
    ajax.getReq(constant.DHIS_URL_BASE+"/api/dataElementGroups/"+constant.CLUSTER_DE_GROUP_DE_TO_SHOW+"?fields=id,name,dataElements[id,name]",constant.auth,
                function(){
                    if (error){
                        __logger.error("dataelementgroups fetch")
                    }
                    
                    var degroup = JSON.parse(body);        
                    clusterCasesToShowDES = degroup.dataElements;                    
                });
    */

    this.init = function(){
        
        //get all villages
        
        ajax.getReq(constant.DHIS_URL_BASE+"/api/organisationUnits?fields=[id,name,code]&skipPaging=true&paging=false&level=8",constant.auth,gotVillages);

        function gotVillages(error,response,body){
            if (error){ 
                __logger.error("Get All Villages "); 
                return
            }
            
            var villages = JSON.parse(body).organisationUnits;
            examineVillages(villages);
        }       
    }

    function examineVillages(villages){
        
        // get last 7 days events from ipd
        
        //get last 21 days lab events
        examineVillage(0,villages);
        function examineVillage(index,villages){
            if (index == villages.length){
                return
            }
            
            var startDate = new Date();
            startDate.setDate(startDate.getDate() - 91);            

            var village = villages[index];
            checkViolations(village.id,startDate,callback);
            
            function callback(){
                examineVillage(index+1,villages);

            }
            
        }
    }

    function checkViolations(ouId,clusterDate,eachVillageExaminationCallback){
        

        var cluster_tei = {
            "trackedEntity" : constant.DHIS_CLUSTER_TRACKED_ENTITY_UID,
            "orgUnit": ouId,
            "attributes": [ ],
            "enrollments": [ {
                "orgUnit": ouId,
                "program": constant.DHIS_CLUSTER_PROGRAM_UID,
                "enrollmentDate":clusterDate,
                "incidentDate": clusterDate
            } ]
            
        };
        
        var cDate = clusterDate;
        var format = "YYYY-MM-DD"; 

        //check for AFI
        cDate.setDate(cDate.getDate() - 7);            

        // get last 7 days data from IPD           
        ajax.getReq(constant.DHIS_URL_BASE+"/api/events?skipPaging=true&paging=false&orgUnit="+ouId+"&program="+constant.DHIS_IPD_PROGRAM_UID+"&startDate="+moment(cDate).format(format),constant.auth,gotIPDCases);            
        

        function gotIPDCases(error,response,body){
            if (error){
                __logger.error("get IPD Events")
            }
            
            var ipdEvents = JSON.parse(body).events;
            
            if (ipdEvents.length == 0){
                eachVillageExaminationCallback();
                return
            }

            // ALL Cluster Events have the same OU as the Cluster
            var eventOrgUnit = ipdEvents[0].orgUnit;
            
            /* <Check for AFI Conditions                                 */
            var teis_1 = thresholdViolation(ipdEvents,5,3,constant.DHIS_DE_IPD_SYNDROME_UID,"AFI",clusterDate);
            var teis_2 = thresholdViolation(ipdEvents,7,5,constant.DHIS_DE_IPD_SYNDROME_UID,"AFI",clusterDate);            
            var teis_3 = thresholdViolation(ipdEvents,3,2,constant.DHIS_DE_IPD_SYNDROME_UID,"ADD",clusterDate);
            var lab_teis = getPositiveCases(ipdEvents);
            if (teis_1){
                clusterFound = true;
                cluster_tei.attributes.push({
                    "attribute": constant.CLUSTER_TEA_3AFICASE,
                    "value": "true"
                });              
                
            }
            if (teis_2){
                clusterFound = true;
                cluster_tei.attributes.push({
                    "attribute": constant.CLUSTER_TEA_5AFICASE,
                    "value": "true"
                })
             
            }
            if (teis_3){
                clusterFound = true;
                cluster_tei.attributes.push({
                    "attribute": constant.CLUSTER_TEA_2ADDCASE,
                    "value": "true"
                })              

            }
            if (lab_teis){
                clusterFound = true;
                cluster_tei.attributes.push({
                    "attribute": constant.CLUSTER_TEA_LABCONFIRMED,
                    "value": "true"
                })              
                
            }
            /*                               Check for AFI Conditions> */

            // filter out unique teis and make event list for import
            var clusterEvents = makeClusterEvents(teis_1,teis_2,teis_3);
            
            if (clusterEvents.length > 0){
                debugger
                cluster_tei.attributes.push({
                    "attribute": constant.CLUSTER_TEA_IS_ACTIVE,
                    "value": "true"
                })
                cluster_tei.attributes.push({
                    "attribute": constant.CLUSTER_TEA__CLUSTER_IDENTIFIER,
                    "value": ouId
                                          })
                saveDataToTracker(cluster_tei,clusterEvents,ipdEvents[0],eachVillageExaminationCallback);
            }else{
                eachVillageExaminationCallback();

            }
                
            
            function makeClusterEvents(teis1,teis2,teis3,teis4){
                var events = [];
                var uniqueTeiMap = [];

                for (key in teis1){
                    uniqueTeiMap[teis1[key]] = true;
                }
                for (key in teis2){
                    uniqueTeiMap[teis2[key]] = true;
                }
                for (key in teis3){
                    uniqueTeiMap[teis3[key]] = true;
                }
                for (key in teis4){
                    uniqueTeiMap[teis4[key]] = true;
                }

                for (var caseTEIUID  in uniqueTeiMap){
                    var event = {
                        status : "COMPLETED",
                        orgUnit : eventOrgUnit,
                        program : constant.CLUSTER_PROGRAM,
                        programStage : constant.CLUSTER_PROGRAMSTAGE,
                        dataValues : [{
                            dataElement : constant.CLUSTER_DE_CASE_TEI_UID,
                            value : caseTEIUID
                        }],
                        eventDate : clusterDate                    
                    }
                    events.push(event);                    
                }
                return events;
            }
        }
    }
    

    function saveDataToTracker(cluster_tei,clusterEvents,oneIPDEvent,eachVillageExaminationCallback){
        
        var startDate = cluster_tei.enrollments[0].enrollmentDate;
        startDate.setDate(startDate.getDate() - 7);            

        cluster_tei.attributes.push({
            "attribute": constant.CLUSTER_TEA_COORDINATE,
            "value": JSON.stringify(oneIPDEvent.coordinate)
        })
        
        cluster_tei.attributes.push({
            "attribute": constant.CLUSTER_TEA_FEATURETYPE,
            "value": "POINT"
        })
        
        ajax.getReq(constant.DHIS_URL_BASE+"/api/trackedEntityInstances?startDate="+startDate+"&ou="+oneIPDEvent.orgUnit+"&program="+constant.CLUSTER_PROGRAM + "&filter="+constant.CLUSTER_TEA__CLUSTER_IDENTIFIER+":eq:"+oneIPDEvent.orgUnit+"&filter="+constant.CLUSTER_TEA_IS_ACTIVE + ":eq:true",constant.auth,getTEI)
        
        function getTEI(error,response,body){
            
            if (error){
                __logger.error("fetch Cluster TEI");
                return;
            }
            
            var teis = JSON.parse(body);
            if (teis.trackedEntityInstances.length == 0){
                makeNewTEI();
            }else{
                debugger
                eachVillageExaminationCallback()
              /*  var teiExisting = teis.trackedEntityInstances[0];
                var tei = merge(teiExisting,cluster_tei);
                delete tei.enrollment;
                var clusterEvents = addTEIToEvents(clusterEvents,tei.trackedEntityInstance);
                debugger */
            }
            
        }

        function makeNewTEI(){
            
            ajax.postReq(constant.DHIS_URL_BASE+"/api/trackedEntityInstances",cluster_tei,constant.auth,teiSave);
            
            function teiSave(error,response,body){
                if (error){
                __logger.error("POst Cluster TEI");
                    return;
                }
                var clusterTEIUID = body.response.reference;
                clusterEvents = addTEIToEvents(clusterEvents,clusterTEIUID);
                
                ajax.postReq(constant.DHIS_URL_BASE+"/api/events",
                             { events : clusterEvents },
                             constant.auth,saveClusterEvents);                
                debugger
            }
            
        }

        function addTEIToEvents(events,teiUID){
            for (var key in events){
                events[key].trackedEntityInstance = teiUID;
            }
            return events;
        }     

        function saveClusterEvents(error,response,body){
            if (error){debugger
                __logger.error("POst Cluster Events");
                return;
            }
            eachVillageExaminationCallback();

            debugger
        }
        
    }
    
    function thresholdViolation(events,days,cases,deUID,deVal,now){
        var count = 0;
        var teis = [];

        for (var i=0;i<events.length;i++){
            var evDate = new Date(events[i].eventDate);
            var diff = moment(now).diff(evDate,'days');
            if (diff > days){continue}
            var dvs = events[i].dataValues;
            var val = utility.findValueAgainstId(dvs,"dataElement",deUID,"value");
            if (val == deVal){
                teis.push(events[i].trackedEntityInstance)                  
            }
        }
        
        if (teis.length >= cases){return teis}
        return false;
    }

    function getPositiveCases(events){
        
        var teis = [];

        for (var i=0;i<events.length;i++){
            for (var key in labDES){
                var value = utility.findValueAgainstId(events.dataValues,"dataElement",key,"value");
                if (value.indexOf("Positive")!=-1){
                    teis.push(event[i].trackedEntityInstance)                    
                }                    
            }                
        }
        
        if (teis.length >1) {return teis};
        return false;              
        
    }
  //////////////////////

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
            
        }                              
        
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
