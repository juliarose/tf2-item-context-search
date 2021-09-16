import createSchemaSearchIndex from './createSchemaSearchIndex.js';
import { escapeRegExp } from '../utils.js';
import EQuality from '../enums/EQuality.js';

// interface for processing item hashes
export default function createItemProcessors(recordIndex) {
    function getSKU(hash) {
        return [
            hash.defindex,
            hash.quality,
            hash.particle ? `u${hash.particle}` : null,
            hash.australium ? 'australium': null,
            hash.festivized ? 'festive': null,
            hash.strange ? 'strange' : null,
            !hash.craftable ? 'uncraftable': null,
            hash.wear ? `w${hash.wear}` : null,
            hash.skin ? `pk${hash.skin}` : null,
            hash.killstreak_tier ? `kt-${hash.killstreak_tier}` : null,
            hash.craft_number ? `n${hash.craft_number}` : null,
            hash.crate_number ? `c${hash.crate_number}` : null,
            hash.target_defindex !== undefined ? `td-${hash.target_defindex}` : null,
            hash.output_defindex !== undefined ? `od-${hash.output_defindex}` : null,
            hash.output_quality !== undefined ? `oq-${hash.output_quality}` : null
        ].filter(value => value !== null).join(';');
    }
    
    function getStatsName(hash) {
        return [
            hash.festivized && 'Festivized',
            hash.killstreak_tier_name,
            hash.australium && 'Australium',
            hash.skin_name,
            // skins have a pipe between the skin name and the item name
            hash.skin_name && '|',
            hash.item_name,
            (
                hash.wear_name ?
                    `(${hash.wear_name})` :
                    null
            )
        ].filter(Boolean).join(' ');
    }
    
    function getStatsNameWithOutputs(hash) {
        return [
            hash.festivized && 'Festivized',
            hash.killstreak_tier_name,
            hash.target_item_name,
            hash.output_item_name,
            hash.australium && 'Australium',
            hash.skin_name,
            hash.item_name,
            (
                hash.wear_name ?
                    `(${hash.wear_name})` :
                    null
            )
        ].filter(Boolean).join(' ');
    }

    // creates a market hash name from hash
    function getMarketHashName(hash) {
        const properName = getProperName(hash);
        const qualityName = getQualityName(hash);
        const statsName = getStatsNameWithOutputs(hash);
        
        return [
            properName,
            qualityName,
            statsName,
            // only add series number if this is not a case
            (
                !/ Case$/.test(hash.item_name) &&
                getSeriesNumberName(hash)
            )
        ].filter(Boolean).join(' ');
    }
    
    function getSeriesNumberName(hash) {
        if (!hash.series_number && !hash.crate_number) {
            return null;
        }
        
        return `Series #${hash.series_number || hash.crate_number}`;
    }

    function getFullName(hash) {
        const particleName = getValue('particles', 'value', 'name', hash.priceindex);
        const qualityName = getQualityName(hash);
        const properName = getProperName(hash);
        const statsName = getStatsNameWithOutputs(hash);
        const seriesNumberName = getSeriesNumberName(hash);
        
        return [
            !hash.craftable && 'Non-Craftable' ,
            hash.particle_name || properName || qualityName,
            statsName,
            seriesNumberName,
            (
                hash.craft_number ?
                    `#${hash.craft_number}` :
                    null
            )
        ].filter(Boolean).join(' ');
    }
    
    function getQualityName(hash) {
        if (hash.particle && hash.quality === EQuality['Decorated Weapon']) {
            // unusual weapon
            return 'Unusual';
        } else if (hash.quality === EQuality.Unique) {
            // do not display "Unique" in names
            return null;
        }
        
        return hash.quality_name;
    }

    function getProperName(hash) {
        // must be unique
        if (hash.quality !== EQuality['Unique']) {
            return;
        } else if (hash.killstreak_tier) {
            // no "The" in killstreak either
            return;
        } else if (hash.strange) {
            // strange uniques?
            return;
        } else if (hash.festived) {
            // festive!
            return;
        }
        
        const properName = getValue('items', 'defindex', 'proper_name', hash.defindex);
        
        // does not have a proper name
        if (!properName) {
            return;
        }
        
        // the
        return 'The';
    }
    
    // create search index for records
    // this offers a quick way to get a value from the schema
    const { getValue, getKey } = createSchemaSearchIndex(recordIndex);
    // generate regexp patterns for names
    const patterns = Object.entries({
        // order is important
        wears: 'name',
        killstreak_tiers: 'name',
        particles: 'name',
        skins: 'name'
    }).reduce((patterns, [tableName, columnName]) => {
        // get the records for this table from the index
        const records = recordIndex[tableName];
        // map names
        const names = records
            // get the value
            .map(record => record[columnName])
            // remove empty values
            .filter(Boolean)
            // sort from longest to shortest
            .sort((a, b) => b.length - a.length)
            // escape string for regular expression
            .map(escapeRegExp)
            // join with pipe
            .join('|');
        
        // wrap this as a capture group
        // must be at front of string
        let patternStr = `^(${names}) `;
        
        if (tableName === 'wears') {
            // wears are wrapped in quotes and appear at the end 
            patternStr = ` \\((${names})\\)$`;
        }
        
        return {
            [tableName]: new RegExp(patternStr),
            ...patterns
        };
    }, {
        // putting more used qualities towards the front and using ^ can improve efficiency
        // more optimized query for quality names
        // 180.061ms vs. 259.384ms in testing (1.5x faster)
        qualities: /^(Unusual|Vintage|Genuine|Haunted|Collector's|Decorated\ Weapon|Normal|Unique|Self\-Made|Community|Completed|Customized|Valve) /
    });
    
    return {
        patterns,
        getValue,
        getKey,
        getMarketHashName,
        getStatsName,
        getFullName,
        getSKU,
        getQualityName,
        getProperName
    };
}
