export class UnitStatusPanel {
    constructor({ container } = {}) {
        this.container = container;
        this.unit = null;
        this.healthBarFill = null;
        this.healthBarText = null;
        this.manaBarFill = null;
        this.manaBarText = null;
        this.statFields = {};

        if (this.container) {
            this.buildUi();
        }
    }

    buildUi() {
        this.container.innerHTML = '';
        const card = document.createElement('div');
        card.className = 'ui-status-card ui-status-player';

        const header = document.createElement('div');
        header.className = 'ui-status-header';

        this.portrait = document.createElement('img');
        this.portrait.className = 'ui-status-portrait';
        this.portrait.alt = '용병 초상화';

        const heading = document.createElement('div');
        heading.className = 'ui-status-heading';

        this.nameField = document.createElement('div');
        this.nameField.className = 'ui-status-name';

        this.metaField = document.createElement('div');
        this.metaField.className = 'ui-status-meta';

        heading.append(this.nameField, this.metaField);
        header.append(this.portrait, heading);

        const bars = document.createElement('div');
        bars.className = 'ui-status-body';
        const healthRow = this.createBarRow('체력', 'ui-status-health');
        this.healthBarFill = healthRow.fill;
        this.healthBarText = healthRow.text;
        const manaRow = this.createBarRow('마력', 'ui-status-mana');
        this.manaBarFill = manaRow.fill;
        this.manaBarText = manaRow.text;
        bars.append(healthRow.wrapper, manaRow.wrapper);

        const stats = document.createElement('div');
        stats.className = 'ui-status-section';
        const statsTitle = document.createElement('div');
        statsTitle.className = 'ui-status-section-title';
        statsTitle.textContent = '전투 정보';
        const grid = document.createElement('div');
        grid.className = 'ui-stat-grid';

        const statDefinitions = [
            { key: 'attack', label: '물리 공격력' },
            { key: 'defense', label: '물리 방어력' },
            { key: 'magicDefense', label: '마법 방어력' },
            { key: 'movePoints', label: '이동력' },
            { key: 'actionSpeed', label: '행동 속도' },
            { key: 'sightRange', label: '시야' }
        ];

        statDefinitions.forEach(({ key, label }) => {
            const item = document.createElement('div');
            item.className = 'ui-stat-item';
            const statLabel = document.createElement('div');
            statLabel.className = 'ui-stat-label';
            statLabel.textContent = label;
            const value = document.createElement('div');
            value.className = 'ui-stat-value';
            value.textContent = '-';
            item.append(statLabel, value);
            grid.appendChild(item);
            this.statFields[key] = value;
        });

        stats.append(statsTitle, grid);

        card.append(header, bars, stats);
        this.container.appendChild(card);
    }

    createBarRow(label, modifier) {
        const wrapper = document.createElement('div');
        wrapper.className = `ui-status-row ${modifier}`;
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
        bar.append(fill, text);
        wrapper.append(labelEl, bar);
        return { wrapper, fill, text };
    }

    bindUnit(unit) {
        this.unit = unit;
        this.refresh();
    }

    refresh() {
        if (!this.unit) {
            return;
        }
        const stats = this.unit.stats ?? {};
        this.updateBar(this.healthBarFill, this.healthBarText, this.unit.currentHealth, this.unit.maxHealth);
        this.updateBar(this.manaBarFill, this.manaBarText, this.unit.currentMana, this.unit.maxMana);

        if (this.portrait) {
            this.portrait.src = this.unit.portrait ?? 'assets/images/unit-ui/warrior-ui.png';
        }
        if (this.nameField) {
            const className = this.unit.className ?? '동료';
            this.nameField.textContent = `${this.unit.getName?.() ?? '동료'} · ${className}`;
        }
        if (this.metaField) {
            this.metaField.textContent = `시야 ${stats.sightRange ?? '-'} · 이동력 ${stats.movePoints ?? stats.mobility ?? '-'}`;
        }

        const entries = {
            attack: stats.attack ?? 0,
            defense: stats.defense ?? 0,
            magicDefense: stats.magicDefense ?? stats.defense ?? 0,
            movePoints: stats.movePoints ?? stats.mobility ?? 0,
            actionSpeed: stats.actionSpeed ?? 0,
            sightRange: stats.sightRange ?? 0
        };

        Object.entries(entries).forEach(([key, value]) => {
            if (this.statFields[key]) {
                this.statFields[key].textContent = value;
            }
        });
    }

    updateBar(fillEl, textEl, current, max) {
        if (!fillEl || !textEl) {
            return;
        }
        const safeMax = Math.max(1, max ?? 1);
        const ratio = Math.max(0, Math.min(1, (current ?? 0) / safeMax));
        fillEl.style.width = `${ratio * 100}%`;
        textEl.textContent = `${Math.floor(current ?? 0)} / ${Math.floor(safeMax)}`;
    }
}
