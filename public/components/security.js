Vue.component('database-security', {
    props: ['db'],

    template: '#database-security',

    data: () => ({
        admin_users: [],
        admin_roles: [],
        member_users: [],
        member_roles: [],
    }),

    methods: {
        addAdminUser(name) {
            log("addAdminUser", name);
        },

        removeAdminUser(entry) {
            log("removeAdminUser", entry);
        },
    }
});
