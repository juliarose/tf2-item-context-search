const browser = chrome || browser;

(async function() {
    const src = browser.runtime.getURL('/js/content/injects/all_urls.js');
    const contentScript = await import(src);

    if (contentScript.default) {
        contentScript.default(browser);
    }
})();
