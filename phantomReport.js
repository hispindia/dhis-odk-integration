const phantom = require('phantom');
const moment  = require('moment');


function phantomReport(param,callback){

    getPage();
    function getPage(){
        phantom.create().then(function(ph) {
            ph.createPage().then(function(page) {
                
                page.property('onNavigationRequested', function(url, type, willNavigate, main) {
                    console.log('= onNavigationRequested');
                    console.log('  destination_url: ' + url);
                    console.log('  type (cause): ' + type);
                    console.log('  will navigate: ' + willNavigate);
                    console.log('  from page\'s main frame: ' + main);
                });    

                page.property('onResourceReceived', function(response) {
                    console.log('= onResourceReceived()' );
                    // console.log('  id: ' + response.id + ', stage: "' + response.stage + '", response: ' + JSON.stringify(response));
                });
                
                
                page.property('onResourceRequested', function (request) {
                    console.log('= onResourceRequested()');
                    //  console.log('  request: ' + JSON.stringify(request, undefined, 4));
                });
                
                gotPage(page);               
            });
        });
    }
    function gotPage(page){
        
        page.open(param.BASE_URL + param.REPORT_URL).then(function(status) {
            console.log(status);
            try{
                page.evaluate(function(){      
                    setTimeout(function(){

                        document.getElementById("j_username").value = "admin";
                        document.getElementById("j_password").value = "district";
                        document.getElementById("submit").click();
                    },100)
                    
                })
                var reportPathAndName = param.OUTPUT_PATH;
                var emailURL = param.EMAIL_URL;

                page.property('onLoadFinished', function(status,reportPathAndName,emailURL,callback) {
                    console.log('==== onLoadFinished()');
                    
                    var foo = function(thiz){
                        return function(){
                          try{

                            console.log('  status: ' + status );
                            // Render Report as PDF
                            console.log('  Report: ' + reportPathAndName );

                            thiz.render(reportPathAndName);
                            if (emailURL){
                                var process = require("child_process")
                                var spawn = process.spawn
                                var execFile = process.execFile
                                
                                var child = spawn("node", ["nodeEmailReport.js", emailURL])
                                
                                child.stdout.on("data", function (data) {
                                    console.log("spawnSTDOUT:", JSON.stringify(data))
                                })
                                
                                child.stderr.on("data", function (data) {
                                    console.log("spawnSTDERR:", JSON.stringify(data))
                                })
                                
                                child.on("exit", function (code) {
                                    console.log("spawnEXIT:", code)
                                })
                                
                                //child.kill("SIGKILL")
                                
                            }
                        }catch(ex){
                            var fullMessage = "\nJAVASCRIPT EXCEPTION";
                            fullMessage += "\nMESSAGE: " + ex.toString();
                            for (var p in ex) {
                                fullMessage += "\n" + p.toUpperCase() + ": " + ex[p];
                            }
                            console.log(fullMessage);
                        }
                        }
                    }
                    
                    var fii = foo(this);
                    setTimeout(fii,3000)
                    
                },reportPathAndName,emailURL,callback);
            }catch(ex){
                var fullMessage = "\nJAVASCRIPT EXCEPTION";
                fullMessage += "\nMESSAGE: " + ex.toString();
                for (var p in ex) {
                    fullMessage += "\n" + p.toUpperCase() + ": " + ex[p];
                }
                console.log(fullMessage);
            }
            
        });
        
    }

}

module.exports = phantomReport ;
