export class DomEngine {
    constructor (rootId)
    {
        this.root = document.getElementById(rootId);
        if (!this.root) {
            throw new Error(`DomEngine could not find root element with id: ${rootId}`);
        }

        this.root.classList.add('ui-ready');
        this.shell = this.createShell();
        this.playSpace = this.wrapGameContainer();
    }

    bootstrap ({ buttonCount = 5 } = {})
    {
        const topBar = this.createTopBar(buttonCount);
        const minimapPanel = this.createMinimapPanel();
        const logPanel = this.createLogPanel();

        return {
            topBar,
            minimapViewport: minimapPanel.querySelector('.ui-minimap-viewport'),
            logViewport: logPanel.querySelector('.ui-log-scroll')
        };
    }

    createShell ()
    {
        const shell = document.createElement('div');
        shell.className = 'ui-shell';

        const parent = this.root.parentElement;
        if (!parent) {
            throw new Error('DomEngine requires the root element to have a parent container.');
        }

        parent.insertBefore(shell, this.root);
        shell.appendChild(this.root);

        return shell;
    }

    wrapGameContainer ()
    {
        const playSpace = document.createElement('div');
        playSpace.className = 'ui-play-space';

        this.shell.appendChild(playSpace);
        playSpace.appendChild(this.root);

        return playSpace;
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
        this.shell.insertBefore(topBar, this.playSpace);

        return topBar;
    }

    createMinimapPanel ()
    {
        const minimapPanel = document.createElement('div');
        minimapPanel.className = 'ui-minimap-panel';

        const title = document.createElement('div');
        title.className = 'ui-minimap-title';
        title.textContent = 'MINIMAP';

        const viewport = document.createElement('div');
        viewport.className = 'ui-minimap-viewport';

        minimapPanel.appendChild(title);
        minimapPanel.appendChild(viewport);

        this.playSpace.appendChild(minimapPanel);

        return minimapPanel;
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
        this.shell.appendChild(logPanel);

        return logPanel;
    }
}
