var ui = new Vue({
    el: '#app',

    data: {
        logs: [],
        sync: { push: { stats: '?' }, pull: { stats: '?' } },
        syncactive: true,
        creatures: [],
        nEntries: '?',
        inpName: '',
        inpSpecies: '',
    },

    methods: {
        async addCreature() {
            log('add', this.inpName, this.inpSpecies);
            await db.put({
                _id: new Date().toJSON(),
                name: this.inpName,
                species: this.inpSpecies,
            });
            this.inpName = this.inpSpecies = '';
            await this.updateCreatureList();
        },

        async removeCreature(creature) {
            await db.remove(creature);
            await this.updateCreatureList();
        },

        async updateCreatureList() {
            var results = await db.allDocs({ include_docs: true });
            ui.creatures = results.rows.map(r => r.doc);
            ui.nEntries = results.rows.length;
        },
    },
});

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
    ui.logs.unshift([timestamp, result]);
}

function thenlog(msg) {
    return function (...params) { log(msg, ...params); };
}
