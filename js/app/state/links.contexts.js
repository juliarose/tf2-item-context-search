import { pluck } from '../utils.js';
import getContextId from '../contexts/getContextId.js';

// pass starting links
// context generator will take an object and generate a context object for it
export default function createLinkContextManager(links, { contextIdPrefix, asContext, stateUpdater, contextState }) {
    function toContext(link) {
        const id = getContextId(contextIdPrefix, link.id);
        const context = asContext(link);
        
        return {
            ...context,
            id
        };
    }
    
    function add(link) {
        // add this to the array of links
        links.push(link);
        
        // convert it to a context
        const context = toContext(link);
        
        // add it as a context menu item
        contextState.add(context);
    }
    
    function findIndexOf(id) {
        return links.findIndex((link) => {
            return link.id === id;
        });
    }
    
    function remove(id) {
        const index = findIndexOf(id);
        
        if (index === -1) {
            return
        }
        
        const menuitemid = getContextId(contextIdPrefix, id);
        
        links.splice(index, 1);
        contextState.remove(menuitemid);
    }
    
    function update(id, properties, keepExistingProperties = true) {
        const index = findIndexOf(id);
        
        // does not exist
        if (index === -1) {
            return;
        }
        
        const somePropertiesChanged = Boolean(
            // if we are not keeping the existing properties we want to overwrite the object
            !keepExistingProperties ||
            // some properties are different
            Object.entries(properties).some(([k, v]) => {
                return links[index][k] !== v;
            })
        );
        
        // none of the properties are different - no change needed
        if (!somePropertiesChanged) {
            return;
        }
        
        const link = {
            // keep existing properties
            ...(keepExistingProperties ? links[index] : {}),
            ...properties,
            id
        };
        
        // update the link in the array
        links[index] = link;
        
        const context = toContext(link);
        // only update these attributes
        const contextProperties = pluck(context, [
            'title',
            'type',
            'checked',
            'parentId',
            'onclick',
            'visible',
            'documentUrlPatterns',
            'targetUrlPatterns'
        ]);
        
        // update the context for this item
        contextState.update(context.id, contextProperties);
    }
    
    // updates the state for each link
    function updateState(message) {
        if (!stateUpdater) {
            return;
        }
        
        links
            .forEach((link) => {
                // call the function to update the state
                const properties = stateUpdater(link, message);
                
                // will be null  if the state should not be updated
                if (!properties) {
                    return;
                }
                
                // apply new properties
                update(link.id, properties);
            });
    }
    
    async function addToContext() {
        return Promise.all(links.map(toContext).map(contextState.add));
    }
    
    return {
        contextIdPrefix,
        add,
        update,
        remove,
        updateState,
        addToContext
    };
};
