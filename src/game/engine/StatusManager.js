export class StatusManager {
    constructor({ container, layerManager } = {}) {
        this.container = container;
        this.layerManager = layerManager;
        this.panels = new Map();
        this.activeKey = null;
    }

    registerPanel(key, builder, { mode = this.layerManager ? 'layer' : 'inline', title = '', onClose = null } = {}) {
        if (this.panels.has(key)) {
            return this.panels.get(key)?.panel ?? null;
        }

        if (mode === 'layer' && this.layerManager) {
            const layer = this.layerManager.createLayer(key, {
                title,
                onClose: () => {
                    if (this.activeKey === key) {
                        this.activeKey = null;
                    }
                    onClose?.();
                }
            });
            const panel = builder?.(layer.content) ?? null;
            this.panels.set(key, { wrapper: layer.overlay, panel, type: 'layer', title });

            if (this.activeKey === key) {
                this.show(key);
            }

            return panel;
        }

        if (!this.container) {
            return null;
        }

        const wrapper = document.createElement('div');
        wrapper.className = 'ui-status-panel';
        wrapper.hidden = true;

        this.container.appendChild(wrapper);
        const panel = builder?.(wrapper) ?? null;

        this.panels.set(key, { wrapper, panel, type: 'inline', title });

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
            const previousEntry = this.panels.get(this.activeKey);
            this.hideEntry(previousEntry, this.activeKey);
        }

        if (entry.type === 'layer' && this.layerManager) {
            this.layerManager.showLayer(key, { title: entry.title });
        } else if (entry.wrapper) {
            entry.wrapper.hidden = false;
        }

        this.activeKey = key;

        if (entry.panel?.refresh) {
            entry.panel.refresh();
        } else if (entry.panel?.refreshFromPlayer) {
            entry.panel.refreshFromPlayer();
        }
    }

    hide(key = this.activeKey) {
        if (!key || !this.panels.has(key)) {
            return;
        }

        const entry = this.panels.get(key);
        this.hideEntry(entry, key);

        if (this.activeKey === key) {
            this.activeKey = null;
        }
    }

    hideEntry(entry, key) {
        if (!entry) {
            return;
        }

        if (entry.type === 'layer' && this.layerManager) {
            this.layerManager.hideLayer(key);
        } else if (entry.wrapper) {
            entry.wrapper.hidden = true;
        }
    }

    getPanel(key) {
        return this.panels.get(key)?.panel ?? null;
    }
}
