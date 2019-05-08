var ui = new Vue({
    el: '#app',

    data: {
        logs: [],

        changesState: '?',

        entries: [],
        nEntries: '?',

        userCtx: undefined,

        inpName: '',
        inpPwd: '',

        inpLoginUser: '',
        inpLoginPwd: '',
    },

    methods: {
        async addEntry() {
            log('add', this.inpName, this.inpPwd);
            await db.put({
                _id: 'org.couchdb.user:' + this.inpName,
                name: this.inpName,
                password: this.inpPwd,
                type: 'user',
                roles: [],
            });
            this.inpName = this.inpPwd = '';
            await this.updateList();
        },

        async removeEntry(entry) {
            await db.remove(entry);
            await this.updateList();
        },

        async updateList() {
            log('Attempting to fetch list');
            var users = [];
            try {
                var results = await db.allDocs({ include_docs: true });
                var users = results.rows.filter(row => row.doc.type == "user")
            } catch (e) {
                log('Unable to fetch users:', e);
            }
            ui.entries = users.map(r => r.doc);
            ui.nEntries = users.length;
        },

        async performLogin() {
            try {
                await db.logIn(ui.inpLoginUser, ui.inpLoginPwd);
                this.inpLoginUser = this.inpLoginPwd = '';
                log("Login successful");
            } catch (e) {
                log("Login failed:", e);
            }
            this.refreshSession();
        },

        async refreshSession() {
            this.userCtx = undefined;
            try {
                var session = await db.getSession();
                if (session.userCtx && session.userCtx.name) {
                    log('User has been updated');
                    this.userCtx = session.userCtx;
                }
            } catch (e) {
                log('getSession failed:', e);
            }

            await this.ensureChangeMonitor();
            await this.updateList();
        },

        async ensureChangeMonitor() {
            if (!changes) {
                log('Starting change monitor');
                changes = db.changes({
                    live: true,
                    include_docs: true,
                    since: 'now',
                }).on('change', function (e) {
                    log('Incoming change:', e);
                    ui.updateList();
                }).on('error', function (e) {
                    log('Incoming error:', e);
                    ui.changesState = 'error-closed';
                    changes = undefined;
                }).on('complete', function () {
                    log('Changes complete');
                    ui.changesState = 'complete-closed';
                    changes = undefined;
                });
            }
        },

        async beginConnect() {
            log('Checking for existing session');
            await this.refreshSession();

            if (this.userCtx) {
                log('Found session');
                await this.ensureChangeMonitor();
                await this.updateList();
            }
            ui.changesState = 'listening';
        },
    },
});

var db = new PouchDB(HOST + '_users', {
    skip_setup: true,
    fetch: (url, opts) => fetch(url, { ...opts, credentials: 'include' })
});
var changes = undefined;
ui.beginConnect();
log("Started");
