import { ATTRIBUTE_DISPLAY_NAMES } from './AttributeResourceEngine.js';

export class AttributeResourceDomManager
{
    constructor({ container = null, playerResourceManager = null, resourceEngine = null } = {})
    {
        this.container = container;
        this.playerResourceManager = playerResourceManager;
        this.resourceEngine = resourceEngine;
        this.resourceElements = new Map();
        this.unsubscribe = null;

        this.render();
        this.registerListeners();
        this.updateDisplay();
    }

    registerListeners()
    {
        if (!this.playerResourceManager) {
            return;
        }
        this.unsubscribe = this.playerResourceManager.onChange(() => this.updateDisplay());
    }

    render()
    {
        if (!this.container || !this.resourceEngine) {
            return;
        }

        this.container.innerHTML = '';
        const list = document.createElement('div');
        list.className = 'ui-resource-list';

        this.resourceEngine.getResourceTypes().forEach((type) => {
            const entry = document.createElement('div');
            entry.className = 'ui-resource-chip';
            const name = document.createElement('span');
            name.className = 'ui-resource-name';
            name.textContent = ATTRIBUTE_DISPLAY_NAMES[type] ?? type;
            const value = document.createElement('span');
            value.className = 'ui-resource-value';
            value.textContent = '0/0';

            entry.appendChild(name);
            entry.appendChild(value);
            list.appendChild(entry);
            this.resourceElements.set(type, value);
        });

        this.container.appendChild(list);
    }

    updateDisplay()
    {
        if (!this.playerResourceManager || this.resourceElements.size === 0) {
            return;
        }
        const resources = this.playerResourceManager.getResources();
        Object.entries(resources).forEach(([type, { total = 0, base = 0, overcharge = 0 }]) => {
            const element = this.resourceElements.get(type);
            if (!element) {
                return;
            }
            element.textContent = `${total}/${base}`;
            element.classList.toggle('ui-resource-value--overcharged', overcharge > 0);
        });
    }

    destroy()
    {
        if (typeof this.unsubscribe === 'function') {
            this.unsubscribe();
            this.unsubscribe = null;
        }
        this.resourceElements.clear();
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}
