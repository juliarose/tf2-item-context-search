import { contextMenus } from '../browser.js';

export default function createContextStateManager(rootContext) {
    // adds a context
    async function add(context) {
        // we want to include the parent in the context menu
        context = {
            parentId,
            ...context
        };
        
        contexts.splice(contexts.length - bottomContextIds.length, 0, context);
        return create(context, bottomContextIds.length > 0);
    }

    // adds a context to the bottom of the list
    // any contexts added after will be added before this context
    async function addToBottom(context) {
        // we want to include the parent in the context menu
        context = {
            parentId,
            ...context
        };
        
        contexts.push(context);
        bottomContextIds.push(context.id);
        return create(context);
    }

    // create the context
    async function create(context, shouldRedraw) {
        // only if visible
        if (!visible) {
            return;
        } else if (shouldRedraw) {
            // redraw all
            // when adding a context above another context
            return hideAll().then(showAll);
        }
        
        return new Promise((resolve) => {
            contextMenus.create(context, resolve);
        });
    }
    
    // remove context by id
    function remove(id) {
        // cannot remove parent id
        if (id === parentId) {
            return;
        }
        
        const index = contexts.findIndex((context) => {
            return context.id === id;
        });
        
        // remove the context with this menu item id
        contexts.splice(index, 1);
        
        const bottomContextIdIndex = bottomContextIds.indexOf(id);
        
        if (bottomContextIdIndex !== -1) {
            // remove the bottom context with this menu item id
            bottomContextIds.splice(bottomContextIdIndex, -1);
        }
        
        if (!visible) {
            return;
        }
        
        contextMenus.remove(id);
    }
    
    // updates contextid and applies properties
    function update(id, properties) {
        const index = contexts.findIndex((context) => {
            return context.id === id;
        });
        const context = contexts[index];
        
        // assign new properties to context
        contexts[index] = {
            ...context,
            ...properties
        };
        
        if (!visible) {
            return;
        }
        
        contextMenus.update(id, properties);
    }
    
    // hides all contexts
    async function hideAll() {
        // already hidden
        if (!visible) {
            return;
        }
        
        visible = false;
        return contextMenus.removeAll();
    }
    
    // shows all contexts
    async function showAll() {
        // already visible
        if (visible) {
            return;
        }
        
        visible = true;
        
        // this ensures they are created in the correct order
        for (const context of contexts) {
            await create(context);
        }
    }
    
    const parentId = rootContext.id;
    let bottomContextIds = [];
    let contexts = [rootContext];
    let visible = true;
    
    // create the context for the root context
    create(rootContext);
    
    return {
        add,
        addToBottom,
        remove,
        update,
        hideAll,
        showAll
    };
}
