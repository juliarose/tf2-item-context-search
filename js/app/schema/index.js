import processItemName from './processName.js';
import createNameProcessors from './itemProcessors.js'
import loadSchema from './loadSchema.js';
import { uniq } from '../utils.js';
import namesRejectedDefindices from './namesRejectedDefindices.js';

export default async function createSchema(options = {}) {
    const recordIndex = await loadSchema(options);
    // create hash/name processors from schema
    const processors = createNameProcessors(recordIndex);
    
    return {
        processors,
        // collect names from schema
        getNames() {
            // map function for specific key from array of records
            const getValueForKey = (key) => (record) => record[key];
            const qualityNames = recordIndex.qualities
                .map(getValueForKey('name'))
                .sort();
            const killstreakTierNames = recordIndex.killstreak_tiers
                .map(getValueForKey('name'))
                .sort();
            const particleNames = recordIndex.particles
                .map(getValueForKey('name'))
                .sort();
            const itemNames = recordIndex.items
                .filter(({ defindex }) => {
                    // get rid of things we don't want
                    return !Boolean(
                        // medals
                        (defindex >= 8939 && defindex < 15000) ||
                        // quest items
                        (defindex >= 25000 && defindex <= 25055) ||
                        // others
                        namesRejectedDefindices.has(defindex)
                    );
                })
                .map(getValueForKey('item_name'))
                .sort();
            
            return uniq([
                // the order matters here
                // in a search "Australium" is more important than "Australium Gold"
                // and will appear first
                'Australium',
                ...qualityNames,
                ...killstreakTierNames,
                ...particleNames,
                ...itemNames
            ]);
        },
        // processes name
        // options can include ignoreCase to ignore the case when processing
        processName(name, options = {}) {
            return processItemName(name, {
                processors,
                ...options
            });
        }
    };
}
