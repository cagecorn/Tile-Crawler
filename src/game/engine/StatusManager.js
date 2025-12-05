export class StatusManager {
    constructor({ container } = {}) {
        this.container = container;
        this.panels = new Map();
        this.activeKey = null;
    }

    registerPanel(key, builder) {
        if (!this.container || this.panels.has(key)) {
            return this.panels.get(key)?.panel ?? null;
        }

        const wrapper = document.createElement('div');
        wrapper.className = 'ui-status-panel';
        wrapper.hidden = true;

        this.container.appendChild(wrapper);
        const panel = builder?.(wrapper) ?? null;

        this.panels.set(key, { wrapper, panel });

        if (this.activeKey === key) {
            this.show(key);
        }

        return panel;
    }

    show(key) {
        const entry = this.panels.get(key);
        if (!entry) {
            this.activeKey = key;
            return;
        }

        if (this.activeKey && this.panels.has(this.activeKey)) {
            this.panels.get(this.activeKey).wrapper.hidden = true;
        }

        entry.wrapper.hidden = false;
        this.activeKey = key;

        if (entry.panel?.refresh) {
            entry.panel.refresh();
        } else if (entry.panel?.refreshFromPlayer) {
            entry.panel.refreshFromPlayer();
        }
    }

    getPanel(key) {
        return this.panels.get(key)?.panel ?? null;
    }
}
