module.exports =  clusterHistoric;

var thresholdAlerts = require('./threshold-alerts');
var moment = require("moment");
var MomentRange = require('moment-range');
moment = MomentRange.extendMoment(moment);


function* dateMaker(startDate,endDate){
 
    const range = moment.range(startDate,endDate);
  
    for (var day of range.by('days')) {
        yield day.format('YYYY-MM-DD');
    }
}

function clusterHistoric(startDate,endDate,callback){

    var dateYielder = dateMaker(startDate,endDate);         
    
    makeClusters();
    function makeClusters(){
        var index = dateYielder.next();
        if (index.done){
            __logger.info("Done with making all  CLusters")
            callback();
            return
        }
        
        __logger.info("Making cluster for Start Date[" + index.value+"]");
        var alerts = new thresholdAlerts({startDate : index.value});
        alerts.init(function(){
            makeClusters();
        });
        
    }
   
    
}