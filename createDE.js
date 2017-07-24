

module.exports = createAndAssignDataElements;

var ajax = require("./ajax");
var constant=require("./CONSTANTS");
var utility = require('./utility-functions');
var _ = require('underscore')._;


function* getIndex(data){
    var keys = Object.keys(data);

    for (var i=0;i<utility.getMapLength(data);i++){
        yield keys[i];
    }
}

function createAndAssignDataElements(dataElementsCodeMap,data,formId,odk_question_prefix_id,formBinds,_callback){


    var keysGenerator = getIndex(data);
    eachQuestion();    
    function eachQuestion(){
        var keyG = keysGenerator.next();
        var key = keyG.value;
        if (keyG.done){
           // __logger.info("Finished DE Checking");
            _callback();
            return
        }
        
        
        if (!dataElementsCodeMap[key]){
            
            var odkQuestion = key;
            var odkQuestionEndPointName = odkQuestion;

            if (odkQuestion.indexOf("/") != -1){
                // compound string
                var split = odkQuestion.split("/");
                odkQuestionEndPointName = split[split.length-1];
            }

            var valueType = "TEXT";
            var aggregationType = "NONE";
            var test = formBinds;
            if (formBinds["/"+odk_question_prefix_id+"/"+key]){
                switch(formBinds["/"+odk_question_prefix_id+"/"+key].type){
                case "int" : valueType = "NUMBER";
                    aggregationType =  "SUM";
                    break
                case "date" : valueType = "DATE";
                    break
                case "dateTime" : valueType = "DATETIME";
                    break
                default : valueType = "TEXT"
                    aggregationType =  "NONE";

                }
            }
            
            //create dataElement
            var de = {
                aggregationType:aggregationType,
                categoryCombo:{
                    id: constant.DHIS_DefaultCategoryCombo
                },
                domainType:"TRACKER",
                name:odkQuestion,
                shortName:odkQuestionEndPointName.substring(0,45) +"_"+ Math.floor(Math.random()*999),
                valueType: valueType
            }

            ajax.postReq(constant.DHIS_URL_BASE+"/api/dataElements",de,constant.auth,callback);
        }else{
            eachQuestion();
        }

        function callback(error,response,body){
            if (error){
                __logger.error("Create DE " + key);
                return;
            }
            __logger.info("Create DE " + body.message);
            dataElementsCodeMap[de.name] = de;
            eachQuestion();

        }
    }
    
    


}