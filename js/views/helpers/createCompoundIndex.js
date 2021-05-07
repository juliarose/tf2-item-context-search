// encapsulates functionality for compounds
export default function createCompoundIndex() {
    // private
    // for storing compounded string
    let compoundStr = '';
    // an array to hold already completed indices
    let completedIndices = [];
    const self = {
        // previous term to be auto-completed
        // when an item's full name is fully-typed out but not autocompleted normally
        // e.g. when completing the word "Strange" when the user fully types out the term 
        previousTerm: null,
        // after a space is entered after the previousValue and the term is successfully auto-completed
        previousCompletedTerm: null,
        hasIndex(index) {
            return completedIndices.includes(index); 
        },
        // gets the length of the compound string
        getStrIndex() {
            return compoundStr.length;
        },
        // updates the compound string and returns the new value
        update(offset, slice, term) {
            // a term was not provided, use the previous value
            if (term === undefined) {
                term = self.previousTerm;
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
            
            compoundStr += term.value;
            
            if (compoundStr.length > 0 && offset) {
                compoundStr += offset;
            }
            
            if (term.index) {
                completedIndices.push(term.index);
            }
            
            self.previousCompletedTerm = term;
            // nullify this
            self.previousTerm = null;
            
            return compoundStr;
        },
        // clears the compound
        invalidate() {
            compoundStr = '';
            completedIndices = [];
            self.previousTerm = null;
            self.previousCompletedTerm = null;
        }
    }
    
    return self;
}
