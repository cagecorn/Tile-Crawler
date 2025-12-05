export class DomEngine {
    constructor (rootId)
    {
        this.root = document.getElementById(rootId);
        if (!this.root) {
            throw new Error(`DomEngine could not find root element with id: ${rootId}`);
        }

        this.root.classList.add('ui-ready');
        this.topButtons = [];
        this.shell = this.createShell();
        this.playSpace = this.wrapGameContainer();
        this.layerRoot = this.createLayerRoot();
        this.infoRow = this.createInfoRow();
    }

    bootstrap ({ buttonCount = 5 } = {})
    {
        const topBar = this.createTopBar(buttonCount);
        const minimapPanel = this.createMinimapPanel();
        const { logPanel, statusColumn, actionColumn } = this.createLogArea();

        return {
            topBar,
            topButtons: this.topButtons,
            minimapViewport: minimapPanel.querySelector('.ui-minimap-viewport'),
            hireButton: minimapPanel.hireButton,
            logViewport: logPanel.querySelector('.ui-log-scroll'),
            playerStatusContainer: statusColumn,
            actionSlotContainer: actionColumn,
            layerRoot: this.layerRoot
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

    createLayerRoot ()
    {
        const existingRoot = document.querySelector('.ui-layer-root');
        if (existingRoot) {
            return existingRoot;
        }

        const layerRoot = document.createElement('div');
        layerRoot.className = 'ui-layer-root';

        document.body.appendChild(layerRoot);

        return layerRoot;
    }

    createInfoRow ()
    {
        const infoRow = document.createElement('div');
        infoRow.className = 'ui-info-row';

        this.playSpace.appendChild(infoRow);

        return infoRow;
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
            this.topButtons.push(button);
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

        const controls = document.createElement('div');
        controls.className = 'ui-minimap-controls';

        const hireButton = document.createElement('button');
        hireButton.type = 'button';
        hireButton.className = 'ui-hire-button';
        hireButton.textContent = '센티넬 고용';
        hireButton.title = '센티넬을 고용하여 플레이어 주변에 배치';
        hireButton.setAttribute('aria-label', '센티넬을 고용하여 플레이어 주변에 배치');

        controls.appendChild(hireButton);

        minimapPanel.appendChild(title);
        minimapPanel.appendChild(viewport);
        minimapPanel.appendChild(controls);

        this.infoRow.appendChild(minimapPanel);

        minimapPanel.hireButton = hireButton;

        return minimapPanel;
    }

    createLogArea ()
    {
        const logArea = document.createElement('div');
        logArea.className = 'ui-log-area';

        const logPanel = this.createLogPanel();
        const { container: sidebar, statusColumn, actionColumn } = this.createLogSidebar();

        logArea.appendChild(logPanel);
        logArea.appendChild(sidebar);
        this.infoRow.appendChild(logArea);

        return { logPanel, statusColumn, actionColumn };
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

        return logPanel;
    }

    createLogSidebar ()
    {
        const sidebar = document.createElement('div');
        sidebar.className = 'ui-log-sidebar';

        const statusColumn = document.createElement('div');
        statusColumn.className = 'ui-sidebar-column ui-status-column';

        const actionColumn = document.createElement('div');
        actionColumn.className = 'ui-sidebar-column ui-actions-column';

        sidebar.appendChild(statusColumn);
        sidebar.appendChild(actionColumn);

        return { container: sidebar, statusColumn, actionColumn };
    }
}
