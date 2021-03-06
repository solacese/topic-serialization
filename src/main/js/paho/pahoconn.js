// Requires javascript modules:
//      paho-mqtt/1.1.0/mqttws311.js
//
// Requires the following HTML elements:
//      <input id=inputHost>
//      <p id=connDetails></p>
//      <p id=subDetails></p>
//
// Requires the following CSS styles in style.css
//      .connectionInfo : sets fontography for connection info display

var PahoConn = (function() {

    // - + - + - + - + - + - + - + - + - + - + - + - + -
    //   Member variables
    // - + - + - + - + - + - + - + - + - + - + - + - + -
    var context = {
        session:   null,
        hostString:'localhost',
        port:      8000,
        username:  'default',
        hasPassword:false,
        password:  'default',
        topic:     'dmr/topic/green',
        received:  0,
        sendMsgs:  false,
        color:     'green',
        timerId:   -1
    }


    // - + - + - + - + - + - + - + - + - + - + - + - + -
    //   Public Interface UI-invoked functions
    // - + - + - + - + - + - + - + - + - + - + - + - + -
    
    var onConnect = function (ctx) {
	// merge in the user-submitted context over default context
        for( var k in ctx ) {
            context[k] = ctx[k]
        }
        createSession()
        connectSession()
    }

    var onDisconnect = function () {
        disconnectSession()
        document.getElementById('connDetails').innerHTML = ''
        document.getElementById('subDetails').innerHTML = ''
        clearTimeout(context.timerId) // stops any periodic msg-sender
    }

    var toggleSender = function(cb) {
        context.sendMsgs = cb.checked
    }


    // - + - + - + - + - + - + - + - + - + - + - + - + -
    //   Private event handlers
    // - + - + - + - + - + - + - + - + - + - + - + - + -

    // MESSAGE EVENT CALLBACK
    function onMessage(msg) {
        context.received++
        var text = msg.destinationName.match(/([^\/]+)$/)[0]
        if ( text == null ) {
            text = msg.payloadString
        }
        if ( text == null ) {
            text = 'Gak!'
        }
        // document.getElementById('msgDetails').innerHTML += '<br>topic:' + text
        document.getElementById('msgDetails').innerHTML = 'received:<font size=20>' + context.received + '</font>'
        context.callback( text )
    }

    // SESSION EVENT CALLBACKS
    function onConnected() {
        // Once a connection has been made, make a subscription and start sending
        logMsg( "--> onConnect" )
        addSub( context.topic )
        schedSend()
    }

    function onConnectionLost(resp) {
        if ( resp.errorCode !== 0 ) {
            logMsg( "--> onConnectionLost:" + resp.errorMessage )
            clearTimeout( context.timerId )
        }
    }


    // - + - + - + - + - + - + - + - + - + - + - + - + -
    //   Private Internal functions
    // - + - + - + - + - + - + - + - + - + - + - + - + -

    function createSession() {
        if ( context.session !== null ) {
            logMsg( "SKIPPING: Session SEEMS to be already created.")
            return
        }
        logMsg( "CONNECTING to URL:" + context.hostString
                    + ",USER:" + context.username )
        try {
            context.session = new Paho.Client( 
                context.hostString, Number(context.port), context.username
            )
            context.session.onConnectionLost = onConnectionLost
            context.session.onMessageArrived = onMessage
        }
        catch(error) {
            logError( "createSession", error )
        }
    }

    function connectSession() {
        var options = {
                onSuccess:    onConnected,
                userName:     context.username,
                cleanSession: false,
                reconnect:    true
        }
        if( context.hasPassword == true ) {
            options.password = context.password
        }
        try {
            context.session.connect( options )
        }
        catch(error) {
            logError( "connectSession", error )
        }
    }

    function disconnectSession() {
        try {
            context.session.disconnect()
            context.session = null
        }
        catch(error) {
            logError( "disconnectSession", error )
            context.session = null
        }
    }

    function addSub(sub) {
        logMsg( "SUBSCRIBE: " + sub )
        try {
            context.session.subscribe( sub, { qos:1 } )
            document.getElementById('connDetails').innerHTML = 'I am connected to ' + context.hostString
            document.getElementById('subDetails').innerHTML = 'I am subscribed to ' + sub
        }
        catch(error) {
            logError( "addSub", error )
        }
    }

    function schedSend() {
        if( context.sendMsgs && context.session !== null ) {
            realSend()
        }
        // ALWAYS set timer for recursive call, in case they disable/re-enable sender
        context.timerId = setTimeout( schedSend, 1000 )
    }

    function realSend() {
        if ( context.session == null ) {
            return
        }
        // Send logic
        msg = new Paho.Message(context.color)
        msg.destinationName = context.topic
        msg.qos = 1
        try {
            context.session.send( msg )
        }
        catch (error) {
            logError( "Failure publishing msg", error )
        }
    }


    // - + - + - + - + - + - + - + - + - + - + - + - + -
    //  LOGGING
    // - + - + - + - + - + - + - + - + - + - + - + - + -
    
    function logMsg(msg) {
        console.log(msg)
    }

    function logError(fname, err) {
        // First format and log the error
        var subcodeStr = ( err.subcode==null ? "no subcode" : err.subcode.toString() )

        var msg = "ERROR IN "+fname+"\n"+"Subcode("
            + subcodeStr  + ") "
            + "Msg:{" + err.message + "} Reason:{" + err.reason + "}\n"

        logMsg(msg)

        // Then log the stack-trace
        if ( err.stack != null ) {
            logMsg( "STACK:" + err.stack.toString() )
        }
    }


    // - + - + - + - + - + - + - + - + - + - + - + - + -
    //  PUBLIC API
    // - + - + - + - + - + - + - + - + - + - + - + - + -

    return {
        toggleSender : toggleSender,
        onConnect    : onConnect,
        sendMsg      : realSend,
        onDisconnect : onDisconnect
    }
})()
