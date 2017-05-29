
module.exports = new api();
var ajax = require("./ajax");
var constant=require("./CONSTANTS");

function api(){

    this.createDataElement = function(de,callback){
        
        ajax.postReq(constant.DHIS_URL_BASE+"/api/dataElements",de,constant.auth,callback);
        
    }


        this.getConflicts = function(response){


        if (response.body){
            var jsonRT = response.body.response;
            if (jsonRT){
                if (jsonRT.response){
                if (jsonRT.response.conflicts){
                    return jsonRT.response.conflicts;
                }
                if (jsonRT.response.importSummaries[0].conflicts){
                    return jsonRT.response.importSummaries[0].conflicts;
                }
                if (jsonRT.response.importSummaries[0].status == "ERROR"){
                    return ([{object:jsonRT.response.importSummaries[0].description,value:""}]);
                }
                }
                
            }
        }
        if (response.responseText){

            if (!utility.isJson(response.responseText))
                return ([{object:"Unexpected Error Occurred",value:response.responseText}]);

            var jsonRT = JSON.parse(response.responseText);

            if (jsonRT.response){
                if (jsonRT.response.conflicts){
                    return jsonRT.response.conflicts;
                }
                if (jsonRT.response.importSummaries[0].conflicts){
                    return jsonRT.response.importSummaries[0].conflicts;
                }
                if (jsonRT.response.importSummaries[0].status == "ERROR"){
                    return ([{object:jsonRT.response.importSummaries[0].description,value:""}]);
                }
            }
        }else{
            if (response.httpStatus){
                if (response.httpStatus.response)
                    if (response.httpStatus.response.conflicts){
                        return response.httpStatus.response.conflicts;
                    }
            }
        }

        if (response.conflicts)
            return response.conflicts;

        if (response.importConflicts)
            return response.importConflicts;

        return false;
    }
}

