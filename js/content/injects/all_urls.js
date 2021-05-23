import config from '/js/app/config.js';

export default async function(chrome) {
    // sends a message to background script
    async function sendMessage(details) {
       return new Promise((resolve) => {
           chrome.runtime.sendMessage(details, resolve);
       });
    }
    
    // selects text for node
    function selectNode(el) {
        const range = document.createRange();
        
        range.selectNode(el);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
    }
    
    // whether we want to autoselect specific name elements or not
    const autoSelectNames = await config.get('autoselect-names');
    let timer;
    
    // only if auto-selecting names is enabled
    if (autoSelectNames) {
        document.body.addEventListener('click', (e) => {
            const closestSelectors = [
                '.item-html-name',
                '.listing-title',
                '.item-title',
                '.stats-header-title',
                '.item-text',
                '.hover_item_name',
                '.market_listing_item_name'
            ].join(', ');
            
            if (e.target.closest(closestSelectors)) {
                selectNode(e.target);
            }
        });
    }
    
    document.addEventListener('selectionchange', (e) => {
        const selectionProps = window.getSelection();
        
        // nothing is selected
        if (selectionProps.type === 'Caret' || selectionProps.type === 'None') {
            return sendMessage({ type: 'NO_SELECTION' });
        }
        
        // get the currently selected text
        const selection = selectionProps.toString();
        
        // string is too short or too long
        if (selection.length < 3 && selection.length > 100) {
            return;
        }
        
        clearTimeout(timer);
        
        // we don't need to send a message everytime there's a change
        timer = setTimeout(async () => {
            const response = await sendMessage({
                type: 'SELECTION',
                selection
            });
            
            if (response) {
                // we don't really do anything with this, but we can
                // the processed hash is in the response as "response.hash"
            } else {
                
            }
        }, 20);
    });
}
