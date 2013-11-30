//----------------------------------------------------------
// Server with request routing (static files + API).
//----------------------------------------------------------
var http = require('http');
var url = require("url");
var path = require('path');
var fs = require('fs');

var port = '80';

var address = '127.0.0.1';

http.createServer(function(request, response) {
    console.log("Request for: " + request.url);

    var requestPath = url.parse(request.url).pathname;
    var requestQuery = url.parse(request.url).query;

    // Request routing.
    switch(requestPath)
    {
        // -------------------- STATIC ---------------------
        case '/':
            fs.readFile(path.join(__dirname, 'presentation/views/index.html'),
                function(err, data){ response.end(data);}
            );
            break;

        case '/styles.css':
            fs.readFile(path.join(__dirname, 'presentation/styles/styles.css'),
                function(err, data){ response.end(data);}
            );
            break;

        case '/client.js':
            fs.readFile(path.join(__dirname, 'presentation/scripts/client.js'),
                function(err, data){ response.end(data);}
            );
            break;

        // TODO: Add favicon.ico to static response.

        // -------------------- API ---------------------

        default:
            response.end("NO HANDLER.");
    }
}).listen(port, address);

console.info("Server started at " + address + ":" + port);
