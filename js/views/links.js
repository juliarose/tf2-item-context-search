import { getLinksCount, getLinks, getLink, deleteLink, saveLink, MAX_LINKS } from '../app/links.js';
import { validatesFormEl, renderLink } from './helpers/links.js';
import { createHashToLink } from '../app/contexts/hashLinks.js';
import config from '../app/config.js';
import { isValidURL } from '../app/utils.js';
import createSchema from '../app/schema/index.js';

const page = {
    body: document.body,
    contents: document.getElementById('contents'),
    forms: document.getElementById('forms'),
    newLinkForm: document.getElementById('new-link-form'),
    sample: {
        outputTextArea: document.getElementById('sample-output'),
        tryNameInput: document.getElementById('sample-try'),
        tryUrlInput: document.getElementById('sample-try-url'),
        tryUrlOutputDiv: document.getElementById('sample-try-url-output')
    },
    config: document.getElementById('config')
};

// add event listeners to forms and sample section
(async function() {
    // get the link id for a form
    function getLinkID(formEl) {
        const { id } = formEl.dataset;
        
        if (!id) {
            return null;
        }
        
        return parseInt(id);
    }
    
    // submits the search for the "try" section
    function submitSearch() {
        const tryNameInputEl = page.sample.tryNameInput;
        const tryUrlInputEl = page.sample.tryUrlInput;
        const tryUrlOutputEl = page.sample.tryUrlOutputDiv;
        // get the input value we are testing against
        const { value } = tryNameInputEl;
        // convert that into a hash
        const hash = schema.processName(value);
        // get the fields for inputs
        const sampleTryFieldEl = tryNameInputEl.closest('.field');
        const sampleTryUrlFieldEl = tryUrlInputEl.closest('.field');
        
        // adds/removes "error" class bashed on whether hash wash successfully parsed
        sampleTryFieldEl.classList[hash ? 'remove': 'add']('error');
        
        if (!hash) {
            return;
        }
        
        // this doesn't actually need to be a valid url
        const urlValue = tryUrlInputEl.value;
        const url = createHashToLink(urlValue)(hash);
        
        tryUrlOutputEl.textContent = url;
        tryUrlOutputEl.setAttribute('href', url);
        
        setSample(hash);
    }
    
    // sets the sample hash into the textarea
    function setSample(hash) {
        const textareaEl = page.sample.outputTextArea;
        
        textareaEl.value = JSON.stringify(hash, null, 4);
        textareaEl.style.width = '100%';
        // 2px for border?
        textareaEl.style.height = `${textareaEl.scrollHeight + 2}px`;
        textareaEl.style.resize = 'none';
    }
    
    // updates the state for links
    async function updateLinksState() {
        const count = await getLinksCount();
        const containsNewLinkForm = page.body.contains(page.newLinkForm);
        
        if (count >= MAX_LINKS) {
            if (containsNewLinkForm) {
                // only remove if the page contains the element
                page.newLinkForm.remove();
            }
        } else if(!containsNewLinkForm) {
            // the element does not exist on page - re-add it
            page.contents.appendChild(page.newLinkForm);
        }
    }
    
    const [
        links,
        schema
    ] = await Promise.all([
        getLinks(),
        createSchema()
    ]);
    
    links
        .sort((a, b) => b.id - a.id)
        .map(renderLink)
        .forEach((formEl) => {
            page.forms.prepend(formEl);
        });
    
    // add an initial value
    page.sample.tryNameInput.value = 'Strange Professional Killstreak Golden Frying Pan';
    // and submit it
    page.sample.tryNameInput.addEventListener('keyup', submitSearch);
    page.sample.tryUrlInput.addEventListener('keyup', submitSearch);
    
    // delegate keyup to link forms
    page.forms.addEventListener('keyup', async (e) => {
        // not a field input
        if (!e.target.matches('.field input')) {
            return;
        }
        
        const formEl = e.target.closest('.link-form');
        
        if (!formEl) {
            return;
        }
        
        // is a url element
        if (e.target.name === 'url') {
            // set the "Try URL" to the value of this input
            page.sample.tryUrlInput.value = e.target.value;
            page.sample.tryUrlInput.dispatchEvent(new Event('keyup'));
        }
        
        // get the button to save the link
        const saveLinkEl = formEl.querySelector('.save-link');
        const linkid = getLinkID(formEl);
        
        try {
            // validated successfully
            const form = validatesFormEl(formEl);
            
            // validation passed - update the link
            await (async function() {
                if (linkid) {
                    // this link already exists, auto-save this link
                    return saveLink(linkid, form);
                } else if (saveLinkEl) {
                    // otherwise enable the button to save the link
                    saveLinkEl.classList.remove('disabled');
                }
            }());
        } catch (e) {
            // failed validation
            if (saveLinkEl) {
                saveLinkEl.classList.add('disabled');
            }
            
            // nothing
            return;
        }
    });
    
    page.forms.addEventListener('mousedown', async (e) => {
        const formEl = e.target.closest('.link-form');
        
        if (!formEl) {
            return;
        }
    });
    
    // delegate click to buttons
    page.forms.addEventListener('click', async (e) => {
        const buttonEl = (
            e.target.matches('.button') ?
                e.target :
                e.target.closest('.button')
        );
        
        // no button
        if (!buttonEl) {
            return;
        }
        
        // or button is disabled
        if (buttonEl.classList.contains('disabled')) {
            return;
        }
        
        const formEl = buttonEl.closest('.link-form');
        
        if (!formEl) {
            return;
        }
        
        const linkid = getLinkID(formEl);
        
        // is a button to save link
        if (buttonEl.classList.contains('save-link')) {
            try {
                const form = validatesFormEl(formEl);
                const id = await saveLink(linkid, form);
                const insertedFormEl = renderLink({
                    id,
                    ...form
                });
                const saveLinkEl = formEl.querySelector('.save-link');
                
                saveLinkEl.classList.add('disabled');
                // insert a new element for the newly created link
                page.forms.insertBefore(insertedFormEl, formEl);
                // reset the form
                formEl.reset();
                
                await updateLinksState();
            } catch (e) {
                return;
            }
        }
        
        // is a button to delete link
        if (buttonEl.classList.contains('delete-link')) {
            formEl.remove();
            
            try {
                await deleteLink(linkid);
                await updateLinksState();
            } catch (e) {
                return;
            }
        }
    });
    
    await updateLinksState();
    
    submitSearch();
}());

// configurations
(async function() {
    // delegates change on inputs
    page.config.addEventListener('change', (e) => {
        const { id } = e.target;
        
        switch (e.target.tagName) {
            case 'INPUT': {
                let value;
                
                if (e.target.type === 'checkbox') {
                    // value is whether the box is checked
                    value = e.target.checked;
                } else {
                    // value is the input valeu
                    value = e.target.value;
                }
                
                if (value !== undefined && value !== '') {
                    // value is defined and changed, set the new value in config
                    config.set(id, value);
                }
            } break;
        }
    });
    
    // check configuration items based on values from storage
    Array.from(page.config.querySelectorAll('.field')).forEach(async (fieldEl) => {
        const inputEl = fieldEl.querySelector('input');
        
        if (!inputEl) {
            return;
        }
        
        // the key for the config item is the id of the element
        const { id } = inputEl;
        // get the config value
        const value = await config.get(id);
        
        // if it's a checkbox...
        if (inputEl.type === 'checkbox') {
            // check/uncheck it based on the value
            inputEl.checked = Boolean(value);
        }
    });
}());
