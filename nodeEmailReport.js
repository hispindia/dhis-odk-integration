const phantom = require('phantom');

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
            
            gotPage(page,process.argv[2]);               
        });
    });
}



function gotPage(page,url){
    console.log(url);
    
    page.open(url).then(function(status) {
        console.log(status);
        try{
            page.evaluate(function(){      
                setTimeout(function(){

                    document.getElementById("j_username").value = "admin";
                    document.getElementById("j_password").value = "district";
                    document.getElementById("submit").click();
                },100)
                
            })
        }catch(ex){
            var fullMessage = "\nJAVASCRIPT EXCEPTION";
            fullMessage += "\nMESSAGE: " + ex.toString();
            for (var p in ex) {
                fullMessage += "\n" + p.toUpperCase() + ": " + ex[p];
            }
            console.log(fullMessage);
            }
        page.property('onLoadFinished', function() {
            console.log('==== onLoadFinished()');
            
        });
        
    });
    
}

