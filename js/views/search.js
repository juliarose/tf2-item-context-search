import { tabs, getExtensionURL } from '../app/browser.js';
import { getLinks } from '../app/links.js';
import { createHashToLink } from '../app/contexts/hashLinks.js';
import defaultLinks from '../app/contexts/defaultLinks.js';
import createSchema from '../app/schema/index.js';
import config from '../app/config.js';
import { toTitleCase, escapeRegExp } from '../app/utils.js';
import addAutocompleteToField from './helpers/addAutocompleteToField.js';

const page = {
    itemSearch: document.getElementById('item-search'),
    itemSearchResults: document.getElementById('item-search-results')
};

(async function() {
    // create links for hash
    function createLinks(hash) {
        // an array of url generators with titles
        const generated = [
            ...defaultLinks
                .filter((link) => {
                    if (!link.updateContextForHash) {
                        return true;
                    }
                    
                    // pass the hash to the update context for hash and make sure
                    // that visibility is not set to false
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
    
    const [
        schema,
        links
    ] = await Promise.all([
        createSchema(),
        getLinks()
    ]);
    
    page.itemSearch.addEventListener('keyup', (e) => {
        const inputEl = e.target;
        const { value } = inputEl;
        const fieldEl = inputEl.closest('.field');
        
        config.set('popup_name', value);
        page.itemSearchResults.innerHTML = '';
        
        if (!value) {
            fieldEl.classList.remove('error');
            return;
        }
        
        const hash = schema.processName(value, {
            ignoreCase: true
        });
        
        inputEl.value = value;
        
        if (!hash) {
            fieldEl.classList.add('error');
            return;
        } else {
            fieldEl.classList.remove('error');
        }
        
        createLinks(hash);
    });
    
    // add an autocomplete for the item search field to get autocomplete names from the schema
    addAutocompleteToField(page.itemSearch, schema.getNames(), () => {
        
    });
}());
