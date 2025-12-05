export class PlayerStatusManager {
    constructor({ container, player = null } = {}) {
        this.container = container;
        this.player = null;
        this.events = null;

        this.healthBarFill = null;
        this.healthBarText = null;
        this.manaBarFill = null;
        this.manaBarText = null;
        this.levelValue = null;
        this.experienceValue = null;
        this.statFields = {};
        this.effectList = null;

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
        card.className = 'ui-status-card ui-status-player';

        const header = this.createHeader();
        const bars = this.createBars();
        const statGrid = this.createStatGrid();
        const effects = this.createEffectSection();
        const equipment = this.createSlotSection('장비', 6);
        const passives = this.createSlotSection('패시브 스킬', 4);

        card.appendChild(header);
        card.appendChild(bars);
        card.appendChild(statGrid);
        card.appendChild(effects);
        card.appendChild(equipment);
        card.appendChild(passives);
        this.container.appendChild(card);
    }

    createHeader() {
        const header = document.createElement('div');
        header.className = 'ui-status-header';

        const portrait = document.createElement('img');
        portrait.className = 'ui-status-portrait';
        portrait.src = 'assets/images/unit-ui/warrior-ui.png';
        portrait.alt = '플레이어 초상화';

        const textWrapper = document.createElement('div');
        textWrapper.className = 'ui-status-heading';

        const name = document.createElement('div');
        name.className = 'ui-status-name';
        name.textContent = '플레이어 · 전사';

        const meta = document.createElement('div');
        meta.className = 'ui-status-meta';

        const levelLabel = document.createElement('span');
        levelLabel.textContent = 'Lv.';
        this.levelValue = document.createElement('span');
        this.levelValue.className = 'ui-status-value';
        this.levelValue.textContent = '1';

        const expLabel = document.createElement('span');
        expLabel.textContent = 'EXP';
        this.experienceValue = document.createElement('span');
        this.experienceValue.className = 'ui-status-value';
        this.experienceValue.textContent = '0 / 0';

        meta.append(levelLabel, this.levelValue, document.createTextNode(' · '), expLabel, this.experienceValue);
        textWrapper.append(name, meta);

        header.append(portrait, textWrapper);

        return header;
    }

    createBars() {
        const body = document.createElement('div');
        body.className = 'ui-status-body';

        const healthRow = this.createBarRow('체력', 'ui-status-health');
        this.healthBarFill = healthRow.fill;
        this.healthBarText = healthRow.text;

        const manaRow = this.createBarRow('마력', 'ui-status-mana');
        this.manaBarFill = manaRow.fill;
        this.manaBarText = manaRow.text;

        body.appendChild(healthRow.wrapper);
        body.appendChild(manaRow.wrapper);

        return body;
    }

    createStatGrid() {
        const section = document.createElement('div');
        section.className = 'ui-status-section';

        const title = document.createElement('div');
        title.className = 'ui-status-section-title';
        title.textContent = '주요 스탯';

        const grid = document.createElement('div');
        grid.className = 'ui-stat-grid';

        const statDefinitions = [
            { key: 'attack', label: '물리 공격력' },
            { key: 'defense', label: '물리 방어력' },
            { key: 'magicAttack', label: '마법 공격력' },
            { key: 'magicDefense', label: '마법 방어력' },
            { key: 'evasion', label: '회피율' },
            { key: 'accuracy', label: '정확도' },
            { key: 'actionPoints', label: '행동력' },
            { key: 'movePoints', label: '이동력' },
            { key: 'sightRange', label: '시야' },
            { key: 'critChance', label: '치명타율' }
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

        section.append(title, grid);
        return section;
    }

    createEffectSection() {
        const section = document.createElement('div');
        section.className = 'ui-status-section';

        const title = document.createElement('div');
        title.className = 'ui-status-section-title';
        title.textContent = '버프 / 디버프 / 상태이상';

        const list = document.createElement('div');
        list.className = 'ui-effect-list';
        list.textContent = '활성 효과 없음';
        this.effectList = list;

        section.append(title, list);
        return section;
    }

    createSlotSection(titleText, slotCount) {
        const section = document.createElement('div');
        section.className = 'ui-status-section';

        const title = document.createElement('div');
        title.className = 'ui-status-section-title';
        title.textContent = titleText;

        const grid = document.createElement('div');
        grid.className = 'ui-slot-grid';

        for (let i = 0; i < slotCount; i++) {
            const slot = document.createElement('div');
            slot.className = 'ui-slot';
            slot.textContent = '빈 공간';
            grid.appendChild(slot);
        }

        section.append(title, grid);
        return section;
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

        bar.append(fill, text);
        wrapper.append(labelEl, bar);

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

    refresh() {
        this.refreshFromPlayer();
    }

    refreshFromPlayer() {
        if (!this.player) {
            return;
        }

        const stats = this.gatherStats();

        this.updateHealth(stats.health);
        this.updateMana(stats.mana);
        this.updateMeta(stats);
        this.updateStatValues(stats);
        this.updateEffects();
    }

    gatherStats() {
        const baseStats = this.player?.stats ?? {};
        const level = baseStats.level ?? 1;
        const experience = baseStats.experience ?? 0;

        return {
            health: this.player.getHealthState(),
            mana: this.player.getManaState(),
            attack: baseStats.attack ?? 0,
            defense: baseStats.defense ?? 0,
            magicAttack: baseStats.magicAttack ?? baseStats.attack ?? 0,
            magicDefense: baseStats.magicDefense ?? baseStats.defense ?? 0,
            evasion: baseStats.evasion ?? 0,
            accuracy: baseStats.accuracy ?? 0,
            actionPoints: baseStats.actionPoints ?? 0,
            movePoints: baseStats.movePoints ?? baseStats.mobility ?? 0,
            sightRange: baseStats.sightRange ?? 0,
            critChance: baseStats.critChance ?? 0,
            level,
            experience,
            nextExperience: Math.max(100, level * 100)
        };
    }

    updateMeta({ level, experience, nextExperience }) {
        if (this.levelValue) {
            this.levelValue.textContent = level;
        }
        if (this.experienceValue) {
            this.experienceValue.textContent = `${experience} / ${nextExperience}`;
        }
    }

    updateStatValues(stats) {
        const entries = {
            attack: stats.attack,
            defense: stats.defense,
            magicAttack: stats.magicAttack,
            magicDefense: stats.magicDefense,
            evasion: `${stats.evasion}%`,
            accuracy: `${stats.accuracy}%`,
            actionPoints: stats.actionPoints,
            movePoints: stats.movePoints,
            sightRange: stats.sightRange,
            critChance: `${stats.critChance}%`
        };

        Object.entries(entries).forEach(([key, value]) => {
            if (this.statFields[key]) {
                this.statFields[key].textContent = value;
            }
        });
    }

    updateEffects() {
        if (!this.effectList) {
            return;
        }

        this.effectList.textContent = '활성 효과 없음';
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
