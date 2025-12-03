export class DomEngine {
    constructor (rootId)
    {
        this.root = document.getElementById(rootId);
        if (!this.root) {
            throw new Error(`DomEngine could not find root element with id: ${rootId}`);
        }

        this.root.classList.add('ui-ready');
        this.overlay = this.createOverlay();
    }

    bootstrap ({ buttonCount = 5 } = {})
    {
        const topBar = this.createTopBar(buttonCount);
        const logPanel = this.createLogPanel();

        return {
            topBar,
            logViewport: logPanel.querySelector('.ui-log-scroll')
        };
    }

    createOverlay ()
    {
        const overlay = document.createElement('div');
        overlay.className = 'ui-overlay';
        this.root.appendChild(overlay);
        return overlay;
    }

    createTopBar (buttonCount)
    {
        const topBar = document.createElement('div');
        topBar.className = 'ui-top-bar';

        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'ui-top-buttons';

        for (let i = 0; i < buttonCount; i++) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'ui-bar-button';
            button.title = `Action slot ${i + 1}`;
            button.setAttribute('aria-label', `Action slot ${i + 1}`);
            buttonContainer.appendChild(button);
        }

        topBar.appendChild(buttonContainer);
        this.overlay.appendChild(topBar);

        return topBar;
    }

    createLogPanel ()
    {
        const logPanel = document.createElement('div');
        logPanel.className = 'ui-log-panel';

        const title = document.createElement('div');
        title.className = 'ui-log-title';
        title.textContent = 'LOG';

        const scrollRegion = document.createElement('div');
        scrollRegion.className = 'ui-log-scroll';

        logPanel.appendChild(title);
        logPanel.appendChild(scrollRegion);
        this.overlay.appendChild(logPanel);

        return logPanel;
    }
}
