/**
 * Created by harsh on 7/5/16.
 */

var _ = {};

_.prepareIdToObjectMap = function(object,id){
    var map = [];
    for (var i=0;i<object.length;i++){
        map[object[i][id]] = object[i];
    }
    return map;
}

_.prepareMapGroupedById= function(object,id){
    var map = [];
    for (var i=0;i<object.length;i++){
        if (!map[object[i][id]]){
            map[object[i][id]] = [];
        }
        map[object[i][id]].push(object[i]);
    }
    return map;
}

_.prepareUID = function(options,ids){
    
    var sha1 = require('js-sha1');
    var uid = sha1(ids.sort());

    return "CL"+uid.substr(0,9);
}

//http://stackoverflow.com/questions/9804777/how-to-test-if-a-string-is-json-or-not
//http://stackoverflow.com/users/3119662/kubosho
_.isJson = function(item) {
    item = typeof item !== "string"
        ? JSON.stringify(item)
        : item;

    try {
        item = JSON.parse(item);
    } catch (e) {
        return false;
    }

    if (typeof item === "object" && item !== null) {
        return true;
    }

    return false;
}

_.shadowStringify= function (json){
    var str = json;
    str = JSON.stringify(str);
    str = str.replace(/\"/g,'^');
    str = str.replace(/{/g,'<');
    str = str.replace(/}/g,'>');
    return str;
}

_.unshadowStringify = function(str){
    str = str.replace(/\^/g,'"');
    str = str.replace(/</g,'{');
    str = str.replace(/>/g,'}');

    return JSON.parse(str);
}
module.exports = _;
