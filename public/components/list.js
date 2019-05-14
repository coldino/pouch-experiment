Vue.component('list', {
    props: ['entries'],

    data: () => ({
        inpValue: '',
    }),

    methods: {
        addEntry() {
            log("List", "Add entry", this.inpValue)
            this.$emit('add', this.inpValue);
        },

        removeEntry(entry) {
            log("List", "Remove entry", entry);
            this.$emit('remove', entry);
        },
    },

    template: '#list',
});
