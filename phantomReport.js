const phantom = require('phantom');
var constant=require("./CONSTANTS");

function phantomReport(param,callback){

    getPage();
    function getPage(){
        phantom.create(['--ignore-ssl-errors=yes']).then(function(ph) {
            ph.createPage().then(function(page) {

           
                page.on('onError', function (response) {
                    console.log('= onError()' );
                    console.log('  id: ' + response.id + ', stage: "' + response.stage + '", response: ' + (response));
                });
                
                page.on('onNavigationRequested', function(url, type, willNavigate, main) {
                    console.log('= onNavigationRequested');
                    console.log('  destination_url: ' + url);
                    console.log('  type (cause): ' + type);
                    console.log('  will navigate: ' + willNavigate);
                    console.log('  from page\'s main frame: ' + main);
                });    

                page.on('onResourceReceived', function(response) {
                    console.log('= onResourceReceived()' );
                    
                    //console.log('  id: ' + response.id + ', stage: "' + response.stage + '", response: ' + JSON.stringify(response));

                    console.log('  id: ' + response.id + ', stage: "' + response.stage + '", response: ' + JSON.stringify(response.url));
                });
                
                
                page.on('onResourceRequested', function (request) {
                    console.log('= onResourceRequested()')
      //               console.log('  request: ' + JSON.stringify(request, undefined, 4));
                });
                page.on('onResourceError', function (request) {
                    console.log('= onResourceError()');
                    console.log('  onResourceError: ' + JSON.stringify(request, undefined, 4));
                });
                
                page.on('onConsoleMessage', function(msg, lineNum, sourceId) {
                    console.log("asdads")
                    console.log('CONSOLE: ' + msg + ' (from line #' + lineNum + ' in "' + sourceId + '")');
                });
                /*
                page.property("paperSize", {
                    format: 'A4',
                    orientation: 'landscape',
                    margin: '1cm',
                    header: {
                        height : '2cm',
                        contents : phantom.callback(function(pageNum, numPages){
                            return "<span>" + pageNum + "/" + numPages + "</span>";
                        })
                    }
                    
                });*/
                
                page.property('viewportSize', {width: 1280, height: 1024});
                
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
                        document.getElementById("j_password").value = "Hisp@1234";
                        document.getElementById("submit").click();
                    },1)
                    
                })
                var reportPathAndName = param.OUTPUT_PATH;
                var emailURL = param.EMAIL_URL;

                page.property('onLoadFinished', function(status,reportPathAndName,emailURL,callback) {
                    console.log('==== onLoadFinished()');
                    
                    var foo = function(thiz){
                        return function(){
                          try{

                          
                              window.setTimeout(function () {
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
                                      phantom.exit();
                                      console.log("spawnEXIT:", code)
                                  })
                                  
                                  //child.kill("SIGKILL")
                                  
                              }
                              }, 200);

                              console.log('  status: ' + status );
                              // Render Report as PDF
                              console.log('  Report: ' + reportPathAndName );
                              console.log('==== onLoadFinished() --  Rendering Now');
                              thiz.render(reportPathAndName);
                              
                          }catch(ex){
                              var fullMessage = "\nJAVASCRIPT EXCEPTION";
                              fullMessage += "\nMESSAGE: " + ex.toString();
                              for (var p in ex) {
                                  fullMessage += "\n" + p.toUpperCase() + ": " + ex[p];
                              }
                              console.log(fullMessage);
                              console.log("11111111111111111111111111111111");
                              
                          }
                        }
                    }
                    
                    var fii = foo(this);
                                    
                    setTimeout(foo(this),1*15*1000)
                 
                    
                },reportPathAndName,emailURL,callback);
            }catch(ex){
                var fullMessage = "\nJAVASCRIPT EXCEPTION";
                fullMessage += "\nMESSAGE: " + ex.toString();
                for (var p in ex) {
                    fullMessage += "\n" + p.toUpperCase() + ": " + ex[p];
                }
                console.log(fullMessage);
                console.log("222222222222222222222222");

            }
            
        });
        
    }

}

module.exports = phantomReport ;
