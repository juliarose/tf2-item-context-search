import createSchema from '../app/schema/index.js';
import { tabs, getExtensionURL, onMessage } from '../app/browser.js';
import { getLinks } from '../app/links.js';
import { createBaseContext, createItemSearchContextGenerator } from '../app/contexts/hashLinks.js';
import { createHashToLink } from '../app/contexts/hashLinks.js';
import getContextId from '../app/contexts/getContextId.js';
import defaultLinks from '../app/contexts/defaultLinks.js';
import createContextStateManager from '../app/state/contexts.js';
import createLinkContextManager from '../app/state/links.contexts.js';

(async function() {
    const schema = await createSchema();
    const links = await getLinks();
    const contextGenerator = createItemSearchContextGenerator(schema);
    const rootContext = {
        title: 'Search for item...',
        id: getContextId(),
        ...createBaseContext()
    };
    // create object for state of contexts
    const contextState = createContextStateManager(rootContext);
    // the default links are more flexible and behave a little differently
    const defaultLinkState = createLinkContextManager(defaultLinks, {
        contextState,
        contextIdPrefix: 'default',
        // function called for updating state of each link based on message passed
        stateUpdater(link, message) {
            const { hash } = message;
            const { updateContextForHash } = link;
            
            if (!hash || !updateContextForHash) {
                return null;
            }
            
            return updateContextForHash(hash);
        },
        // function for converting each link to a context
        asContext(link) {
            const { generator, title, visible } = link;
            
            // generate the context
            return contextGenerator({
                title,
                generator,
                visible
            });
        }
    });
    const linkState = createLinkContextManager(links, {
        contextState,
        contextIdPrefix: 'custom',
        // function called for updating state of each link based on message passed
        stateUpdater(link, message) {
            const { hash } = message;
            
            if (!hash) {
                return null;
            }
            
            const url = createHashToLink(link.url)(hash);
            const visible = Boolean(url);
            
            return {
                visible
            };
        },
        // function for converting each link to a context
        asContext(link) {
            const { url, title, visible } = link;
            // generator for creating url from hash
            const generator = createHashToLink(url);
            
            // generate the context
            return contextGenerator({
                title,
                generator,
                visible
            });
        }
    });
    
    // this will force the proper indexes to be built for parsing names so that they're ready when needed
    schema.processName('Purple Energy Wet Works', { ignoreCase: true });
    
    // initialize contexts
    await Promise.all([
        // add contexts for links
        ...[
            defaultLinkState,
            linkState
        ].map(state => state.addToContext()),
        // add bottom links
        ...[
            {
                id: getContextId('configure-seperator'),
                type: 'separator',
                ...createBaseContext()
            },
            {
                id: getContextId('configure'),
                title: 'Configure...',
                ...createBaseContext(),
                onclick() {
                    const url = getExtensionURL('/views/links.html');
                    
                    tabs.create({ url });
                }
            }
        ].map(contextState.addToBottom)
    ]);
    
    onMessage.addListener((message, sender, sendResponse) => {
        switch (message.type) {
            case 'SELECTION': {
                const { selection } = message;
                const hash = (
                    selection &&
                    schema.processName(selection)
                );
                
                if (hash) {
                    // we want to update our states based on this hash
                    [defaultLinkState, linkState].forEach(state => state.updateState({ hash }));
                    contextState.showAll();
                    sendResponse({ hash });
                    return true;
                } else {
                    contextState.hideAll();
                }
            } break;
            case 'NO_SELECTION': {
                contextState.hideAll();
            } break;
            case 'ADD_LINK': {
                linkState.add(message.link);
            } break;
            case 'UPDATE_LINK': {
                linkState.update(message.link.id, message.link);
            } break;
            case 'REMOVE_LINK': {
                linkState.remove(message.link.id);
            } break;
        }
        
        sendResponse(null);
        return true;
    });
}());
