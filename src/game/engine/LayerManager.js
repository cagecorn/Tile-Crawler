export class LayerManager {
    constructor({ root = null } = {}) {
        this.root = root ?? document.body;
        this.layers = new Map();
    }

    createLayer(key, { title = '', closable = true, onClose = null } = {}) {
        if (this.layers.has(key)) {
            return this.layers.get(key);
        }

        const overlay = document.createElement('div');
        overlay.className = 'ui-layer is-hidden';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-hidden', 'true');

        const backdrop = document.createElement('div');
        backdrop.className = 'ui-layer-backdrop';

        const windowEl = document.createElement('div');
        windowEl.className = 'ui-layer-window';

        const header = document.createElement('div');
        header.className = 'ui-layer-header';

        const titleEl = document.createElement('div');
        titleEl.className = 'ui-layer-title';
        titleEl.textContent = title;

        const controls = document.createElement('div');
        controls.className = 'ui-layer-controls';

        const closeButton = document.createElement('button');
        closeButton.type = 'button';
        closeButton.className = 'ui-layer-close';
        closeButton.setAttribute('aria-label', '레이어 닫기');
        closeButton.textContent = '×';

        const content = document.createElement('div');
        content.className = 'ui-layer-content';

        controls.appendChild(closeButton);
        header.append(titleEl, controls);
        windowEl.append(header, content);
        overlay.append(backdrop, windowEl);
        this.root.appendChild(overlay);

        const entry = {
            key,
            overlay,
            windowEl,
            content,
            closeButton,
            onClose,
            visible: false
        };

        if (!closable) {
            closeButton.setAttribute('disabled', 'true');
            closeButton.setAttribute('aria-hidden', 'true');
        } else {
            closeButton.addEventListener('click', () => {
                this.hideLayer(key);
                entry.onClose?.();
            });

            backdrop.addEventListener('click', () => {
                this.hideLayer(key);
                entry.onClose?.();
            });
        }

        this.layers.set(key, entry);
        return entry;
    }

    showLayer(key, options = {}) {
        const entry = this.layers.get(key) ?? this.createLayer(key, options);

        if (!entry) {
            return null;
        }

        entry.overlay.classList.remove('is-hidden');
        entry.overlay.classList.add('is-visible');
        entry.overlay.setAttribute('aria-hidden', 'false');
        entry.visible = true;

        return entry;
    }

    hideLayer(key) {
        const entry = this.layers.get(key);
        if (!entry) {
            return;
        }

        entry.overlay.classList.remove('is-visible');
        entry.overlay.classList.add('is-hidden');
        entry.overlay.setAttribute('aria-hidden', 'true');
        entry.visible = false;
    }
}
