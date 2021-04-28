// browser utilities

const browser = chrome;
// https://developer.chrome.com/docs/extensions/reference/tabs/
export const tabs = browser.tabs;
// https://developer.chrome.com/docs/extensions/reference/runtime/#event-onMessage
export const onMessage = browser.runtime.onMessage;
// https://developer.chrome.com/docs/extensions/reference/contextMenus
export const contextMenus = browser.contextMenus;
// https://developer.chrome.com/docs/extensions/reference/storage/
export const storage = (
    browser.storage ? 
        (
            browser.storage.sync ||
            browser.storage.local
        ) :
        browser.localStorage
);

/**
 * Sends a runtime message.
 * @param {Object} details - Details.
 * @param {Function} [callback=function(){}] - Callback function.
 * @returns {Promise<*>} Response.
 */
export async function sendMessage(details) {
    return new Promise((resolve) => {
        browser.runtime.sendMessage(details, resolve);
    });
}

/**
 * Gets a URL of an extension resource.
 * @param {string} url - URL of resource relative to extension's root.
 * @returns {string} Absolute extension URL.
 */
export function getExtensionURL(url) {
    return browser.extension.getURL(url);
}
