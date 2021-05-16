import { tabs } from '../browser.js';
import { qsMapToQuery, createBooleanValueConverter, strToQsMap } from './helpers.js';
import config from '../config.js';

export function createBaseContext() {
    return {
        contexts: [
            'selection'
        ],
        documentUrlPatterns: [
            '<all_urls>'
        ]
    };
}

// creates a function for building contexts for links
export function createItemSearchContextGenerator(schema) {
    function createContextClickHandler(generator) {
        return function onContextClick(info) {
            const name = info.selectionText;
            // we've already pre-processed this string as valid
            const hash = schema.processName(name);
            // generate the url using the given generator
            const url =  generator(hash);
            
            config.set('popup_name', name);
            tabs.create({
                url
            });
        }
    }
    
    // creates context menu item
    return function createContextProps({ id, title, visible, generator }) {
        const baseContext = createBaseContext();
        
        return {
            id,
            title,
            visible,
            onclick: createContextClickHandler(generator),
            ...baseContext
        };
    };
}

export function createHashToLink(uri) {
    // converts true/false to 1/0
    const valueConverter = createBooleanValueConverter(1, 0);
    // match query string
    const reQs = /\$\{([\w\:,]+)\}/;
    const qsMapMatch = uri.match(reQs);
    const encode = encodeURIComponent;
    
    return function hashToLink(hash) {
        let url = uri;
        
        if (qsMapMatch) {
            const qsMap = strToQsMap(qsMapMatch[1]);
            const qs = qsMapToQuery(hash, qsMap, valueConverter);
            
            url = url.replace(reQs, qs);
        }
        
        const isMissingRequiredValue = [...url.matchAll(/\$\?([\w_]+)/g)]
            // get hash key
            .map(match => match[1])
            // check if that key is not in hash
            .some(k => !hash.hasOwnProperty(k));
        
        // missing a hash value that is required
        // e.g. missing effect name
        if (isMissingRequiredValue) {
            return null;
        }
        
        for (let k in hash) {
            let v = hash[k];
            const reKey = new RegExp(`\\\$(\\\?)?${k}`);
            const match = url.match(reKey);
            
            if (!match) {
                // no replacement to be made
                continue;
            }
            
            if (k !== 'sku') {
                // sku should not be encoded
                v = encode(v);
            }
            
            // replace the url
            url = url.replace(reKey, v);
        }
        
        return url;
    };
}
