
module.exports = dhis2odk;

var dhis2API = require("./dhis2API/dhis2API");
var api = dhis2API();
var ajax = require("./ajax");
var constant=require("./CONSTANTS");
var x2js = require('xml2json');

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
            __logger.info("..Got InstanceIds");
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
                __logger.info("All Entries Fetched");
                return
            }

            var id = idList[index];

            __logger.info("Fetching Instance Data for ID="+id);            
            fetchODKInstance(id,gotInstance);

            function gotInstance(error,reponse,body){
                if (error) {  
                    __logger.error(error);            
                    return;
                }
                __logger.info("..Got InstanceIds");
                
                importODKInstanceToDHIS(JSON.parse(x2js.toJson(body)),callback);
            }
            
            function callback(error,response,body){
                
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

    function importODKInstanceToDHIS(odkFormData,callback){

        var data = odkFormData.submission.data.eDFSS_DataCollect;

        for (var key in data){
            debugger
        }
        debugger
        
    }
}