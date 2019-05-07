
const HOST = 'http://localhost:5984/';

var db = new PouchDB('library-1');
var remotedb = new PouchDB(HOST+'/library-1');

// Enable syncing of the local library to the server
var sync = db.sync(remotedb, {live: true, retry: true})
// ...and hook up all sorts of event handlers for debug display
.on('change', function (e) {
    // handle change - maybe update UI
    log("Sync change:", e);
    ui.updateCreatureList();
}).on('paused', function (e) {
    // replication paused (e.g. replication up to date, user went offline)
    log("Sync idle");
    ui.syncactive = false;
}).on('active', function () {
    // replicate resumed (e.g. new changes replicating, user went back online)
    log("Sync active");
    ui.syncactive = true;
}).on('denied', function (e) {
    // a document failed to replicate (e.g. due to permissions)
    log("Sync denied:", e);
}).on('complete', function (e) {
    // handle complete
    log("Sync completed:", e);
    ui.syncactive = false;
}).on('error', function (e) {
    // handle error
    log("Sync error:", e);
});

ui.sync = sync;

log("Started");
ui.updateCreatureList();
