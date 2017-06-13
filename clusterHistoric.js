module.exports =  clusterHistoric;

var thresholdAlerts = require('./threshold-alerts1');
var moment = require("moment");
var MomentRange = require('moment-range');
moment = MomentRange.extendMoment(moment);


function* dateMaker(startDate,endDate){
 
    const range = moment.range(startDate,endDate);
  
    for (let day of range.by('days')) {
        yield day.format('YYYY-MM-DD');
    }
}

function clusterHistoric(startDate,endDate){

    var dateYielder = dateMaker(startDate,endDate);         
    
    makeClusters();
    function makeClusters(){
        var index = dateYielder.next();
        if (index.done){
            __logger.info("Done with making all  CLusters")
            return
        }
        
        var alerts = new thresholdAlerts({startDate : index.value});
        alerts.init(function(){
            makeClusters();
        });
        
    }
   
    
}