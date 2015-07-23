///////////////////////////////////////////
// Global variables
var active_tab;
var debug_websocket = false;
var debug_js = true;
var debug_all = true;
var t;
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

function console_response_msg(message, show) {
    if(show){
        dbg(message,true);
        selected_chan = $("#select-chan").val();
        chan = message['FROM'];
        console.log(message['MSG'])
        //$("#console").html($("#console").text() + chan + "> " + "cmd [" + message['MSG'][1] + "]: " + message['MSG'][2].data + '\n');
        if (selected_chan === chan || selected_chan == 'All')
        {
            $("#console").html($("#console").text() + chan + "> " + JSON.stringify(message['MSG']['data']) + '\n');
            var psconsole = $('#console');
            psconsole.scrollTop(psconsole[0].scrollHeight - psconsole.height());
        }
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

function parse_message(message_text){
    var temp;
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
        t.row.add( [
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
$(document).ready(function() {
    dbg('Document ready', true);
    connect_to_websocket_host();
    t = $('#example').DataTable();
});