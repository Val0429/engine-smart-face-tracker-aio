export function findFieldValue(data: any, key?: string) {
    if (!key) return data;
    /// get real data
    let seperates = key.split(".");
    let length = seperates.length;
    for (let i=1; i<=length; ++i) {
        if (!data) break;
        data = data[seperates[i-1]];
    }
    return data;
}

export function deleteFieldValue(data: any, key: string) {
    /// get real data
    let seperates = key.split(".");
    let length = seperates.length;
    for (let i=1; i<=length; ++i) {
        if (!data) break;
        if (i==length) delete data[seperates[i-1]];
    }
}

export function filterRegex(query: Parse.Query, config: any, key?: any, matchkey?: any, dodelete: boolean = true) {
    let value = findFieldValue(config, key);
    if (value == undefined) return;
    matchkey = matchkey || key;
    query.matches(matchkey, new RegExp(value), 'i');
    dodelete && deleteFieldValue(config, key);
}

export function filterEqualTo(query: Parse.Query, config: any, key?: any, matchkey?: any, dodelete: boolean = true) {
    let value = findFieldValue(config, key);
    if (value == undefined) return;
    matchkey = matchkey || key;
    query.equalTo(matchkey, value);
    dodelete && deleteFieldValue(config, key);
}

export function filterContainedIn(query: Parse.Query, config: any, key?: any, matchkey?: any, dodelete: boolean = true) {
    let value = findFieldValue(config, key);
    if (value == undefined) return;
    matchkey = matchkey || key;
    query.containedIn(matchkey, value);
    dodelete && deleteFieldValue(config, key);
}