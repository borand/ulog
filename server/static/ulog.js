///////////////////////////////////////////
// Global variables
var ws;
var table;
var JsonData;   

/////////////////////////////////////////////////////////////////////
// UTILITY FUNCTIONS
//
function dbg(message, show) {   
    if (show){   
        console.log(message);        
    }
}

///////////////////////////////////////////////////////////////////////
// WEBSOCKETS FUNCTIONS
//MessageHandler
//
function open_websocket(hostname, hosturl) {
    dbg('Attempting to open web socket',true);

    var websocket_address = "ws://" + hostname + "/websocket/" + hosturl;
    ws = new WebSocket(websocket_address);
    
    ws.onopen = function() {        
        dbg('web socket open', true);
        $('#live').text('CONNECTED');
        $("#live").css("background-color",'#B2BB1E');
    };

    ws.onmessage = function(event) {        
        //dbg('incomming message', true);
        server_message_handler(event.data);
    };
    ws.onclose = function() {        
        dbg('closing websockets', true);
        $('#live').text('OFFLINE');
        $("#live").css("background-color",'#FF0000');
    };
}

function server_message_handler(data){
    //dbg('server_message_handler() data = ' + data, true)    
    try {
        
        //TODO - not sure why I have to parse twice
        JsonData = JSON.parse(data);
        //console.log("JsonData = " + JsonData);
        //console.log("JsonData.time = " + JsonData.time);
        var timestamp = new Date(JsonData.time);          
        var row_data = [
            timestamp.toLocaleTimeString(),            
            JsonData.name,
            JsonData.level,
            JsonData.line_no,            
            JsonData.msg,
            JsonData.filename,
            JsonData.funcname,
            JsonData.hostname,
            JsonData.username,
            ];
        //console.log("row_data = " + row_data);
        table.row.add(row_data).draw();

    } catch(e) {
        dbg('JSON.parse error: "' + e + '". JsonData = ' + JsonData);
        return;
    }
}

///////////////////////////////////////////////////////////////////////
// TABLE
window.Table = function(canvasId){ // id of the "main" div as parameter
    'use strict';
    var mod = {}
    mod.canvasId = canvasId;
    mod.tables = [];
    var main = function() {
    // Cache it for speed (only ever need to query once)
    if (main._elem)
        return main._elem;
    main._elem = document.getElementById(canvasId);
    return main();
    };   

    mod.draw = function(Opt){
        mod.tables = $(mod.canvasId).DataTable({Opt});
    };

    return mod;
};
window.t = Table("#example");

///////////////////////////////////////////////////////////////////////
// WebSocketConnection Class
window.WebSocketConnection = function (host,url) {
  console.log("WebSocketConnection")
  this.debug  = 1;
  this.host   = host;
  this.ws_url = url;
  this.websocket_address = "ws://" + this.host + "/websocket/" + this.ws_url;  
  
  try {
    this.ws = new WebSocket(this.websocket_address);  
    $('#live').text('CONNECTED');
   } catch(e) {
    console.log('WebSocket error: ' + e );        
   }
'use strict';
this.ws.onmessage = function(event){
    console.log(event);
    try {
        var JsonData = JSON.parse(event.data);
        console.log(JsonData);
    } 
    catch(e) {
        console.log('JSON.parse error: "' + e + '". JsonData = ' + event.data);     
    }
}

this.ws.onclose = function(){
    console.log("WebSocketConnection: connection closed to ");
    $('#live').text('OFFLINE');
}

this.send = function(cmd){
    if (this.ws.readyState == this.ws.OPEN){        
        this.ws.send(JSON.stringify(cmd));
    }
}
return this;
};

var dataSet = [['12:00:00','self','1',144,"Test",'ulog.js',"var dataSet","localhost",'root'],];
///////////////////////////////////////////////////////////////////////
// MAIN GUI - jQUERY
//
//
$(document).ready(function() {
    dbg('Document ready', true);
    open_websocket(location.host, "log");

    table = $('#example').DataTable({
        "order": [[ 0, "desc" ]],
        "scrollY": "500px",
         "columns": [
            { "title": "Time" },
            { "title": "Loger" },
            { "title": "Level" },
            { "title": "Line#" },            
            { "title": "Msg" },
            { "title": "Filename" },
            { "title": "Funcname" },
            { "title": "Hostname" },
            { "title": "Username" },
        ],
         "columnDefs": [
             { "width": "2%", "targets": 2 },
             { "width": "2%", "targets": 3 },
             { "width": "60%", "targets": 4 }
             ]
    });

    table.column( 6 ).visible( false );
    table.column( 7 ).visible( false );
    table.column( 8 ).visible( false );
    table.columns.adjust().draw( false );

    $( "#button_clear" ).click(function() {
    table.clear().draw();
    });

    $( "#button_run_stop" ).click(function() {
    table.clear().draw();
    });

    
});