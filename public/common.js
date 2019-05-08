
const HOST = 'http://localhost:5984/';

function log(...params) {
    var result;
    if (params.length == 1) params = params[0];
    if (typeof (params) == typeof ('')) {
        result = params;
    } else {
        result = JSON.stringify(params);
        result = result.substr(1, result.length - 2);
    }

    timestamp = new Date().toLocaleTimeString(undefined, { hour12: false });
    console.log(timestamp + ":", result);

    if (ui && ui.logs) {
        ui.logs.unshift([timestamp, result]);
    }
}

function thenlog(msg) {
    return function (...params) { log(msg, ...params); };
}
