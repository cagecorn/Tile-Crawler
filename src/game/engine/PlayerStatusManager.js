export class PlayerStatusManager {
    constructor({ container, player = null } = {}) {
        this.container = container;
        this.player = null;
        this.events = null;
        this.healthBarFill = null;
        this.healthBarText = null;
        this.manaBarFill = null;
        this.manaBarText = null;

        if (this.container) {
            this.buildUi();
        }

        if (player) {
            this.bindPlayer(player);
        }
    }

    buildUi() {
        this.container.innerHTML = '';

        const card = document.createElement('div');
        card.className = 'ui-status-card';

        const title = document.createElement('div');
        title.className = 'ui-status-title';
        title.textContent = 'PLAYER STATUS';

        const body = document.createElement('div');
        body.className = 'ui-status-body';

        const healthRow = this.createBarRow('HEALTH', 'ui-status-health');
        this.healthBarFill = healthRow.fill;
        this.healthBarText = healthRow.text;

        const manaRow = this.createBarRow('MANA', 'ui-status-mana');
        this.manaBarFill = manaRow.fill;
        this.manaBarText = manaRow.text;

        body.appendChild(healthRow.wrapper);
        body.appendChild(manaRow.wrapper);

        card.appendChild(title);
        card.appendChild(body);
        this.container.appendChild(card);
    }

    createBarRow(label, modifierClass) {
        const wrapper = document.createElement('div');
        wrapper.className = `ui-status-row ${modifierClass}`;

        const labelEl = document.createElement('div');
        labelEl.className = 'ui-status-label';
        labelEl.textContent = label;

        const bar = document.createElement('div');
        bar.className = 'ui-status-bar';

        const fill = document.createElement('div');
        fill.className = 'ui-status-bar-fill';

        const text = document.createElement('span');
        text.className = 'ui-status-bar-text';
        text.textContent = '0 / 0';

        bar.appendChild(fill);
        bar.appendChild(text);

        wrapper.appendChild(labelEl);
        wrapper.appendChild(bar);

        return { wrapper, fill, text };
    }

    bindPlayer(player) {
        if (!player) {
            return;
        }

        if (this.events) {
            this.events.off('unit-health-changed', this.onHealthChanged, this);
            this.events.off('unit-mana-changed', this.onManaChanged, this);
        }

        this.player = player;
        this.events = player.scene?.events ?? null;

        if (this.events) {
            this.events.on('unit-health-changed', this.onHealthChanged, this);
            this.events.on('unit-mana-changed', this.onManaChanged, this);
        }

        this.refreshFromPlayer();
    }

    refreshFromPlayer() {
        if (!this.player) {
            return;
        }

        this.updateHealth(this.player.getHealthState());
        this.updateMana(this.player.getManaState());
    }

    onHealthChanged({ unit, current, max }) {
        if (unit !== this.player) {
            return;
        }
        this.updateHealth({ current, max });
    }

    onManaChanged({ unit, current, max }) {
        if (unit !== this.player) {
            return;
        }
        this.updateMana({ current, max });
    }

    updateHealth({ current, max }) {
        this.updateBar(this.healthBarFill, this.healthBarText, current, max);
    }

    updateMana({ current, max }) {
        this.updateBar(this.manaBarFill, this.manaBarText, current, max);
    }

    updateBar(fillEl, textEl, current, max) {
        if (!fillEl || !textEl) {
            return;
        }

        const safeMax = Math.max(1, max ?? 1);
        const ratio = Math.max(0, Math.min(1, (current ?? 0) / safeMax));

        fillEl.style.width = `${ratio * 100}%`;
        textEl.textContent = `${Math.max(0, Math.floor(current ?? 0))} / ${Math.floor(safeMax)}`;
    }
}
