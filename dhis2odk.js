
module.exports = dhis2odk;

var dhis2API = require("./dhis2API/dhis2API");
var api = new dhis2API();
var ajax = require("./ajax");
var constant=require("./CONSTANTS");
var x2js = require('xml2json');
var utility = require('./utility-functions');


function dhis2odk(param){

    var odkhost = param.odkhost;
    var odkpath = param.odkpath;
    var odkpathdata = param.odkpathdata;
    var odkport = param.odkport;
    var odkusername = param.odkusername;
    var odkpassword = param.odkpassword;

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
            ajax.getReq(constant.DHIS_URL_BASE+"/api/dataElements?fields=id,name,code&filter=domainType:eq:TRACKER&skipPaging=true",constant.auth,gotDE);

            function gotDE(error,response,body){
                
                if (error){}

                var des = JSON.parse(body).dataElements;
                
                for (var i=0;i<des.length;i++){
                    dataElementsCodeMap[des[i].code] = des[i];
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
        
        fetchEntry(0,idList);

        function fetchEntry(index,idList){
            if (index == idList.length){
//            if (index == 2){
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
                
                importODKInstanceToDHIS(JSON.parse(x2js.toJson(body)),eventCreationCallback);
            }
            
            function eventCreationCallback(error,response,body){
                if (error){
                    __logger.error("POST Event By UID");
                    fetchEntry(index+1,idList);
                    return;
                }
                
                var conflicts = api.getConflicts(response);
                __logger.info("Event Creation resposne = " + body.message + " Conflicts="+conflicts);
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
        var data = odkFormData.submission.data.eDFSS_DataCollect;
        
        data = utility.flattenMap(data,"/");
        
        var event = {
            programStage : constant.eventProgramStage,
            program : constant.eventProgram,
            dataValues:[],
            status : "COMPLETED"
        };
        for (var key in data){
            
            if (key == constant.ouODKKey){
                fetchOrgUnit(data[key],event);
                continue;
            }

            if (key == constant.eventDateKey){
                event.eventDate = data[key];
                continue;
            }

            if (key == constant.eventUIDKey){
                event.event = prepareUID(data[key]);
                continue;
            }
            
            if (dataElementsCodeMap[constant.codePrefix+key]){
                var deUID = dataElementsCodeMap[constant.codePrefix+key].id;
                if (deUID){

                    if (deUID == constant.deUIDCoordinate){
                        var villageAndCoords = extractVillageAndCoordinates(data[key]);
                        event.coordinate = villageAndCoords.coords;
                        event.dataValues.push({
                            dataElement: deUID,
                            value:  villageAndCoords.village
                        })
                        continue;
                    }
                    
                    event.dataValues.push({
                        dataElement: deUID,
                        value:  data[key]
                    })
                }
            } 
        }
        
        eventPreparationCallback();

        function extractVillageAndCoordinates(str){
            
            var result = {coords:{}};
            var array = str.split("-");
            
            result.village = array[0] + "-" + array[1];
            result.coords.latitude = array[2];
            result.coords.longitude = array[3];

            return result;
        }

        function fetchOrgUnit(code,event){
            ajax.getReq(constant.DHIS_URL_BASE+"/api/organisationUnits?fields=id,name,code&filter=code:eq:"+code,constant.auth,callback);
            function callback(error,response,body){
                if (error){
                    __logger.error("Fetch OrgUnitIDByCode ");
                    eventPreparationCallback();
                    
                    return;
                }
                
                event.orgUnit = JSON.parse(body).organisationUnits[0].id;
                eventPreparationCallback();
            }

        }

        function postEvent(event){

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
                    body.message = "Event already exists"
                    eventCreationCallback(error,response,body);                        
                }
            }         
        }
        function prepareUID(data){
            var key = data.substring(data.length-10,data.length);
            return "O"+key;
        }
        
        function eventPreparationCallback(){
            eventPreparationCount += 1;
            
            if (eventPreparationCount == 2){
                postEvent(event);
            }
        }
    }
}