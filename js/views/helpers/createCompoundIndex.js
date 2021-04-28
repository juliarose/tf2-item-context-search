// encapsulates functionality for compounds
export default function createCompoundIndex() {
    // private
    // for storing compounded string
    let compoundStr = '';
    const self = {
        // previous value to be auto-completed
        // when an item's full name is fully-typed out but not autocompleted normally
        // e.g. when completing the word "Strange" when the user fully types out the term 
        previousValue: null,
        // after a space is entered after the previousValue and the term is successfully auto-completed
        previousCompletedValue: null,
        // gets the length of the compound string
        getIndex() {
            return compoundStr.length;
        },
        // updates the compound string and returns the new value
        update(offset, slice, term) {
            // a term was not provided, use the previous value
            if (term === undefined) {
                term = self.previousValue;
            }
            
            if (slice !== undefined) {
                // tkae off difference
                compoundStr = compoundStr.slice(0, slice).trim();
            }
            
            if (compoundStr.length > 0) {
                let lastChar = compoundStr[compoundStr.length - 1];
                
                if (lastChar !== ' ') {
                    compoundStr += ' ';
                }
            }
            
            compoundStr += term;
            
            if (compoundStr.length > 0 && offset) {
                compoundStr += offset;
            }
            
            self.previousCompletedValue = term;
            // nullify this
            self.previousValue = null;
            
            return compoundStr;
        },
        // clears the compound
        invalidate() {
            compoundStr = '';
            self.previousValue = null;
            self.previousCompletedValue = null;
        }
    }
    
    return self;
}
