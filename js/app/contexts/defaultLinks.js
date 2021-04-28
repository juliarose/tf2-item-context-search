import getContextId from './getContextId.js';
import { qsMapToQuery, createBooleanValueConverter } from './helpers.js';
const encode = (str) => {
    if (!str) {
        return '';
    }
    
    return encodeURIComponent(str);
};

const defaultLinks = [
    {
        id: 'classifieds',
        title: 'Search classifieds',
        generator(hash) {
            const qsMap = {
                item_name: 'item',
                quality: 'quality',
                craftable: 'craftable',
                australium: 'australium',
                killstreak_tier: 'killstreak_tier',
                particle: 'particle',
                elevated: 'elevated'
            };
            let qsHash = hash;
            
            if (qsHash.strange) {
                // clone hash (so we are not modifying the original)
                // and add { elevated: 11 } to attributes
                qsHash = {
                    elevated: 11,
                    ...hash
                };
            }
            
            const valueConverter = createBooleanValueConverter(1, -1);
            const qs = qsMapToQuery(qsHash, qsMap, valueConverter);
            
            return `https://backpack.tf/classifieds${qs}`;
        }
    },
    {
        id: 'backpack-unusual-item',
        title: 'View prices for Unusual $item_name',
        generator(hash) {
            return `https://backpack.tf/unusual/${encode(hash.item_name)}`;
        },
        // used for updating context based on a hash
        updateContextForHash(hash) {
            if (hash.quality !== 5) {
                return {
                    visible: false
                };
            }
            
            return {
                title: `View prices for Unusual ${hash.item_name}`, 
                visible: true
            };
        }
    },
    {
        id: 'backpack-unusual-effect',
        title: 'View prices for $particle_name',
        generator(hash) {
            return `https://backpack.tf/effect/${encode(hash.particle_name)}`;
        },
        // used for updating context based on a hash
        updateContextForHash(hash) {
            if (!hash.particle_name) {
                return {
                    visible: false
                };
            }
            
            return {
                title: `View prices for ${hash.particle_name}`, 
                visible: true
            };
        }
    },
    {
        id: 'backpack',
        title: 'View on backpack.tf',
        generator(hash) {
            return [
                'https://backpack.tf/stats',
                hash.quality_name,
                hash.stats_name,
                'Tradable',
                hash.craftable ? 'Craftable' : 'Non-Craftable',
                hash.priceindex || hash.particle
            ].filter(Boolean).join('/');
        }
    },
    {
        id: 'steam-market',
        title: 'View on Steam Market',
        generator(hash) {
            const filter = (function() {
                if (hash.particle_name !== undefined) {
                    return encode(`"★ Unusual Effect: ${hash.particle_name}"`);
                }
            }());
            const url = `https://steamcommunity.com/market/listings/440/${encode(hash.market_name)}`;
            
            if (filter === undefined) {
                return url;
            }
            
            return `${url}?filter=${filter}`; 
        }
    },
    {
        id: 'marketplace',
        title: 'View on marketplace.tf',
        generator(hash) {
            return `https://marketplace.tf/items/tf2/${hash.sku}`;
        }
    }
];

export default defaultLinks;
