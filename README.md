This is a simple experiment into Offline-first data syncing with PouchDB on both the client and server.

* Client has a local PouchDB and maintains a constant sync with the server while connected.
* Server runs two things:
  * Simple static-file webserver for the website.
  * The PouchDB server using express-pouchdb.

WARNING: There's no authentication or permission systems in place. "Admin Party" mode.

## Getting started

Requires Node.js (at least version 9, I would guess, but the latest stable is the best option).

```sh
> npm install
> npm start
```

After that you can browse http://localhost:3000/ for the client or http://localhost:5984/_utils/ for the built-in DB management interface Fauxton.

Test the syncing by using two different browsers (i.e. Chrome and Edge) at the same time.
