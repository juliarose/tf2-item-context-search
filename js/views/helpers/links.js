import { getForm, createValidationError } from './forms.js';
import { isValidURL } from '../../app/utils.js';

function validateLinkForm(form) {
    const errors = [];
    
    if (!form.url) {
        errors.push(['Missing URL', 'url']);
    } else if (!isValidURL(form.url)) {
        // not necessarily a valid url, but must start with http
        errors.push(['Invalid URL', 'url']);
    } else if (form.url.length >= 250) {
        errors.push(['URL must be less than 250 characters', 'url']);
    }
    
    if (!form.title) {
        errors.push(['Missing title', 'title']);
    } else if (form.title.length >= 50) {
        errors.push(['Title must be less than 50 characters', 'title']);
    }
    
    if (errors.length > 0) {
        throw createValidationError(errors);
    }
    
    // ok!
    return;
}

// returns a form object on successful validation
export function validatesFormEl(formEl) {
    const form = getForm(formEl);
    const messagesEl = formEl.querySelector('.messages');
    
    messagesEl.classList.add('hidden');
    
    Array.from(formEl.querySelectorAll('.error'))
        .forEach((errorEl) => {
            errorEl.classList.remove('error');
        });
    
    try {
        // validate this form
        validateLinkForm(form);
        
        return form;
    } catch (e) {
        // form has errors
        const { messages, targets } = e;
        
        // clear previous message
        messagesEl.innerHTML = '';
        
        messages
            .map((message) => {
                const errorEl = document.createElement('li');
                
                errorEl.textContent = message;
                
                return errorEl;
            })
            .forEach((errorEl) => {
                messagesEl.appendChild(errorEl);
            });
        
        targets
            .forEach((target) => {
                const targetInputEl = formEl.querySelector(`[name="${target}"]`);
                const fieldEl = targetInputEl.closest('.field');
                
                fieldEl.classList.add('error');
            });
        
        messagesEl.classList.add('error');
        messagesEl.classList.remove('hidden');
        
        throw e;
    }
}

export function renderLink(link) {
    const { id } = link;
    const formEl = document.createElement('form');
    const fields = [
        {
            field: 'url',
            label: '<i class="fa fa-link fa-fw"></i> URL'
        },
        {
            field: 'title',
            label: '<i class="fa fa-heading fa-fw"></i> Title'
        }
    ];
    const fieldsEl = document.createElement('div');
    const controlsEl = document.createElement('div');
    const messagesEl = document.createElement('ul');
    const removeBtnEl = document.createElement('div');
    
    fields
        .map(({ field, label }) => {
            const fieldEl = document.createElement('div');
            const labelEl = document.createElement('label');
            const inputEl = document.createElement('input');
            const fieldId = `${field}[${id}]`;
            const value = link[field];
            
            labelEl.innerHTML = label;
            labelEl.setAttribute('for', fieldId);
            inputEl.setAttribute('id', fieldId);
            inputEl.setAttribute('type', 'text');
            inputEl.setAttribute('name', field);
            inputEl.setAttribute('autocomplete', 'off');
            inputEl.value = value;
            
            fieldEl.classList.add('field');
            fieldEl.appendChild(labelEl);
            fieldEl.appendChild(inputEl);
            
            return fieldEl;
        })
        .forEach((fieldEl) => {
            fieldsEl.appendChild(fieldEl);
        });
    
    removeBtnEl.innerHTML = 'Remove';
    
    formEl.setAttribute('data-id', id);
    
    formEl.classList.add('link-form');
    fieldsEl.classList.add('fields');
    messagesEl.classList.add('messages', 'hidden');
    controlsEl.classList.add('controls');
    removeBtnEl.classList.add('button', 'red', 'delete-link');
    
    controlsEl.appendChild(removeBtnEl);
    formEl.appendChild(fieldsEl);
    formEl.appendChild(controlsEl);
    formEl.appendChild(messagesEl);
    
    return formEl;
}
