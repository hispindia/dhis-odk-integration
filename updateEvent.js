
var ajax = require("./ajax");
var constant=require("./CONSTANTS");
var utility = require('./utility-functions');
var _ = require('underscore')._;
var moment = require("moment");
var request = require('request');


this.getRecentEventDate = function(callback){

    ajax.getReq(constant.DHIS_URL_BASE+"/api/events?orgUnit="+constant.DHIS_ROOT_OU_UID+"&pageSize=2&ouMode=DESCENDANTS&order=eventDate:DESC&program="+constant.CLUSTER_PROGRAM+"&totalPages=true",constant.auth,
                function(error,response,body){
                  
                    callback(error,response,body)
                    
                });
    
    
}

this.updateDate = function(){

    var events = [
        "Of65a7ce7cd",
        "Oe8d9b3f1ce",      
        "O52c866ec53"
    ]

    getClusterCases(events,function(events){
        var fixedAlgoCases = filterEventsByDataValue(events,"dataElement",constant.DHIS_DE_ODK_FORMID,"value",["DPHL_Lab_V1","eDFSS_IPD_V3"],"include");  

        updateDate(0,fixedAlgoCases)
    });

  function getClusterCases(cases,callback){
        
     //   cases = cases.split(";");
        var clusterCases = [];
        getEvent(0,cases);
        function getEvent(index,cases){
            if (index == cases.length){
                callback(clusterCases);
                return
            }

            ajax.getReq(constant.DHIS_URL_BASE+"/api/events/"+cases[index],constant.auth,
                        function(error,response,body){
                            if (error){
                                console.log("Error Fetch Event")
                            }
                            clusterCases.push(JSON.parse(body));
                            getEvent(index+1,cases);
                        });
        }   
      
  }

    function updateDate(index,events){
        
        if (index == events.length){return}
        var event = events[index];

        var date = utility.findValueAgainstId(event.dataValues,"dataElement",constant.DHIS_DE_DATE,"value");
        if (!date){
            event.dataValues.push({
                dataElement : constant.DHIS_DE_DATE,
                value : moment(event.eventDate).format("YYYY-MM-DD")
            })
        }

        
        
        ajax.putReq(constant.DHIS_URL_BASE+"/api/events/"+event.event,event,constant.auth,function(error,response,body){
            if (error){
                console.log("Error updating event")
            }
            
            updateDate(index+1,events);
        })
        
    }
}

  function filterEventsByDataValue(events,idKey,id,valKey,values,operation){
        var list = [];
        for (var i=0;i<events.length;i++){
            if (utility.checkListForValue(events[i].dataValues,idKey,id,valKey,values)){
                if (operation == "include")  list.push(events[i]);
            }else{
                if (operation == "exclude")  list.push(events[i]);
            }
        }
        return list;
    }

