// for displaying an error
export function showError(message) {
    const alertEl = document.getElementById('alert');
    const contentEl = document.getElementById('content');
    
    if (alertEl) {
        alertEl.textContent = message;
        alertEl.classList.remove('hidden');
        alertEl.classList.add('error');
    }
    
    if (contentEl) {
        contentEl.remove();
    }
}
