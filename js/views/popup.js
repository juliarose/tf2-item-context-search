import { tabs, getExtensionURL } from '../app/browser.js';
import { getLinks } from '../app/links.js';
import { createHashToLink } from '../app/contexts/hashLinks.js';
import defaultLinks from '../app/contexts/defaultLinks.js';
import createSchema from '../app/schema/index.js';
import config from '../app/config.js';
import { toTitleCase, escapeRegExp } from '../app/utils.js';
import addAutocompleteToField from './helpers/addAutocompleteToField.js';

const page = {
    customizeLinks: document.getElementById('customize-links'),
    itemSearch: document.getElementById('item-search'),
    itemSearchResults: document.getElementById('item-search-results')
};

(async function() {
    function createLinks(hash) {
        // an array of url generators with titles
        const generated = [
            ...defaultLinks
                .filter((link) => {
                    if (!link.updateContextForHash) {
                        return true;
                    }
                    
                    return link.updateContextForHash(hash).visible !== false;
                })
                .map((link) => {
                    return {
                        title: link.title,
                        generator: link.generator
                    };
                }),
            ...links
                .map((link) => {
                    return {
                        title: link.title,
                        generator: createHashToLink(link.url)
                    };
                })
        ];
        
        generated
            // process data
            .map(({ title, generator }) => {
                if (title.includes('$')) {
                    // make hash replacements on title
                    title = Object.entries(hash)
                        .filter(([key, value]) => {
                            return typeof value === 'string';
                        })
                        .reduce((title, [key, value]) => {
                            return title.replace(`$${key}`, value);
                        }, title);
                }
                
                return {
                    title,
                    url: generator(hash)
                };
            })
            // convert to elements
            .map(({ title, url }) => {
                const listEl = document.createElement('li');
                const linkEl = document.createElement('a');
                
                linkEl.setAttribute('href', '#');
                linkEl.setAttribute('target', '_blank');
                linkEl.textContent = title;
                listEl.appendChild(linkEl);
                linkEl.addEventListener('click', (e) => {
                    tabs.create({ url });
                    
                    e.preventDefault();
                    return false;
                });
                
                return listEl;
            })
            .forEach((listEl) => {
                page.itemSearchResults.appendChild(listEl);
            });
    }
    
    // updates the active item
    function updateActiveItem(itemsList) {
        if (!itemsList) {
            return false;
        }
        
        // remove active on previous selected item
        removeActive(itemsList);
        
        if (currentFocus >= itemsList.length) {
            currentFocus = 0;
        }
        
        if (currentFocus < 0) {
            currentFocus = itemsList.length - 1;
        }
        
        if (itemsList[currentFocus]) {
            // add class "autocomplete-active" to active item
            itemsList[currentFocus].classList.add('active');
        }
    }
    
    // removes active class for all items in list
    function removeActive(itemsList) {
        for (let i = 0; i < itemsList.length; i++) {
            itemsList[i].classList.remove('active');
        }
    }
    
    function submitHandler() {
        const inputEl = page.itemSearch;
        const { value } = inputEl;
        const fieldEl = inputEl.closest('.field');
        
        page.itemSearchResults.innerHTML = '';
        clearTimeout(nameSaverTimer);
        nameSaverTimer = setTimeout(() => config.set('popup_name', value), 80);
        
        if (!value) {
            fieldEl.classList.remove('error');
            hash = null;
            return;
        }
        
        hash = schema.processName(value, {
            ignoreCase: true
        });
        
        if (!hash) {
            fieldEl.classList.add('error');
            return;
        } else {
            fieldEl.classList.remove('error');
        }
        
        createLinks(hash);
        return true;
    }
    
    const [
        schema,
        links,
        popupName
    ] = await Promise.all([
        // do not update for popup pages
        createSchema({ skipUpdate: true }),
        getLinks(),
        config.get('popup_name')
    ]);
    let currentFocus = -1;
    let nameSaverTimer;
    let hash;
    
    page.itemSearch.value = await config.get('popup_name');
    page.itemSearch.dispatchEvent(new Event('keyup'));
    page.itemSearch.focus();
    
    page.customizeLinks.addEventListener('click', () => {
        const url = getExtensionURL('/views/links.html');
        
        tabs.create({ url });
    });
    
    page.itemSearch.addEventListener('input', (e) => {
        const inputEl = page.itemSearch;
        const fieldEl = inputEl.closest('.field');
        const { value } = inputEl;
        
        clearTimeout(nameSaverTimer);
        nameSaverTimer = setTimeout(() => config.set('popup_name', value), 80);
        
        if (!value) {
            fieldEl.classList.remove('error');
            hash = null;
            return;
        }
    });
    
    // execute a function when key is pressed
    document.addEventListener('keydown', (e) => {
        if (!hash) {
            currentFocus = -1;
            return;
        }
        
        const inputEl = page.itemSearch;
        const itemsList = page.itemSearchResults.getElementsByTagName('li');
        
        if (itemsList.length === 0) {
            return;
        }
        
        switch (e.keyCode) {
            // up
            case 38: {
                inputEl.blur();
                currentFocus--;
                
                // update the active selected element
                updateActiveItem(itemsList);
            } break;
            // down
            case 40: {
                inputEl.blur();
                currentFocus++;
                
                // update the active selected element
                updateActiveItem(itemsList);
            } break;
            // enter
            case 13: {
                // prevent the form from being submitted
                // e.preventDefault();
                if (currentFocus > -1 && itemsList) {
                    // force click event on the active item
                    itemsList[currentFocus].querySelector('a').dispatchEvent(new Event('click'));
                }
            } break;
        }
    });
    
    addAutocompleteToField(page.itemSearch, schema.getNames(), submitHandler);
    submitHandler();
}());
