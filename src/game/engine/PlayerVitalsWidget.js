export class PlayerVitalsWidget {
    constructor({ container, player = null, skillManager = null, skillEngine = null } = {}) {
        this.container = container;
        this.player = null;
        this.events = null;

        this.skillManager = skillManager;
        this.skillEngine = skillEngine;
        this.skillSlotElements = new Map();
        this.skillChangeHandler = null;
        this.defaultSlots = ['KeyQ', 'KeyW'];
        this.skillSlotGrid = null;

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
        card.className = 'ui-vitals-card';

        const title = document.createElement('div');
        title.className = 'ui-vitals-title';
        title.textContent = '파티원 상태';

        this.skillSlotElements.clear();
        this.skillSlotGrid = null;

        const body = document.createElement('div');
        body.className = 'ui-vitals-body';

        const bars = document.createElement('div');
        bars.className = 'ui-vitals-bars';

        const healthRow = this.createBarRow('체력', 'ui-vitals-health');
        this.healthBarFill = healthRow.fill;
        this.healthBarText = healthRow.text;

        const manaRow = this.createBarRow('마력', 'ui-vitals-mana');
        this.manaBarFill = manaRow.fill;
        this.manaBarText = manaRow.text;

        bars.append(healthRow.wrapper, manaRow.wrapper);

        const skills = this.createSkillSlots();
        body.append(bars, skills.wrapper);
        card.append(title, body);
        this.container.appendChild(card);

        this.refreshSkillSlots();
    }

    createBarRow(label, modifierClass) {
        const wrapper = document.createElement('div');
        wrapper.className = `ui-vitals-row ${modifierClass}`;

        const labelEl = document.createElement('div');
        labelEl.className = 'ui-vitals-label';
        labelEl.textContent = label;

        const bar = document.createElement('div');
        bar.className = 'ui-vitals-bar';

        const fill = document.createElement('div');
        fill.className = 'ui-vitals-fill';

        const text = document.createElement('span');
        text.className = 'ui-vitals-text';
        text.textContent = '0 / 0';

        bar.append(fill, text);
        wrapper.append(labelEl, bar);

        return { wrapper, fill, text };
    }

    createSkillSlots() {
        const wrapper = document.createElement('div');
        wrapper.className = 'ui-skill-slot-column';

        const title = document.createElement('div');
        title.className = 'ui-skill-title';
        title.textContent = '단축 스킬';

        const grid = document.createElement('div');
        grid.className = 'ui-skill-slots';
        this.skillSlotGrid = grid;

        this.getTrackedSlots().forEach((slotKey) => {
            const slot = this.createSkillSlot(slotKey);
            this.skillSlotElements.set(slotKey, slot);
            grid.appendChild(slot.wrapper);
        });

        wrapper.append(title, grid);

        return { wrapper };
    }

    createSkillSlot(slotKey) {
        const wrapper = document.createElement('div');
        wrapper.className = 'ui-skill-slot';

        const icon = document.createElement('div');
        icon.className = 'ui-skill-icon is-empty';

        const info = document.createElement('div');
        info.className = 'ui-skill-info';

        const name = document.createElement('div');
        name.className = 'ui-skill-name';
        name.textContent = '빈 슬롯';

        const keycap = document.createElement('span');
        keycap.className = 'ui-skill-keycap';
        keycap.textContent = this.getKeyLabel(slotKey);

        info.append(name, keycap);
        wrapper.append(icon, info);

        return { wrapper, icon, name, keycap };
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

        const health = this.player.getHealthState();
        const mana = this.player.getManaState();

        this.updateHealth(health);
        this.updateMana(mana);
    }

    bindSkillManager(skillManager, skillEngine = null) {
        if (skillManager === this.skillManager && skillEngine === this.skillEngine) {
            return;
        }

        this.skillManager = skillManager;
        if (skillEngine) {
            this.skillEngine = skillEngine;
        }

        if (this.skillManager && !this.skillChangeHandler) {
            this.skillChangeHandler = () => this.refreshSkillSlots();
            this.skillManager.onChange(this.skillChangeHandler);
        }

        this.refreshSkillSlots();
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

    refreshSkillSlots() {
        this.getTrackedSlots().forEach((slotKey) => {
            const slot = this.skillSlotElements.get(slotKey) ?? this.createSkillSlot(slotKey);
            if (!this.skillSlotElements.has(slotKey)) {
                this.skillSlotElements.set(slotKey, slot);
                if (this.skillSlotGrid) {
                    this.skillSlotGrid.appendChild(slot.wrapper);
                }
            }

            const skillId = this.skillManager?.getAssignedSkill(slotKey) ?? null;
            const skill = skillId ? this.skillEngine?.getSkill?.(skillId) : null;
            this.populateSkillSlot(slotKey, slot, skill);
        });
    }

    populateSkillSlot(slotKey, slot, skill) {
        if (!slot) {
            return;
        }
        const { wrapper, icon, name, keycap } = slot;
        keycap.textContent = this.getKeyLabel(slotKey);

        const skillName = skill?.name ?? '빈 슬롯';
        name.textContent = skillName;

        wrapper.classList.toggle('is-filled', Boolean(skill));
        icon.classList.toggle('is-empty', !skill?.icon);
        if (skill?.icon) {
            icon.style.backgroundImage = `url(${skill.icon})`;
        } else {
            icon.style.backgroundImage = '';
        }
    }

    getTrackedSlots() {
        if (this.skillManager?.availableSlots?.length) {
            return this.skillManager.availableSlots;
        }
        return this.defaultSlots;
    }

    getKeyLabel(slotKey) {
        if (!slotKey) {
            return '-';
        }
        if (slotKey.startsWith('Key')) {
            return slotKey.replace('Key', '').toUpperCase();
        }
        return slotKey;
    }
}
