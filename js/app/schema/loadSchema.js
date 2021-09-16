import { getExtensionURL } from '../browser.js';
import { db } from '../db.js';

const ONE_MINUTE = 60 * 1000;
const ONE_DAY = 24 * 60 * ONE_MINUTE;
const asJSON = (str) => JSON.parse(str);
// gets the time since now
const timeSince = (date) => new Date().getTime() - date.getTime();

export default async function loadSchema(options = {}) {
    const filename = 'schema.json';
    const source_url = 'https://gist.githubusercontent.com/juliarose/59b6751c36d160e6ef3e33fa26d7a1fc/raw/schema.json';
    // we just look for these based on a filename
    const file = await db.files.where({ filename }).first();
    
    // file exists and has been updated within the past n days
    if (file && (timeSince(file.last_updated) <= 3 * ONE_DAY || options.skipUpdate)) {
        return file.blob.text().then(asJSON);
    }
    
    // file was last fetched within the last n minutes
    // we don't want to fetch this item excessively
    if (file && timeSince(file.last_fetched) <= 5 * ONE_MINUTE) {
        // throw an error
        throw new Error('Could not load file');
    }
    
    // file either does not exist or it is outdated
    // fetch from url
    let response;
    
    try {
       response = await fetch(source_url); 
    } catch (e) {
        // unable to fetch
        // no file, nothing can be done
        if (!file) {
            throw new Error('Unable to load schema data');
        }
        
        // just use the file we have, if the fetch failed
        return file.blob.text().then(asJSON);
    }
    
    // read as json
    const json = await response.json();
    // we want to store it as a json blob
    const blob = new Blob([JSON.stringify(json)], {
        type: 'application/json'
    });
    const now = new Date();
    const details = {
        source_url,
        filename,
        blob,
        last_fetched: now,
        last_updated: now
    };
    
    if (file) {
        // add the id of the existing file
        details.id = file.id;
    }
    
    // save it
    await db.files.put(details);
    
    return json;
}
