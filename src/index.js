const fetch = require('node-fetch');
const express = require('express');
const cookieParser = require('cookie-parser');
const router = require('express-promise-router');
const debug = require('debug')('app');
const util = require('util');

// Read local config, if present
require('dotenv').config();
const db_creation_roles = process.env.DB_CREATION_ROLES.split(',');


function validatedSessionCookie(value) {
    if (!util.isString(value) || value.length < 8 || /[\x0A\x0D: ]/.test(value)) {
        debug('validatedSessionCookie failed');
        throw { status: 400, message: 'Invalid session' };
    }
    return value;
}

function validatedDatabaseName(value) {
    if (!util.isString(value) || value.length < 1 || !/^[a-z][a-z0-9_$()+/-]*$/.test(value)) {
        debug('validatedDatabaseName failed');
        throw { status: 400, message: 'Invalid database name' };
    }
    return value;
}

function toBase64(value) {
    return Buffer.from(value).toString('base64');
}

function getBasicAuthHeader() {
    // TODO: Cache this
    var content = 'Basic ' + toBase64(process.env.DB_ADMIN_USER + ":" + process.env.DB_ADMIN_PWD);
    return content;
}

function doListsIntersect(a, b) {
    for (var i = 0; i < a.length; i++) {
        for (var j = 0; j < b.length; j++) {
            if (a[i] == b[j]) return true;
        }
    }
    return false;
}


async function handleCreateDb(req, res) {
    // Get and check the relevant inputs
    var sessionCookie = validatedSessionCookie(req.cookies['AuthSession']);
    var dbName = validatedDatabaseName(req.query.name);
    debug("handleCreateDb", "using db =", dbName, " and session =", sessionCookie);

    // Use it to fetch the user's roles from Couch
    debug("handleCreateDb", "fetching user's roles");
    var sessionInfoReq = await fetch(process.env.DB_HOST + '/_session', {
        method: 'get',
        headers: { 'Cookie': `AuthSession=${sessionCookie}` },
    });
    var sessionInfo = await sessionInfoReq.json();
    if (!util.isObject(sessionInfo) || !util.isObject(sessionInfo.userCtx) || !util.isString(sessionInfo.userCtx.name) || !util.isArray(sessionInfo.userCtx.roles)) {
        debug("handleCreateDb", "invalid response from Couch or AuthSession invalid");
        throw { status: 401, message: 'User authentication failed' };
    }
    debug("handleCreateDb", "received user =", sessionInfo.userCtx.name, "with roles =", (sessionInfo.userCtx.roles || []).join(','));

    // Check if the user has one of the required roles
    if (!doListsIntersect(sessionInfo.userCtx.roles, db_creation_roles)) {
        debug("handleCreateDb", "correct role missing");
        throw { status: 403, message: 'User is not authorized to create a database' };
    }

    // Perform the database creation as admin
    debug("handleCreateDb", "sending database creation command as admin");
    var createReq = await fetch(process.env.DB_HOST + '/' + dbName, {
        method: 'put',
        headers: { 'Authorization': getBasicAuthHeader() },
    });
    var createResult = await createReq.json();
    debug("handleCreateDb", "received createResult =", createResult);
    if (!createResult.ok) {
        debug("handleCreateDb", "create DB call failed");
        throw { status: 500, message: `${createResult.error || 'error'}: ${createResult.reason}` };
    }

    // All good
    debug("handleCreateDb", "success");
    return res.json({ ok: true });
}

function errorHandler(err, req, res, next) {
    debug('error handler triggered:', err);
    err = Object.assign({ status: 500, message: 'Internal server error' }, err);
    res.status(err.status).json({ status: err.status, ok: false, message: err.message });
    return;
}

function verifyAcceptsJson(req, res, next) {
    debug('checking request accepts json');
    if (!req.accepts('json')) throw { status: 406, message: 'Request must accept JSON' };
    next();
}

// Handling for server functions
apiV1Routes = router();
apiV1Routes.use(verifyAcceptsJson)
apiV1Routes.use(cookieParser());
apiV1Routes.post('/createDb', handleCreateDb);
apiV1Routes.get('/test', (req, res) => { debug('boo!'); res.send('hello'); });
apiV1Routes.get('/err', (req, res) => { throw { status: 418, message: "I'm a teapot, really" } });
apiV1Routes.use(errorHandler);

// Run a normal webserver using static files from the `public` directory
var webApp = express();
webApp.use('/api/v1', apiV1Routes);
webApp.use('/', express.static('public'));
webApp.listen(3000, () => console.log("Ready"));



// var PouchDB = require('pouchdb-node');
// var expressPouch = require('express-pouchdb');
// var corser = require('corser');

// db = PouchDB('http://localhost:5984/library-1');

// // Monitor the DB for changes
// db.changes({
//     live: true,
//     include_docs: true,
//     since: 'now',
// }).on('change', function (e) {
//     console.log('Change: ' + JSON.stringify(e));
// }).on('error', function (e) {
//     console.log('Error: ' + JSON.stringify(e));
// });

// // Run the database on a webserver on a different port
// CustomPouchDB = PouchDB.defaults({
//     prefix: './db/', // location on disk
// });
// var dbApp = express();
// dbApp.use(corser.create({
//     methods: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE'],
// }));
// pouchHandler = expressPouch(CustomPouchDB);
// dbApp.use('/', pouchHandler);
// dbApp.listen(5984);


