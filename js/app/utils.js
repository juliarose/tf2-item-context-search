// converts a string to title case while keeping minor words (of or a) non-capitalized
export function toTitleCase(str) {
    function isMinorWord(word) {
        const minorWords = [
            'of',
            'a'
        ];
        
        return minorWords.includes(word.toLowerCase());
    }
    
    str = str
        .split(' ')
        .map((word) => {
            if (isMinorWord(word)) {
                return word.toLowerCase();
            }
            
            return word[0].toUpperCase() + word.substr(1).toLowerCase();
        })
        .join(' ');
    
    if (str.includes('-')) {
        str = str
            .split('-')
            .map((word) => {
                if (isMinorWord(word)) {
                    return word.toLowerCase();
                }
                
                return word[0].toUpperCase() + word.substr(1);
            })
            .join('-');
    }
    
    str = str[0].toUpperCase() + str.substr(1);
    
    return str;
}

export function isValidURL(str) {
    try {
        // will throw if url is not valid
        const url = new URL(str);
        
        return /^https?\:$/.test(url.protocol);
    } catch (e) {
        return false;  
    }
}

export function escapeRegExp(str) {
    return str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

export function convertBoolQSValue(value, truthy = 1, falsy = 0) {
    return value ? truthy : falsy;
}

// converts params to a query string
// value convertor is a function that will converter any given values to something else
// for example boolean (true or false) to 1/1
export function toQuery(params, valueConverter) {
    const encode = encodeURIComponent;
    const isFn = typeof valueConverter === 'function';
    
    return '?' + Object.entries(params)
        .map(([key, value]) => {
            if (value === null || value === undefined || value === '') {
                // do not apply empty values
                return null;
            } else if (isFn) {
                value = valueConverter(value, key);
            }
            
            return [key, value].map(encode).join('=');
        })
        .filter(Boolean)
        .join('&');
}

export function uniq(arr, filter) {
    if (filter === undefined) {
        // primitive uniq method
        return [...new Set(arr)];
    }
    
    const filterIsFunction = typeof filter === 'function';
    // for storing values
    let valueList = {};
    
    return arr.filter((item, i, array) => {
        const value = (
            // the filter is a function
            filterIsFunction ?
                filter(item, i, array) :
                // the filter is a string
                item[filter]
        );
        
        // the value for this item already exists
        if (valueList[value]) {
            return false;
        }
        
        // store the value
        valueList[value] = true;
        
        return true;
    });
}

export function renameKeys(obj, map) {
    // clone the original object so we do not modify the original
    const clone = {
        ...obj
    };
    
    for (let originalKey in map) {
        const value = obj[originalKey];
        const newKey = map[originalKey];
        
        // no value from object
        // or the new key is the same as the original
        if (value === undefined || newKey === originalKey) {
            continue;
        }
        
        // assign value to mapped key
        clone[newKey] = value;
        
        // delete the original
        delete clone[originalKey];
    }
    
    return clone;
}

// pluck certain key/value pairs from object
export function pluck(obj, keys) {
    let result = {};
    
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        
        if (obj.hasOwnProperty(key)) {
            result[key] = obj[key];
        }
    }
    
    return result;
}

// a faster method of replacing a match from a regular expression
// this does not require passing a string or regular expression to the replace function to remove the matched item,
// instead slicing the input string based on the match
export function replaceMatch(match) {
    const { index, input } = match;
    const length = match[0].length;
    
    if (index === 0) {
        // we only need one slice
        return input.slice(index + length);
    } else if (index + length === input.length) {
        return input.slice(0, index);
    }
    
    return input.slice(0, index) + input.slice(index + length);
}
