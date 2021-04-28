import { pluck, renameKeys, convertBoolQSValue, toQuery } from '../utils.js';

export function qsMapToQuery(hash, qsMap, valueConverter) {
    // take the keys we are interested in from the hash
    const keys = Object.keys(qsMap);
    const plucked = pluck(hash, keys);
    // then map those to the correct mapped key
    const params = renameKeys(plucked, qsMap);
    
    return toQuery(params, valueConverter);
}

export function createBooleanValueConverter(truthy, falsy) {
    function asBool(value) {
        return convertBoolQSValue(value, truthy, falsy);
    }
    
    return function valueConverter(value) {
        if (value === true || value === false) {
            // we want to convert boolean values
            return asBool(value);
        }
        
        return value;
    };
}

export function strToQsMap(str) {
    return str
        .split(',')
        .reduce((memo, group) => {
            let [ name, mapName ] = group.split(':');
            
            if (!mapName) {
                // same as the name
                mapName = name;
            }
            
            return {
                ...memo,
                [name]: mapName
            };
        }, {});
}
