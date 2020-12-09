var personRoles: Config[] = [
    [0, "VIP", `
        /**
         * VIP Role.
         */
    `],

    [1, "General"],

    [2, "Blacklist"],
];

export default personRoles;

export type Config = [number, string, string] | [number, string];