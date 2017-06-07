/**
 * Created by harsh on 18/7/16.
 */

var request = require('request');

exports.postReq = function(url,data,auth,callback) {
    request({
        url: url,
        method: "POST",
        json: true,   // <--Very important!!!
        body: data,
        headers: {
            "Authorization": auth,
            "Content-Type": "application/json",
        }
    }, function (error, response, body) {
        callback(error,response,body);
    });
}

exports.putReq = function(url,data,auth,callback) {
    request({
        url: url,
        method: "PUT",
        json: true,   // <--Very important!!!
        body: data,
        headers: {
            "Authorization": auth,
            "Content-Type": "application/json",
        }
    }, function (error, response, body) {
        callback(error,response,body);
    });
}

exports.getReq = function(url,auth,callback) {
    
    request({
        url: url,
        method: "GET",
        headers: {
            "Authorization": auth
        }
    }, function (error, response, body) {
	
        callback(error,response,body);

    });
}

exports.getReqWithoutAuth = function(url,callback){
    request({
        url: url,
        method: "GET"
    }, function (error, response, body){
        callback(error,response,body);
    });

}

exports.forwardMessage = function(body){
    var url = "";

    request({
        url: url,
        method: "POST",
        json: true,   // <--Very important!!!
        body: body,
        headers: {
            "Content-Type": "application/json"
        }
    }, function (error, response, body) {
        if (error==null){
            console.log(""+body)
        }else{
            console.log(error.message);
        }
    });
}


exports.sendSMS = function(msg,phone){

    var url = "http://bulksms.mysmsmantra.com:8080/WebSMS/SMSAPI.jsp?username=hispindia&password=747599411&sendername=HSSPIN&mobileno="+phone+"&message="+msg;
    
    exports.getReqWithoutAuth(url,callback);

    function callback(error,resposne,body){
        __logger.info(error+"--"+body);
    }

}


exports.odkRequest = function(path,callback){

    var constant = require("./CONSTANTS");

  var digestRequest = require('request-digest')(constant.ODK_USERNAME, constant.ODK_PASSWORD);
        digestRequest.request({
            host: constant.ODKURL_HOST,
            path: path,
            port: constant.ODKURL_PORT,
            method: 'GET',
            headers: {
                'Custom-Header': 'OneValue',
                'Other-Custom-Header': 'OtherValue'
            }
        }, function (error, response, body) {
            callback(error, response, body)
        });


}