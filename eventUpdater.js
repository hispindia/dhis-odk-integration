
module.exports = eventUpdater;


var ajax = require("./ajax");
var constant=require("./CONSTANTS");
var utility = require('./utility-functions');


function* getUID(uids){
    for (var i=0;i<uids.length;i++){
        if (uids[i] == ""){continue}
        yield uids[i];
    }
}


function eventUpdater(uids,callback){

    var uidGenerator = getUID(uids.split(";"));
    
    updateEvent();
    function updateEvent(){
        var generatedUID = uidGenerator.next();
        if (generatedUID.done){
            __logger.info("<All Events Updated>");
            callback();
            return;
        }
        
        ajax.getReq(constant.DHIS_URL_BASE+"/api/events/"+generatedUID.value,constant.auth,function(error,response,body){
            if (error){
                __logger.error("Event Update get");
                updateEvent();
                return;
            }

            var event = JSON.parse(body);

            if (!utility.putValueAgainstId(event.dataValues,"dataElement",constant.DHIS_DE_MEMBEROFCLUSTER,"value",true)){
                event.dataValues.push({dataElement :constant.DHIS_DE_MEMBEROFCLUSTER, value : true })
            }

            ajax.putReq(constant.DHIS_URL_BASE+"/api/events/"+event.event,event,constant.auth,function(error,response,body){
                if (error){
                    __logger.error("Event Update put");

                    updateEvent();
                    return
                }
                updateEvent();

            })
            
        })
        
    }
}