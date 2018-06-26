
module.exports = dhis2odk;

var dhis2API = require("./dhis2API/dhis2API");
var api = require("./api");
var ajax = require("./ajax");
var constant=require("./CONSTANTS");
var x2js = require('xml2json');
var utility = require('./utility-functions');
var alerts = require('./threshold-alerts');
var underscore = require('underscore')._;
var mainODKMotor = require('./main-motor');

function dhis2odk(param){

   
    var dataElementsCodeMap = [];
    var _index = -1;
    var _formList;
    var _mainCallback;
    this.init = function(mainCallback){
        _mainCallback = mainCallback;
        fetchDHISMetadata(callback);
        
        function callback(){
            fetchODKForms(mainCallback);
        
        }      
    }

    function fetchODKForms(mainCallback){
        
        __logger.info("Fetching Forms..");
        
        ajax.odkRequest(constant.ODKURL_HOSTNAME + "/formList", gotFormList)
        
        function gotFormList(error, response, body) {
            if (error) {  
                __logger.error(error);            
                return;
            }
            
            var forms = x2js.toJson(body);
            __logger.debug("FormList : "+body);            

            forms = JSON.parse(forms);
            forms = forms.forms.form;
            _formList = underscore.map(forms,function(form){
                return form.url.split("=")[1];
            })
            odkRotor();       
        };        
    }

    function odkRotor(){

       
        _index = _index+1;
        if (_index == _formList.length){
            __logger.info("Finished importing all forms")
            _mainCallback();
            return
        }

        fetchQuestionDetails(_formList[_index])
        
        function fetchQuestionDetails(formId){
            ajax.odkRequest(constant.ODKURL_HOSTNAME + "/www/formXml?formId="+formId, gotFormDetails)
            function gotFormDetails(error,response,body){
                if (error){
                    __logger.error("Fetch Form Details");
                    return
                }
                var formInstance = JSON.parse(x2js.toJson(body))["h:html"]["h:head"]["model"]["instance"];
                var formBinds = JSON.parse(x2js.toJson(body))["h:html"]["h:head"]["model"]["bind"];
                
                var odk_qustion_prefix_id = underscore.keys(formInstance)[0];
                
                formInstance = utility.flattenMap(formInstance[odk_qustion_prefix_id],"/");
                formBinds = utility.prepareIdToObjectMap(formBinds,"nodeset");
                fetchFormInstances(formId,odk_qustion_prefix_id,formBinds);             
            }
        }
        
        function fetchFormInstances(formId,odk_qustion_prefix_id,formBinds){
            
            ajax.odkRequest(constant.ODKURL_HOSTNAME + "/view/submissionList?formId="+formId, gotInstances);
            function gotInstances(error,response,body){
                if (error){
                    __logger.error("Fetch Instances");
                    return
                }
                
                var instanceList = JSON.parse(x2js.toJson(body));
                instanceList = instanceList.idChunk.idList.id;
                filterInstanceList(instanceList,function(filteredInstanceList){  
                    new mainODKMotor(filteredInstanceList,dataElementsCodeMap,formId,odk_qustion_prefix_id,formBinds,function( ){      
                    odkRotor();
                    })
                })
                
            }
            
        }
        
        function filterInstanceList(instanceList,callback){
            ajax.getReq(constant.DHIS_URL_BASE+"/api/events?&program="+constant.eventProgram+"&fields=event&skipPaging=true",constant.auth,function(error,response,body){
                if (error){
                    __logger.error("Fetch Events (filter)");
                    return
                }
                
                var events = JSON.parse(body).events;
                var eventMap = utility.prepareKeyMap(events,"event",true);
                var filteredIIDs = [];
                var filteredIIDsMap = [];

                for (var i=0;i<instanceList.length;i++){
                    var iid = instanceList[i];
                    
                    if (!eventMap[prepareUID(iid)] && !filteredIIDsMap[iid]){
                        filteredIIDs.push(iid)
                        filteredIIDsMap[iid] = true;
                    }
                }
                
                callback(filteredIIDs);
                
            });

            function prepareUID(data){
                var key = data.substring(data.length-10,data.length);
                return "O"+key;
            }   
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

    
}
