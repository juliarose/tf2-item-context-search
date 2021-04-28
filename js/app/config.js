import { getStored, setStored } from './storage.js';

// default values for specific keys
const defaultValues = {
    'autoselect-names': true,
    'popup_name': ''
};

// gets id for a setting
function getSettingId(id) {
    return `config-${id}`;
}

const config = {
    // gets a value
    get: async function(key) {
        const settingId = getSettingId(key);
        const defaultValue = defaultValues[key];
        const value = await getStored(settingId);
        
        if (value === undefined) {
            // no value - return the default
            return defaultValue;
        }
        
        return value;
    },
    // set a value
    set: async function(key, value) {
        const settingId = getSettingId(key);
        
        return setStored(settingId, value);
    }
}

export default config;
