import createCompoundIndex from './createCompoundIndex.js';
import getCaretPosition from './getCaretPosition.js';

/**
 * Creates an autocomplete field with the given values.
 * @param {HTMLElement} inputEl - The input element for the complete.
 * @param {string[]} values - Array of values to be used as search terms.
 * @param {function} submitFn - The function to call when submitting the search.
 * @returns {undefined}
 */
export default function addAutocompleteToField(inputEl, values, submitFn) {
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
            itemsList[currentFocus].classList.add('autocomplete-active');
        }
    }
    
    // removes active class for all items in list
    function removeActive(itemsList) {
        for (let i = 0; i < itemsList.length; i++) {
            itemsList[i].classList.remove('autocomplete-active');
        }
    }
    
    // closes all autocomplete lists in the document,
    // except the one passed as an argument
    function closeAllLists(el) {
        let itemsContainerList = document.getElementsByClassName('autocomplete-items');
        
        Array.from(itemsContainerList)
            .filter((itemsContainerEl) => {
                return Boolean(
                    el !== itemsContainerEl &&
                    el !== inputEl
                );
            })
            .forEach((itemsContainerEl) => {
                itemsContainerEl.parentNode.removeChild(itemsContainerEl);
            });
    }
    
    function updateDropdown(e) {
        // take
        const inputEl = e.currentTarget;
        const { id } = inputEl;
        const pos = getCaretPosition(inputEl);
        
        if (e.type === 'input' && pos < compounds.getIndex()) {
            compounds.invalidate();
        }
        
        if (compounds.previousValue) {
            // space
            if (keyCode === 32) {
                inputEl.value = compounds.update(' ');
            }
        }
        
        const inputValue = inputEl.value;
        // an uppercase version of the input value
        // cached for (marginally) improved performance
        const uppercaseInputValue = inputValue.toUpperCase();
        
        // close any already open lists of autocompleted values
        closeAllLists();
        
        // input is blank - nothing to search against
        if (!inputEl.value) {
            return false;
        }
        
        currentFocus = -1;
        
        // call the function to submit
        const isCompleted = submitFn(inputEl.value);
        
        // create an element that will contain the items
        const itemsContainerEl = document.createElement('div');
        
        itemsContainerEl.setAttribute('id', `${id}autocomplete-list`);
        itemsContainerEl.setAttribute('class', 'autocomplete-items');
        
        const currentIndex = compounds.getIndex();
        const currentTerm = uppercaseInputValue.slice(currentIndex).trim();
        const isTrimmed = currentTerm !== uppercaseInputValue.slice(currentIndex);
        const slice = currentIndex;
        const terms = [];
        
        if (currentTerm.length > 0) {
            terms.push({
                value: currentTerm,
                slice
            });
        }
        
        if (compounds.previousCompletedValue && currentTerm.length > 0) {
            const prefix = compounds.previousCompletedValue.toUpperCase();
            const value = [prefix, currentTerm].join(' ');
            
            terms.push({
                value,
                slice: Math.max(0, slice - (prefix.length + 1))
            });
        }
        
        if (terms.length === 0) {
            return;
        }
        
        // loop through values
        values
            // filter values that match the search term
            .map((value) => {
                const uppercaseValue = value.toUpperCase();
                let matched;
                let index;
                
                const isMatch = terms.some((term, i) => {
                    matched = term;
                    index = i;
                    
                    return uppercaseValue.indexOf(term.value) === 0;
                });
                
                if (!isMatch) {
                    return;
                }
                
                return {
                    value,
                    index,
                    term: matched
                };
            })
            .filter(Boolean)
            .sort((a, b) => {
                return b.index - a.index;
            })
            // take first 10 results
            .slice(0, 10)
            // map each matching value to an element
            .map(({ value, term }) => {
                const itemEl = document.createElement('div');
                const testInputValue = uppercaseInputValue.slice(term.slice).trim();
                const matchingIndex = value.toUpperCase().indexOf(testInputValue);
                const startStr = value.substr(0, matchingIndex);
                const matchingStr = value.substr(matchingIndex, inputValue.length);
                const endingStartIndex = matchingIndex + inputValue.length;
                const endStr = value.substr(endingStartIndex, value.length - endingStartIndex);
                
                if (value.toUpperCase() === testInputValue) {
                    if (isCompleted) {
                        inputEl.value = compounds.update('', null, value);
                    } else {
                        compounds.previousValue = value;
                    }
                }
                
                // make the matching letters bold
                itemEl.innerHTML = `${startStr}<strong>${matchingStr}</strong>${endStr}`;
                
                // execute a function when the item is clicked
                itemEl.addEventListener('click', (e) => {
                    // change the input's value to the value for this element
                    inputEl.value = compounds.update(' ', term.slice, value);
                    
                    // close the list of autocompleted values
                    // (or any other open lists of autocompleted values
                    closeAllLists();
                    
                    submitFn(inputEl.value);
                });
                
                return itemEl;
            })
            .forEach((itemEl) => {
                // add each element generated to the container element
                itemsContainerEl.appendChild(itemEl);
            });
        
        // the complete element is the parent of the input
        const autocompleteEl = inputEl.parentNode;
        
        if (!isCompleted) {
            // appends the element to the autocomplete element
            autocompleteEl.appendChild(itemsContainerEl);
        }
    }
    
    const compounds = createCompoundIndex();
    // adapted from https://www.w3schools.com/howto/howto_js_autocomplete.asp
    // the currently focused auto-complete term in the dropdown
    let currentFocus;
    // current key code
    let keyCode;
    
    inputEl.addEventListener('change', (e) => {
        const inputEl = e.currentTarget;
        const inputValue = inputEl.value;
        
        if (!inputValue) {
            // clear the value
            submitFn('');
        }
    });
    
    inputEl.addEventListener('focus', updateDropdown);
    
    // execute a function when input value changes
    inputEl.addEventListener('input', updateDropdown);
    
    // execute a function when key is pressed
    inputEl.addEventListener('click', (e) => {
        const inputEl = e.currentTarget;
        const { id } = inputEl;
        let itemsContainerEl = document.getElementById(`${id}autocomplete-list`);
        
        if (itemsContainerEl) {
            updateDropdown(e);
        }
    });
    
    // execute a function when key is pressed
    inputEl.addEventListener('keydown', (e) => {
        const inputEl = e.currentTarget;
        const { id } = inputEl;
        let itemsContainerEl = document.getElementById(`${id}autocomplete-list`);
        let itemsList;
        
        if (itemsContainerEl) {
            itemsList = itemsContainerEl.getElementsByTagName('div');
        } else {
            return false;
        }
        
        keyCode = e.keyCode;
        
        switch (e.keyCode) {
            // up
            case 38: {
                currentFocus--;
                
                // update the active selected element
                updateActiveItem(itemsList);
            } break;
            // down
            case 40: {
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
                    itemsList[currentFocus].click();
                }
            } break;
        }
    });
    
    // execute a function when someone clicks in the document
    document.addEventListener('click', (e) => {
        closeAllLists(e.target);
    });
}
