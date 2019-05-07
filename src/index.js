var PouchDB = require('pouchdb-node');
var express = require('express');
var expressPouch = require('express-pouchdb');
var corser = require('corser');
// var inspect = require('util').inspect;

CustomPouchDB = PouchDB.defaults({
    prefix: './db/', // location on disk
});

// Monitor the DB for changes
db = CustomPouchDB('library-1')
db.changes({
    live: true,
    include_docs: true,
    since: 'now',
}).on('change', function (e) {
    console.log('Change: ' + JSON.stringify(e));
}).on('error', function (e) {
    console.log('Error: ' + JSON.stringify(e));
});

// Run a normal webserver using static files from the `public` directory
var webApp = express();
webApp.use('/', express.static('public'));
webApp.listen(3000);

// Run the database on a webserver on a different port
var dbApp = express();
dbApp.use(corser.create({
    methods: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE'],
}));
pouchHandler = expressPouch(CustomPouchDB);
dbApp.use('/', pouchHandler);
dbApp.listen(5984);

console.log("Ready");
