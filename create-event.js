
module.exports = createEvent;


var ajax = require("./ajax");
var constant=require("./CONSTANTS");
var utility = require('./utility-functions');
var _ = require('underscore')._;


function createEvent(data,dataElementsCodeMap,formId,callback){
    
    var ODK_OrgUnitQuestion = constant.ODK_OrgUnitQuestion;
        
    if (constant.ODK2DHIS[formId]){
        if (constant.ODK2DHIS[formId]["ODK_OrgUnitQuestion"]){
            ODK_OrgUnitQuestion = constant.ODK2DHIS[formId]["ODK_OrgUnitQuestion"];
        }
    }

    function extractCoordinates(str){
        var coords = {};
        var array = str.split("-");
        
        coords.latitude = array[3];
        coords.longitude = array[4];

        return coords;
    }

    function prepareUID(data){
        var key = data.substring(data.length-10,data.length);
        return "O"+key;
    }

    var event = {
        programStage : constant.eventProgramStage,
        program : constant.eventProgram,
        dataValues:[],
        status : "COMPLETED"
    };

    for (var key in data){
        
        if (key == ODK_OrgUnitQuestion){
            var orgUnitQuestion = data[key];
            __logger.debug("Got OU  ODK Question " + orgUnitQuestion);

            event.orgUnit = orgUnitQuestion.split("-")[0];
            event.coordinate = extractCoordinates(orgUnitQuestion);
            
          //  __logger.debug(" OU  coordinates =" + event.coordinate);
            
        }

        if (key == constant.eventDateKey){
            event.eventDate = data[key];            
        }

        if (key == constant.eventUIDKey){
            event.event = prepareUID(data[key]);
            
        }

        if (dataElementsCodeMap[key]){
            var deUID = dataElementsCodeMap[key].id;
            if (deUID){
                event.dataValues.push({
                    dataElement: deUID,
                    value:  data[key]
                })
            }
        }
    }
    
    postEvent(event,function(error,response,body){
        if (error){
            __logger.error("POst Event ");                    
            return;
        }
        __logger.info(""+body.message);                    
        
        callback();
    });


    function postEvent(event,eventCreationCallback){
        
        ajax.getReq(constant.DHIS_URL_BASE+"/api/events/"+event.event,constant.auth,getEvent)
        
        function getEvent(error,response,body){
            if (error){
                __logger.error("Get Event By UID");                    
                eventCreationCallback(error,response,body);                        
                return;
            }
            body = JSON.parse(body);
            if (body.status == "ERROR"){
                __logger.info("Event with UID ["+event.event+"] Does not Exist. Creating..")
                ajax.postReq(constant.DHIS_URL_BASE+"/api/events",event,constant.auth,callback);
                
                function callback(error,response,body){
                    eventCreationCallback(error,response,body);                        
                }
            }else{
                __logger.info("Event with UID ["+event.event+"] already exists.");
                body.message = "Event already exists";
                
               // ajax.putReq(constant.DHIS_URL_BASE+"/api/events/"+event.event,event,constant.auth,eventCreationCallback)
                eventCreationCallback(null,response,{message : "Ignoring update case"});                        
           
            }
        }         
    }


}
