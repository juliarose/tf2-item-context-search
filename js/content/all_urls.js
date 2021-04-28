(async function() {
    const src = chrome.runtime.getURL('/js/content/injects/all_urls.js');
    const contentScript = await import(src);

    if (contentScript.default) {
        contentScript.default(chrome);
    }
})();
