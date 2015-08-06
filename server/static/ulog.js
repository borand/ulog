///////////////////////////////////////////
// Global variables
var active_tab;
var debug_websocket = false;
var debug_js = true;
var debug_all = true;
var table;
var ws;
var JsonData;   
/////////////////////////////////////////////////////////////////////
// UTILITY FUNCTIONS
//
function dbg(message, show) {   
    show_server_msg(message, show); 
}

function SendCmd(cmd, val) {
    return $.getJSON('/cmd/', "cmd=" + cmd + "&param=" + val, function(data) {          
        $("#cmd_status").text(data.cmd);
    });
}

function show_server_msg(message, show) {   
    if (show)
    {   
        console.log(message);        
    }
}

function console_response_text(message, show) {
    if(show){
        dbg(message,true);
    }
}

function set_object_value(id, val){
    var datarole = $("#"+id).attr('data-role');
    dbg('id:' + id + " data-role: " + datarole + "  val: " + val, true);
    switch(datarole){
        case 'slider':
        dbg('case: slider', true);
        $('#' + id).val(val).slider("refresh");
        break;
        case 'flipswitch':          
        dbg('about to flip the switch value to:' + val + ' currently set to: ' + $('#' + id).val(), true);
        $('#' + id).val(val).flipswitch("refresh");
        break;
        case 'text':
        $('#' + id).text(val);
        break
        default:
        dbg('case: default', true);
        $('#' + id).val(val)[datarole]("refresh");
    }
}

///////////////////////////////////////////////////////////////////////
// WEBSOCKETS FUNCTIONS
//MessageHandler
//
function open_websocket(hostname, hostport, hosturl) {

    dbg('Attempting to open web socket',true);
    function show_message(message) {
        show_server_msg(message);       
    }

    var websocket_address = "ws://" + hostname + ":" + hostport + "/websocket/" + hosturl;
    ws = new WebSocket(websocket_address);
    
    ws.onopen = function() {
        //debug_websocket = $('#debug_websocket').prop("checked");
        dbg('web socket open', true);
        $('#live').text('CONNECTED');
        $("#live").css("background-color",'#B2BB1E');
    };

    ws.onmessage = function(event) {        
        dbg('incomming message', true);
        server_message_handler(event.data);
    };
    ws.onclose = function() {        
        dbg('closing websockets', true);
        $('#live').text('OFFLINE');
        $("#live").css("background-color",'#FF0000');
    };
}

function server_message_handler(data){
    
    try {
        JsonData = JSON.parse(data);
        table.row.add( [
            JsonData.time,            
            JsonData.name,
            JsonData.level,
            JsonData.line_no,
            JsonData.filename,
            JsonData.funcname,
            JsonData.msg,
            JsonData.hostname,
            JsonData.username,
            ] ).draw();

    } catch(e) {
        dbg('JSON.parse error: "' + e + '". JsonData = ' + JsonData);
        return;
    }
}

function connect_to_websocket_host(){
    var hostname = $('#hostname').attr("value");
    var hostport = $('#hostport').attr("value");
    var hosturl  = $('#hosturl').attr("value");
    dbg('connect_to_websocket_host(' + hostname +':' + hostport + '/' + 'websocket/' + hosturl, true);
        open_websocket(hostname, hostport, hosturl);

    }
///////////////////////////////////////////////////////////////////////
// MAIN GUI - jQUERY
//
//

var WebSocketConnection = function (host,url) {
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

this.ws.onmessage = function(event){
    console.log(event);
    try {
        JsonData = JSON.parse(event.data);
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
};

$(document).ready(function() {
    dbg('Document ready', true);
    //connect_to_websocket_host();


    table = $('#example').DataTable({
        dom: 'C<"clear">lfrtip',
        "colVis": {
            "buttonText": "Change columns"
        },
        "order": [[ 0, "desc" ]],
        "scrollY": "500px",
        "autoWidth": false,
        "paging": false,
        "columnDefs": [
             { "width": "75%", "targets": 6 }
             ]
    } );

    // table.column( 0 ).visible( false );
    // table.column( 3 ).visible( false );
    // table.column( 4 ).visible( false );
    table.column( 7 ).visible( false );
    table.column( 8 ).visible( false );
    table.columns.adjust().draw( false );

    // $('#example tfoot th').each( function () {
    //     var title = $('#example thead th').eq( $(this).index() ).text();
    //     $(this).html( '<input type="text" placeholder="'+title+'" />' );
    // } );

    // Apply the search
    table.columns().every( function () {
        var that = this;
 
        $( 'input', this.footer() ).on( 'keyup change', function () {
            that
                .search( this.value )
                .draw();
        } );
    } );

    $( "#button_clear" ).click(function() {
    table.clear().draw();
    });

    $( "#button_run_stop" ).click(function() {
    table.clear().draw();
    });

    
});