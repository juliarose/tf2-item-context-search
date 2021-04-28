
class ValidationError extends Error {
    constructor(message, { messages, targets }) {
        super();
        this.message = message;
        this.messages = messages;
        this.targets = targets;
    }
};

export function createValidationError(errors) {
    const { messages, targets } = errors
        .reduce((memo, error) => {
            const [ message, target ] = error;
            
            memo.messages.push(message);
            
            if (!memo.targets.includes(target)) {
                memo.targets.push(target);
            }
            
            return memo;
        }, {
            messages: [],
            targets: []
        });
    
    return new ValidationError('Invalid', { messages, targets });
}

// converts a form element to an object
export function getForm(formEl) {
    return Array.from(formEl.getElementsByClassName('field'))
        .reduce((memo, fieldEl) => {
            const inputEl = fieldEl.querySelector('input, select');
            
            // no input in field
            if (!inputEl) {
                return memo;
            }
            
            const { value, name } = inputEl;
            
            // no value
            if (value === '') {
                return memo;
            }
            
            // join fields together
            return {
                ...memo,
                [name]: value
            };
        }, {});
}
