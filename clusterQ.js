
var exec = require('child_process').exec;

function execute(command, callback){
    exec(command, function(error, stdout, stderr){
        console.log(error,stdout,stderr)
        callback(stdout); });
};

function clusterQ(callback){

    execute("./makeClusters.sh",function(response){
        //console.log(response);
        callback(response)
    })
    

}

module.exports = clusterQ;
