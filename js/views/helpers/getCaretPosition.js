export default function getCaretPosition(inputEl) {
    if (document.selection) {
        // Set focus on the element
        inputEl.focus();

        // To get cursor position, get empty selection range
        const selection = document.selection.createRange();

        // Move selection start to 0 position
        selection.moveStart('character', -inputEl.value.length);

        // The caret position is selection length
        return selection.text.length;
    } else if (inputEl.selectionStart || inputEl.selectionStart === '0') {
        // firefox
        return (
            inputEl.selectionDirection === 'backward' ?
                inputEl.selectionStart :
                inputEl.selectionEnd
        );
    }
    
    return 0;
}
