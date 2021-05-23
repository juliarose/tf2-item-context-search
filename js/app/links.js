import { db } from './db.js';
import { sendMessage } from './browser.js';

export const MAX_LINKS = 5;

export async function getLinksCount() {
    return db.links.count();
}

export async function getLinks() {
    return db.links.toArray();
}

export async function saveLink(id, details) {
    async function addLink(details) {
        const count = await getLinksCount();
        
        if (count > MAX_LINKS) {
            throw new Error(`Maximum of ${MAX_LINKS} links allowed`);
        }
        
        const id = await db.links.add(details);
        
        sendMessage({
            type: 'ADD_LINK',
            link: {
                id,
                ...details
            }
        });
        
        return id;
    }
    
    if (!id) {
        return addLink(details);
    }
    
    // send a message to the background script
    sendMessage({
        type: 'UPDATE_LINK',
        link: {
            id,
            ...details
        }
    });
    
    return db.links.put({
        id,
        ...details
    });
}

export async function deleteLink(id) {
    sendMessage({
        type: 'REMOVE_LINK',
        link: {
            id
        }
    });
    
    return db.links.delete(id);
}

export async function getLink(id) {
    return db.links.get(id);
}
