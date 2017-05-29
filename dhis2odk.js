
module.exports = dhis2odk;

var dhis2API = require("./dhis2API/dhis2API");
var api = require("./api");
var ajax = require("./ajax");
var constant=require("./CONSTANTS");
var x2js = require('xml2json');
var utility = require('./utility-functions');
var alerts = require('./threshold-alerts');

function dhis2odk(param){

    var odkhost = param.odkhost;
    var odkpath = param.odkpath;
    var odkpathdata = param.odkpathdata;
    var odkport = param.odkport;
    var odkusername = param.odkusername;
    var odkpassword = param.odkpassword;
    var odkformid = param.odkformid;
    var odkquestionprefixid = param.odkquestionprefixid;
    var odkquestionvillage = param.odkquestionvillage;
    var odkeventDateKey = param.odkeventDateKey;
    var odkeventUIDKey = param.odkeventUIDKey;

    var dhis_trackedEntity = param.dhis_trackedEntity;
    var dhis_program = param.dhis_program;
    var dhis_programStage = param.dhis_programStage;
    var dhis_categoryCombo =param.dhis_categoryCombo;
    
    var dataElementsCodeMap = [];

    this.init = function(){
        fetchDHISMetadata(callback);
        function callback(){
            getODKMetaData();
        }      
    }

    function fetchDHISMetadata(callback){

        fetchDEs();
        function fetchDEs(){
            ajax.getReq(constant.DHIS_URL_BASE+"/api/dataElements?fields=id,name,code&filter=domainType:eq:TRACKER&paging=false",constant.auth,gotDE);

            function gotDE(error,response,body){
                
                if (error){}

                var des = JSON.parse(body).dataElements;
                
                for (var i=0;i<des.length;i++){
                    dataElementsCodeMap[des[i].name] = des[i];
                }
                
                metadataCallback();
            }
        }

        function metadataCallback(error,reponse,body){
            callback("done");
        }
    }

    function getODKMetaData(){
        
        __logger.info("Fetching Instances..");
        var digestRequest = require('request-digest')(odkusername, odkpassword);
        digestRequest.request({
            host: odkhost,
            path: odkpath,
            port: odkport,
            method: 'GET',
            headers: {
                'Custom-Header': 'OneValue',
                'Other-Custom-Header': 'OtherValue'
            }
        }, function (error, response, body) {
            if (error) {  
                __logger.error(error);            
                return;
            }
            __logger.debug("..Got InstanceIds");
            gotInstanceIds(body);
        });
    }

    function gotInstanceIds(instancesXML){
        var instances = x2js.toJson(instancesXML);
        instances = JSON.parse(instances);
        fetchODKData(instances.idChunk.idList.id);
    }

    function fetchODKData(idList){
        debugger
        fetchEntry(0,idList);

        function fetchEntry(index,idList){
            var thiz = this;
            if (index == idList.length){
                //if (index == 2){
                __logger.info("All Entries Fetched");
                return
            }

            var id = idList[index];

            __logger.info("Fetching Instance Data for ID=["+id+"]");            
            fetchODKInstance(id,gotInstance);

            function gotInstance(error,reponse,body){
                if (error) {  
                    __logger.error(error);            
                    return;
                }
                __logger.debug("..Got Instance Data");
                
                importODKInstanceToDHIS(JSON.parse(x2js.toJson(body)),eventCreationCallback.bind(thiz));
            }
            
            function eventCreationCallback(error,response,body){
                if (error){
                    __logger.error("POST/PUT Event By UID");
                    fetchEntry(index+1,idList);
                    return;
                }
                
                var conflicts = api.getConflicts(response);
                __logger.info("Event Creation/Updation resposne = " + body.message + " Conflicts="+conflicts);
                fetchEntry(index+1,idList);
            }
        }
        
        function fetchODKInstance(id,callback){
            var dataUrl = odkpathdata+"[@key="+id+"]"
            var digestRequest = require('request-digest')(odkusername, odkpassword);
            digestRequest.request({
                host: odkhost,
                path: dataUrl,
                port: odkport,
                method: 'GET',
                headers: {
                    'Custom-Header': 'OneValue',
                    'Other-Custom-Header': 'OtherValue'
                }
            }, function (error, response, body) {
                
                callback(error,response,body)
            });  
        }
    }

    function importODKInstanceToDHIS(odkFormData,eventCreationCallback){

        var eventPreparationCount = 0;
        var data = odkFormData.submission.data[odkquestionprefixid];
        
        data = utility.flattenMap(data,"/");
        
        checkAndCreateDataElements(data,eventCreationCallback);             
    }    
    
    function checkAndCreateDataElements(data,eventCreationCallback){

        loopThroughData(data);

        function loopThroughData(data){
            
            var keys = Object.keys(data);
            eachQuestion(0,data,utility.getMapLength(data),keys);

            function eachQuestion(_index,data,length,keys){
                if (_index == length){
                    __logger.info("Finished Creating DE");
                    makeEvent(data,eventCreationCallback);
                    return
                }
                
                
                if (!dataElementsCodeMap[keys[_index]]){
                    
                    var odkQuestion = keys[_index];
                    var odkQuestionEndPointName = odkQuestion;

                    if (odkQuestion.indexOf("/") != -1){
                        // compound string
                        var split = odkQuestion.split("/");
                        odkQuestionEndPointName = split[split.length-1];
                    }

                    
                    
                    //create dataElement
                    var de = {
                        aggregationType:"NONE",
                        categoryCombo:{
                            id: dhis_categoryCombo
                        },
                        domainType:"TRACKER",
                        name:odkQuestion,
                        shortName:odkQuestionEndPointName+Math.floor(Math.random()*999),
                        valueType: "TEXT"
                    }
                    __logger.error("Creating DE=" + de.name);

                    api.createDataElement(de,callback);
                }else{
                    eachQuestion(_index+1,data,length,keys);
                }

                function callback(error,response,body){
                    if (error){
                        __logger.error("Create DE " + keys[_index]);
                        return;
                    }
                    __logger.info("Create DE " + body.status);
                    
                    eachQuestion(_index+1,data,length,keys);

                }
            }
        }
        
    }
    
    function makeEvent(data,eventCreationCallback){
        
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
            programStage : dhis_programStage,
            program : dhis_program,
            dataValues:[],
            status : "COMPLETED"
        };

        for (var key in data){
            

            if (key == odkquestionvillage){
                var villageQuestion = data[key];
                __logger.debug("Got Village ODK Question " + villageQuestion);

                event.orgUnit = villageQuestion.split("-")[0];
                event.coordinate = extractCoordinates(villageQuestion);
                __logger.debug(" Village coordinates =" + event.coordinate);
                
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
        
        trackerImport(event,eventCreationCallback);

    }

    function trackerImport(event,eventCreationCallback){        
        
        var teiUID = "T"+event.event.substring(1,event.event.length);
        var enrollmentUID = "E"+event.event.substring(1,event.event.length);
        
        ajax.getReq(constant.DHIS_URL_BASE+"/api/trackedEntityInstances/"+teiUID,constant.auth,function(error,response,body){
            if (error){
                __logger.error("Get TEI By UID");                    
                return;
            }                    
        
            var tei = {
                "trackedEntityInstance": teiUID,
                "trackedEntity" :  dhis_trackedEntity,
                "orgUnit": event.orgUnit,
                "attributes": [ {
                    "attribute": constant.DUMMY_TEA_UID,
                    "value": teiUID
                } ],
                "enrollments": [ {
                    "enrollment" : enrollmentUID,
                    "orgUnit": event.orgUnit,
                    "program": dhis_program,
                    "enrollmentDate": event.eventDate,
                    "incidentDate": event.eventDate
                } ]
            }

            
            ajax.postReq(constant.DHIS_URL_BASE+"/api/trackedEntityInstances",tei,constant.auth,teiSave);
            
            function teiSave(error,response,body){
                if (error){
                    __logger.error("Save TEI");                    
                    return;
                }
                
                event.trackedEntityInstance = teiUID;
                event.enrollment = enrollmentUID;

                postEvent(event,eventCreationCallback)
                
            }
        })        
    }
    

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
                
                ajax.putReq(constant.DHIS_URL_BASE+"/api/events/"+event.event,event,constant.auth,eventCreationCallback)
                //alerts.checkForHotspot(event.event);
               // eventCreationCallback(error,response,body);                        
            }
        }         
    }

  
}