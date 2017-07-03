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
                page.property('onLoadFinished', function(status,reportPathAndName,callback) {
                    console.log('==== onLoadFinished()');
                    try{

                        console.log('  status: ' + status );
                        // Render Report as PDF
                        this.render(reportPathAndName);
                        callback("Done");
                    }catch(ex){
                        var fullMessage = "\nJAVASCRIPT EXCEPTION";
                        fullMessage += "\nMESSAGE: " + ex.toString();
                        for (var p in ex) {
                            fullMessage += "\n" + p.toUpperCase() + ": " + ex[p];
                        }
                        console.log(fullMessage);
                    }
                },reportPathAndName,callback);
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