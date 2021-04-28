import { storage } from './browser.js';

// get value from browser's storage
export async function getStored(name) {
    return new Promise((resolve) => {
        storage.get([name], (settings) => {
            return resolve(settings[name]);
        });
    });
}

// set value from browser's storage
export async function setStored(name, value) {
    return new Promise((resolve) => {
        storage.set({
            [name]: value
        }, resolve);
    });
}
