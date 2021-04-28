// creates search index for records
// this offers a quick way to get a value from the schema
// for example to get the name for an item using its defindex
// getValue('items', 'defindex', 'item_name', 34);
// will return the item name for an item with the defindex of 34
export default function createSchemaSearchIndex(recordIndex) {
    // creates an index for records based on key/value
    // @example
    // indexRecords([{ name: 'Cat', id: 1 }], 'name', 'id');
    // { 'Cat': 1 }
    function indexRecords(records, keyColumn, valueColumn, ignoreCase) {
        return records
            .reduce((index, record) => {
                const key = record[keyColumn];
                
                if (key !== undefined) {
                    index[key] = record;
                }
                
                return index;
            }, {});
    }
    
    // creates an index for case-insensitive keys
    // e.g. { 'purple energy': 'Purple Energy' ... }
    function indexKeys(records, keyColumn) {
        return records
            .reduce((index, record) => {
                const key = record[keyColumn];
                
                if (key !== undefined) {
                    index[key.toLowerCase()] = key;
                }
                
                return index;
            }, {});
    }
    
    const index = {};
    const keyIndex = {};
    
    return {
        getValue(table, keyColumn, valueColumn, value, ignoreCase) {
            // key/value index key
            const key = [
                table,
                keyColumn
            ].join(':');
            
            if (ignoreCase && typeof value === 'string') {
                if (keyIndex[key] === undefined) {
                    // generate index for case-insensitive keys
                    keyIndex[key] = indexKeys(recordIndex[table], keyColumn);
                }
                
                // take the value from the case-insensitive key index
                value = keyIndex[key][value.toLowerCase()];
            }
            
            // index does not exist 
            if (index[key] === undefined) {
                // generate index for key/value pair
                // the first-time query will be expensive,
                // but every thereafter read will be extremely fast (taking from a hash of key/value pairs)
                index[key] = indexRecords(recordIndex[table], keyColumn, valueColumn);
            }
            
            // return the value
            return (
                index[key][value] &&
                index[key][value][valueColumn]
            );
        },
        // gets the case-sensitive key for a given value
        // e.g. 'purple energy' will return 'Purple Energy'
        getKey(table, keyColumn, value) {
            if (typeof value !== 'string') {
                return value;
            }
            
            const key = [
                table,
                keyColumn
            ].join(':');
            
            if (keyIndex[key] === undefined) {
                // generate index for case-insensitive keys
                // e.g. { 'purple energy': 'Purple Energy' ... }
                keyIndex[key] = indexKeys(recordIndex[table], keyColumn);
            }
            
            return keyIndex[key][value.toLowerCase()];
        }
    };
}
