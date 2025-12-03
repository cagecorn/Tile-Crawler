export class LogEngine {
    constructor (logViewport)
    {
        this.logViewport = logViewport;
    }

    log (message)
    {
        if (!this.logViewport || !message) {
            return;
        }

        const entry = document.createElement('div');
        entry.className = 'ui-log-entry';
        entry.textContent = message;

        this.logViewport.appendChild(entry);
        this.logViewport.scrollTop = this.logViewport.scrollHeight;
    }

    clear ()
    {
        if (!this.logViewport) {
            return;
        }

        this.logViewport.innerHTML = '';
    }
}
