var userRoles: Config[] = [
    // [0, "Administrator", `
    //     name?: string;
    // `],

    // [1, "Supervisor", `
    //     name?: string;
    // `],

    // [2, "Operator", `
    //     name?: string;
    //     buildings: [OLEDBuildings, ...Array<OLEDBuildings>];
    // `, ["OLEDBuildings"]],

    // [99, "SystemAdministrator", `
    //     name?: string;
    // `]
];

export default userRoles;

export type Config = [number, string, string, string[]] | [number, string, string] | [number, string];