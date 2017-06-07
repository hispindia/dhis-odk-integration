
module.exports = mainODKMotor;

var ajax = require("./ajax");
var constant=require("./CONSTANTS");
var x2js = require('xml2json');
var utility = require('./utility-functions');
var _ = require('underscore')._;
var deCreator = require('./createDE');
var eventCreator = require('./create-event');

function* getIndex(max){
    for (var i=0;i<max;i++){
        yield i;
    }
}

function mainODKMotor(instanceList,dataElementsCodeMap,formId,odk_question_prefix_id,formBinds,callback){


    var indexGenerator =  getIndex(instanceList.length);
    
    fetchInstanceData()
    function fetchInstanceData(){
        var generatedIndex = indexGenerator.next();
        if (generatedIndex.done){
            __logger.info(">>>>>Form"+formId+" Import Complete<<<<<");
debugger
            callback();
            return;
        }
        
        var instanceId = instanceList[generatedIndex.value];
        
        ajax.odkRequest(constant.ODKURL_HOSTNAME + "/view/downloadSubmission?formId="+formId+"[@version=null@uiVersion=null]/"+odk_question_prefix_id+"[@key="+instanceId+"]", gotInstanceData);

        function gotInstanceData(error,response,body){
            if (error){
                __logger.error("Fetch Instance Data");
            }
            __logger.debug("Got instance data for ID["+instanceId+"]")

            var odkFormData = JSON.parse(x2js.toJson(body));
            
            var data = odkFormData.submission.data[odk_question_prefix_id];
            
            data = utility.flattenMap(data,"/");
            
          //  __logger.info("DE Check")
            new deCreator(dataElementsCodeMap,data,formId,odk_question_prefix_id,formBinds,function(){
                __logger.info("Creating Event")
                new eventCreator(data,dataElementsCodeMap,formId,function(){
                    
                    fetchInstanceData()
                });
                
            })
            
        }
    }


}