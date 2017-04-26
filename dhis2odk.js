
module.exports = dhis2odk;

function dhis2odk(param){

    var odkhost = param.odkhost;
    var odkpath = param.odkpath;
    var odkport = param.odkport;
    var odkpath = param.odkpath;
    var odkusername = param.odkusername;
    var odkpassword = param.odkpassword;

    this.init = function(){
        getODKMetaData();
    }


    function getODKMetaData(){
        
        __logger.info("Fetching Instances..");
debugger
        var digestRequest = require('request-digest')(odkusername, odkpassword);
        digestRequest.request({
            host: odkhost ,
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
            __logger.info("..Got Instances");
            gotInstances(body);
        });
    }

    function gotInstances(instances){
        debugger



    }

}