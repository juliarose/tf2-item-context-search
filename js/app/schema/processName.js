import { replaceMatch } from '../utils.js';

export default function processItemName(name, options) {
    function processRegExp(regexp) {
        if (!ignoreCase) {
            return regexp;
        }
        
        // wrap regexp to ignore case
        return new RegExp(regexp, 'i');
    }
    
    function getValue(table, keyColumn, valueColumn, value) {
        return processors.getValue(table, keyColumn, valueColumn, value, ignoreCase);
    }
    
    function getMapValue(map, key) {
        function toTitleCase(str) {
            return str
                .split(' ')
                .map(word => word[0].toUpperCase() + word.substr(1).toLowerCase())
                .join(' ');
        }
        
        if (ignoreCase) {
            // transform the key to title case if we're ignoring the case
            // (all string values in our lookup maps are in title case)
            key = toTitleCase(key);
        }
        
        return map[key];
    }
    
    const { processors, ignoreCase } = options;
    const { getKey } = processors;
    
    // first trim it
    name = name.trim();
    
    // no input
    // do not process strings longer than n characters
    if (name === '' || name.length >= 100) {
        return undefined;
    }
    
    const hash = {
        craftable_name: 'Craftable',
        craftable: true,
        strange: false,
        australium: false
    };
    
    // first we want to correct the name
    name = name
        // remove star character
        .replace(/\u2605/, '')
        // remove "Non-Tradable"
        .replace(/Non\-Tradable /, '')
        // remove "Unknown war paint"
        .replace(/Unknown warpaint \d+/, '')
        // no paint in name
        .replace('Paint: ', '')
        // it's just "Killstreak"
        .replace('Basic Killstreak', 'Killstreak');
    
    // marketplace.tf maps certain names to be something a little different
    // but not quite what we want
    const mpMaps = {
        'TF Logo': 'Circling TF Logo',
        'Peace Sign': 'Circling Peace Sign',
        'Taunt: Shred Alert': 'Shred Alert'
    };
    
    // we transform the names in mpMaps to correct them
    for (let improperName in mpMaps) {
        // the correct name for this improper name
        const correctName = mpMaps[improperName];
        // whether the improper name should be replaced with the correct name
        const shouldReplace = Boolean(
            // name must include the improper name format
            name.includes(improperName) && 
            (
                // the name must not include the correct name
                !name.includes(correctName) ||
                // or the correct name must include the improper name
                // for example, "Taunt: Shred Alert" includes the correct name "Shred Alert"
                // in this case it would fail the previous test
                improperName.includes(correctName)
            )
        );
        
        if (shouldReplace) {
            // replace the improper name with the correct name
            name = name.replace(improperName, correctName);
        }
    }
    
    // this will look for parenthesis which includes a sheen (mp killstreak item)
    const reParens = /\((Team Shine|Deadly Daffodil|Manndarin|Mean Green|Agonizing Emerald|Villainous Violet|Hot Rod).*\)$/;
    // match the information in parenthesis
    const parensMatch = name.match(reParens);
    
    // this is a killstreak item
    if (parensMatch) {
        // remove the parens
        name = replaceMatch(parensMatch);
    }
    
    // starts with "Professional" or "Specialized" but not followed by "Killstreak"
    // these do not match any item names
    const reMpKillstreak = /^(Professional|Specialized) (?!Killstreak )/;
    const mpKillstreakMatch = name.match(reMpKillstreak);
    
    if (mpKillstreakMatch) {
        // correct the killstreak name 
        // e.g. "Professional" -> "Professional Killstreak"
        name = name.replace(reMpKillstreak, `${mpKillstreakMatch[1]} Killstreak `);
    }
    
    const reMpKsQuality = /^(Professional Killstreak|Specialized Killstreak|Killstreak) (Strange|Genuine|Vintage|Normal)/;
    const mpKsQualityMatch = name.match(reMpKsQuality);
    
    if (mpKsQualityMatch) {
        const swappedName = [mpKsQualityMatch[2], mpKsQualityMatch[1]].join(' ');
        
        // switch the order of the killstreak and quality
        // e.g. Specialized Killstreak Strange AWPer Hand -> Strange Specialized Killstreak AWPer Hand
        name = name.replace(mpKsQualityMatch[0], swappedName);
    }
    
    // australium missing "Strange" in name
    if (name.includes('Australium ') && !name.includes('Strange ') && !name.includes('Australium Gold')) {
        // prefix it with "Strange"
        name = `Strange ${name}`;
    } else if (name.includes(' Strange ')) {
        // elevated quality items that
        name = `Strange ${name.replace('Strange ', '')}`;
    }
    
    // special cases
    const specialCases = {
        // these are enclosed in a function
        // so we do not to execute the matches unless
        // we are checking against these tables
        particles: {
            'Hot': function() {
                return Boolean(
                    processRegExp(/^Hot (Dogger|Heels|Hand|Huaraches|Case)/).test(name)
                );
            },
            'Cool': function() {
                return Boolean(
                    processRegExp(/^Cool (Breeze|Cat Cardigan|Capuchon)/).test(name)
                );
            },
            // is Smoking Skin Lid/Jacket but not a "Smoking Smoking"
            'Smoking': function() {
                return Boolean(
                    // has smoking in name
                    processRegExp(/^Smoking (Skid Lid|Jacket)/).test(name) &&
                    // is not "Smoking Smoking"
                    !processRegExp(/^Smoking Smoking/).test(name)
                );
            },
            'Atomic': function() {
                return Boolean(
                    processRegExp(/^Atomic Accolade/).test(name)
                );
            },
            'Accursed': function() {
                return Boolean(
                    processRegExp(/^Accursed Apparition/).test(name)
                );
            }
        },
        qualities: {
            // is a haunted ghosts unusual, not a haunted quality item
            'Haunted': function() {
                return Boolean(
                    processRegExp(/^Haunted (Ghosts|Phantasm Jr|Phantasm)/).test(name) ||
                    processRegExp(/^Haunted Metal Scrap$/).test(name)
                );
            },
            // is Vintage Merryweather/Tyrolean but not a "Vintage Vintage"
            'Vintage': function() {
                return Boolean(
                    // is Vintage Merryweather/Tyrolean
                    processRegExp(/^Vintage (Merryweather|Tyrolean)/).test(name) &&
                    // is not "Vintage Vintage"
                    !processRegExp(/^Vintage Vintage/).test(name)
                );
            }
        }
    };
    // has "Strange" in item name but is actually a unique quality item
    const isActuallyUnique = Boolean(
        processRegExp(/^Strange (Bacon Grease|Part|Cosmetic Part|Filter|Count Transfer Tool)/).test(name)
    );
    const reBooleans = {
        uncraftable: processRegExp(/^(Uncraftable|Non\-Craftable) /),
        strange: processRegExp(/^Strange /),
        australium: processRegExp(/^Australium /),
        festivized: processRegExp(/Festivized /)
    };
    
    if (reBooleans.uncraftable.test(name)) {
        name = name.replace(reBooleans.uncraftable, '');
        hash.craftable_name = 'Non-Craftable';
        hash.craftable = false;
    }
    
    if (!isActuallyUnique && reBooleans.strange.test(name)) {
        name = name.replace(reBooleans.strange, '');
        hash.strange = true;
    }
    
    if (reBooleans.festivized.test(name)) {
        name = name.replace(reBooleans.festivized, '');
        hash.festivized = true;
    }
    
    const hashKeys = [
        // begin by processing quality
        ['qualities', 'quality'],
        // then killstreak...
        ['killstreak_tiers', 'killstreak_tier'],
        // and so on...
        ['wears', 'wear'],
        ['particles', 'particle'],
        // in some cases (unusual weapons on backpack.tf)
        // the effect will appear before the killstreak tier,
        // so check the killstreak tier, again
        ['killstreak_tiers', 'killstreak_tier'],
        ['skins', 'skin']
    ];
    
    for (let i = 0; i < hashKeys.length; i++) {
        const [tableName, hashKey] = hashKeys[i];
        const pattern = processRegExp(processors.patterns[tableName]);
        const match = name.match(pattern);
        
        if (!match) {
            // does not match the pattern
            continue;
        }
        
        // this is in the first matched group
        let valueName = match[1];
        const specialCase = (
            specialCases[tableName] &&
            getMapValue(specialCases[tableName], valueName)
        );
        
        // check special cases
        if (specialCase !== undefined && specialCase()) {
            // does not actually have the attribute we matched
            // for example "Hot Heels" have "Hot" in the name,
            // but do not actually have the "Hot" effect
            continue;
        }
        
        // get the value
        const value = getValue(tableName, 'name', 'value', valueName);
        
        // since the input value for getting the value was not case sensitive
        if (ignoreCase) {
            // back-trace...
            valueName = getKey(tableName, 'name', valueName);
        }
        
        // assign hash values
        hash[hashKey + '_name'] = valueName;
        hash[hashKey] = value;
        
        // replace the matching value from the string
        // this function may be marginally faster as it does not require
        // an additional regexp match
        name = replaceMatch(match);
    }
    
    if (isActuallyUnique) {
        // this is actually a unique quality item but includes "Strange" in its name
        hash.strange = false;
        hash.quality_name = 'Unique';
        hash.quality = 6;
    } else if (hash.strange && (hash.particle === undefined && hash.quality === undefined)) {
        // this is actually a strange quality item
        // not a strangified item
        hash.strange = false;
        hash.quality_name = 'Strange';
        hash.quality = 11;
    }
    
    if (reBooleans.australium.test(name) && !processRegExp(/^Australium Gold$/).test(name)) {
        name = name.replace(reBooleans.australium, '');
        hash.australium = true;
    }
    
    // skinned item
    if (hash.wear !== undefined) {
        // obtain the item name from a list of items
        const reSkinItemName = processRegExp(/(Scotsman's\ Skullcutter|Knife|Wrench|Shotgun|Scattergun|Sniper\ Rifle|Minigun|SMG|Rocket\ Launcher|Grenade\ Launcher|Stickybomb\ Launcher|Flame\ Thrower|Pistol|Revolver|Medi\ Gun|Powerjack|Degreaser|Shortstop|Holy\ Mackerel|Black\ Box|Amputator|Crusader's\ Crossbow|Loch\-n\-Load|Brass\ Beast|Back\ Scratcher|Claidheamh\ Mòr|Jag|Detonator|Shahanshah|Bazaar\ Bargain|Persian\ Persuader|Reserve\ Shooter|Tomislav|Family\ Business|Disciplinary\ Action|Soda\ Popper|Winger|Scorch\ Shot|Loose\ Cannon|Rescue\ Ranger|Air\ Strike|Iron\ Bomber|Panic\ Attack|Ubersaw)$/);
        const skinMatch = name.match(reSkinItemName);
        
        if (skinMatch) {
            name = skinMatch[1];
        }
    }
    
    const reNumber = processRegExp(/ ?(Series)? \#(\d+)$/);
    const numberMatch = name.match(reNumber);
    
    // has a craft number
    if (numberMatch) {
        name = name.replace(reNumber, '');
        
        const isSeries = Boolean(numberMatch[1]);
        const number = parseInt(numberMatch[2]);
        
        // we know it
        if (processRegExp(/(Crate|Case|Munition)$/).test(name)) {
            // this is usually a crate 
            hash.crate_number = number;
            
            // we can determine this is a crate
            // different series crates use different defindex values
            // will match salvaged and reserve crates as well
            if (processRegExp(/Mann Co\. Supply Crate$/).test(name)) {
                if (number <= 25) {
                    // 1st gen
                    hash.defindex = 5041;
                } else if (number <= 57) {
                    // 2nd gen
                    hash.defindex = 5022;
                } else {
                    // 3rd gen
                    hash.defindex = 5045;
                }
            } else if (processRegExp(/Mann Co\. Supply Munition/)) {
                const munitionCrateNumberDefindexMap = {
                    82: 5734,
                    83: 5735,
                    84: 5742,
                    85: 5752,
                    90: 5781,
                    91: 5802,
                    92: 5803,
                    103: 5859
                };
                
                hash.defindex = munitionCrateNumberDefindexMap[number];
            }
        } else if (isSeries) {
            // or a chemistry set
            hash.series_number = number;
        } else {
            // not preceded by "Series"
            // this is a craft number
            hash.craft_number = number;
        }
    }
    
    const itemNameCrateNumberMap = {
        'Festive Winter Crate': 6,
        'Quarantined Collection Case': 96,
        'Gargoyle Case': 98,
        'Unlocked Winter 2016 Cosmetic Case': 105,
        'Pyroland Weapons Case': 99,
        'Winter 2017 War Paint Case': 118,
        'Warbird Weapons Case': 100,
        'Gun Mettle Cosmetic Case': 95,
        'Confidential Collection Case': 97,
        'Creepy Crawly Case': 104,
        'The Powerhouse Weapons Case': 94,
        'Infernal Reward War Paint Case': 110,
        'Naughty Winter Crate': 35,
        'Refreshing Summer Cooler': 22,
        'Scorched Crate': 46,
        'Jungle Jackpot War Paint Case': 109,
        'Nice Winter Crate': 36,
        'Eerie Crate': 51,
        'Fall Crate': 48,
        'Naughty Winter Crate 2012': 52,
        'Violet Vermin Case': 120,
        'Robo Community Crate': 58,
        'Tough Break Cosmetic Case': 101,
        'The Concealed Killer Weapons Case': 93,
        'Nice Winter Crate 2012': 53,
        'Summer 2020 Cosmetic Case': 127,
        'Orange Summer 2013 Cooler': 63,
        'End of the Line Community Crate': 87,
        'Scream Fortress X War Paint Case': 121,
        'Spooky Crate': 74,
        'Spooky Spoils Case': 124,
        'Aqua Summer 2013 Cooler': 66,
        'Black Summer 2013 Cooler': 69,
        'Mayflower Cosmetic Case': 102,
        'Winter 2017 Cosmetic Case': 117,
        'Scream Fortress XII War Paint Case': 129,
        'Wicked Windfall Case': 128,
        'Blue Summer 2013 Cooler': 67,
        'Brown Summer 2013 Cooler': 68,
        'Fall 2013 Gourd Crate': 73,
        'Green Summer 2013 Cooler': 65,
        'Limited Late Summer Crate': 86,
        'Mann Co. Strongbox': 81,
        'Red Summer 2013 Cooler': 62,
        'Summer Appetizer Crate': 61,
        'Yellow Summer 2013 Cooler': 64,
        'Abominable Cosmetic Case': 107,
        'Blue Moon Cosmetic Case': 119,
        'Fall 2013 Acorns Crate': 72,
        'Naughty Winter Crate 2013': 78,
        'Naughty Winter Crate 2014': 88,
        'Nice Winter Crate 2013': 79,
        'Nice Winter Crate 2014': 89,
        'Rainy Day Cosmetic Case': 106,
        'Summer 2019 Cosmetic Case': 123,
        'Unleash the Beast Cosmetic Case': 108,
        'Winter 2018 Cosmetic Case': 122,
        'Winter 2019 Cosmetic Case': 125,
        'Winter 2019 War Paint Case': 126,
        'Winter 2020 Cosmetic Case': 130,
        'Winter 2020 War Paint Case': 131
    };
    const itemNameCrateNumber = getMapValue(itemNameCrateNumberMap, name);
    
    if (itemNameCrateNumber !== undefined) {
        hash.crate_number = itemNameCrateNumber;
        
        // do not use series number, it's a crate
        delete hash.series_number;
    }
    
    // items which have outputs/targets
    const reTargetOutputItem = processRegExp(/ (Unusualifier|Strangifier|Chemistry Set|Fabricator|Kit)$/);
    const targetOutputItemMatch = name.match(reTargetOutputItem);
    
    if (targetOutputItemMatch) {
        const baseName = name.replace(reTargetOutputItem, '');
        // check if this item will have an output
        const reOutput = processRegExp(/ (Strangifier|Kit)$/);
        const outputMatch = baseName.match(reOutput);
        // recurs to get the output/target
        const subHash = processItemName(baseName, options);
        
        if (subHash) {
            const isChemistrySet = processRegExp(/^Chemistry Set$/).test(targetOutputItemMatch[1]);
            
            if (outputMatch || isChemistrySet) {
                // take from original hash
                hash.output_quality = hash.quality || 6;
                hash.output_quality_name = hash.quality_name || 'Unique';
                hash.output_defindex = subHash.defindex;
                hash.output_item_name = subHash.item_name;
                
                // bring it up
                if (subHash.target_defindex !== undefined) {
                    hash.target_defindex = subHash.target_defindex;
                    hash.target_item_name = subHash.target_item_name;
                }
                
                if (hash.output_item_name === 'Kit' && hash.killstreak_tier !== undefined) {
                    // defindex values based on killstreak tier
                    const killstreakTierDefindexMap = {
                        3: 6526,
                        2: 6523,
                        1: 6527
                    };
                    
                    // get the correct kit
                    if (killstreakTierDefindexMap[hash.killstreak_tier] !== undefined) {
                        hash.output_defindex = killstreakTierDefindexMap[hash.killstreak_tier];
                    }
                } else if (isChemistrySet) {
                    if (hash.quality === 14) {
                        // collector's chemistry set
                        if (/^Festive /.test(hash.output_item_name)) {
                            // collector's festive
                            hash.defindex = 20007;
                        } else {
                            hash.defindex = 20006;
                        }
                    } else if (hash.output_item_name === 'Strangifier') {
                        if (hash.series_number === undefined) {
                            const targetItemNameSeriesNumberMap = {
                                'Stockbroker\'s Scarf': 2,
                                'Foppish Physician': 2,
                                'Professor Speks': 2,
                                'Outback Intellectual': 2,
                                'Sandvich Safe': 2,
                                'Blood Banker': 2,
                                'Boston Boom-Bringer': 2,
                                'Dark Age Defender': 2,
                                'Lord Cockswain\'s Novelty Mutton Chops and Pipe': 2
                            };
                            
                            if (targetItemNameSeriesNumberMap[hash.target_item_name] !== undefined) {
                                hash.series_number = targetItemNameSeriesNumberMap[hash.target_item_name];
                            } else {
                                // otherwise usually series 1
                                hash.series_number = 1;
                            }
                        }
                        
                        if (hash.series_number === 2) {
                            hash.defindex = 20005;
                        } else {
                            // series 1 chemistry set
                            hash.defindex = 20000;
                        }
                    }
                }
            } else {
                // has a target
                hash.target_defindex = subHash.defindex;
                hash.target_item_name = subHash.item_name;
            }
            
            name = targetOutputItemMatch[1];
            // always unique quality
            hash.quality = 6;
            hash.quality_name = 'Unique';
            
            const reUnusualifier = processRegExp(/^Unusualifier$/);
            const reStrangifier = processRegExp(/^Strangifier$/);
            
            if (reUnusualifier.test(name)) {
                // unusualifiers are unusual and not craftable
                hash.quality = 5;
                hash.quality_name = 'Unusual';
                hash.craftable = false;
            } else if (reStrangifier.test(name)) {
                // strangifiers for certain items use a specific defindex
                const targetItemNameDefindexMap = {
                    'Pomson 6000': 5661,
                    'Pretty Boy\'s Pocket Pistol': 5721,
                    'Phlogistinator': 5722,
                    'Cleaner\'s Carbine': 5723,
                    'Private Eye': 5724,
                    'Big Chief': 5725,
                    'Air Strike': 5753,
                    'Classic': 5754,
                    'Manmelter': 5755,
                    'Vaccinator': 5756,
                    'Widowmaker': 5757,
                    'Anger': 5758,
                    'Apparition\'s Aspect': 5759,
                    'Cow Mangler 5000': 5783,
                    'Third Degree': 5784,
                    'Righteous Bison': 5804
                };
                
                if (targetItemNameDefindexMap[hash.target_item_name] !== undefined) {
                    hash.defindex = targetItemNameDefindexMap[hash.target_item_name];
                } else {
                    // for others....
                    hash.defindex = 6522;
                }
            }
        }
    }
    
    if (hash.defindex === undefined && hash.killstreak_tier !== undefined) {
        if (processRegExp(/^Fabricator$/).test(name)) {
            // defindex values based on killstreak tier
            const killstreakTierDefindexMap = {
                3: 20003,
                2: 20002
            };
            
            // pick fabricator defindex based on killstreak tier
            hash.defindex = killstreakTierDefindexMap[hash.killstreak_tier];
        } else if (processRegExp(/^Kit$/).test(name)) {
            // defindex values based on killstreak tier
            const killstreakTierDefindexMap = {
                3: 6526,
                2: 6523,
                1: 6527
            };
            
            hash.defindex = killstreakTierDefindexMap[hash.killstreak_tier];
            // all kits are not craftable
            hash.craftable_name = 'Non-Craftable';
            hash.craftable = false;
        }
    }
    
    if (hash.defindex === undefined) {
        // stock weapon defindices, these items exist in other definitions
        // but we want to use these defindex values
        const itemNameDefindexMap = {
            'Bat': 190,
            'Bottle': 191,
            'Fire Axe': 192,
            'Kukri': 193,
            'Knife': 194,
            'Fists': 195,
            'Shovel': 196,
            'Wrench': 197,
            'Bonesaw': 198,
            'Shotgun': 199,
            'Scattergun': 200,
            'Sniper Rifle': 201,
            'Minigun': 202,
            'SMG': 203,
            'Syringe Gun': 204,
            'Rocket Launcher': 205,
            'Grenade Launcher': 206,
            'Stickybomb Launcher': 207,
            'Flame Thrower': 208,
            'Pistol': 209,
            'Revolver': 210,
            'Medi Gun': 211,
            'Invis Watch': 212
        };
        
        hash.defindex = getMapValue(itemNameDefindexMap, name);
    }
    
    if (hash.defindex === undefined && hash.quality !== 1) {
        // for promo items, the defindex is different for the genuine versions,
        // which will otherwise be selected when the quality is genuine (1) since the defindex is higher
        // otherwise if the quality is not genuine, we want to pick from these defindex values
        const promoItemNameDefindexMap = {
            'Red-Tape Recorder': 810,
            'Huo-Long Heater': 811,
            'Flying Guillotine': 812,
            'Neon Annihilator': 813,
            'Triad Trinket': 814,
            'Champ Stamp': 815,
            'Marxman': 816,
            'Human Cannonball': 817,
            'Arkham Cowl': 30720,
            'Firefly': 30721,
            'Fear Monger': 30724
        };
        
        hash.defindex = getMapValue(promoItemNameDefindexMap, name);
    }
    
    if (hash.defindex === undefined) {
        // lookup item name from schema
        hash.defindex = getValue('items', 'item_name', 'defindex', name);
    }
    
    // still nothing...
    if (hash.defindex === undefined) {
        // try it without "The"
        name = name.replace(processRegExp(/^The /), '');
        
            // lookup item name from schema without "The"
        hash.defindex = getValue('items', 'item_name', 'defindex', name);
    }
    
    // processing failed
    // this is either an invalid name or in rare cases, something went wrong
    if (hash.defindex === undefined) {
        return null;
    }
    
    
    if (ignoreCase) {
        // get the correct case name
        hash.item_name = getValue('items', 'defindex', 'item_name', hash.defindex);
    } else {
        // if we have a defindex value, we've successfully gotten the base item name
        hash.item_name = name;
    }
    
    if (hash.particle !== undefined && hash.quality !== 15) {
        // this is definitely unusual
        hash.quality_name = 'Unusual';
        hash.quality = 5;
        
        if (hash.wear !== undefined) {
            // unusual skins usually use 15 as the quality
            hash.sku = processors.getSKU({
                ...hash,
                quality: 15
            });
        }
    }
    
    if (hash.quality === undefined) {
        if (hash.skin_name !== undefined) {
            hash.quality_name = 'Decorated Weapon';
            hash.quality = 15;
        } else {
            // defaults to unique
            hash.quality_name = 'Unique';
            hash.quality = 6;
        }
    }
    
    // of course
    const priceindex = [
        // I don't know why, but kits will lead with the killstreak tier for kits
        hash.item_name === 'Kit' && hash.killstreak_tier,
        hash.output_defindex,
        hash.output_quality,
        hash.target_defindex,
        hash.crate_number,
        hash.particle
    ].filter(Boolean).join('-');
    
    if (priceindex.length > 0) {
        hash.priceindex = priceindex;
    }
    
    hash.market_name = processors.getMarketHashName(hash);
    hash.full_name = processors.getFullName(hash);
    hash.stats_name = processors.getStatsName(hash);
    
    if (hash.sku === undefined) {
        hash.sku = processors.getSKU(hash);
    }
    
    return hash;
}
