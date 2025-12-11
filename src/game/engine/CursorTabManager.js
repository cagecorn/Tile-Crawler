import { ATTRIBUTE_DISPLAY_NAMES } from './AttributeResourceEngine.js';
import { SkillWidgetManager } from '../skills/SkillWidgetManager.js';

const STAT_LABELS = {
    health: '체력',
    mana: '마력',
    attack: '물리 공격력',
    defense: '물리 방어력',
    magicAttack: '마법 공격력',
    magicDefense: '마법 방어력',
    movePoints: '이동력',
    actionSpeed: '행동 속도',
    sightRange: '시야',
    accuracy: '정확도',
    evasion: '회피',
    critChance: '치명타'
};

export class CursorTabManager {
    constructor({ root = null, hideDelay = 160, equipmentProvider = null } = {}) {
        this.root = root ?? document.body;
        this.hideDelay = hideDelay;
        this.hideTimer = null;
        this.tab = this.createTab();
        this.body = this.tab.querySelector('.ui-cursor-tab-body');
        this.title = this.tab.querySelector('.ui-cursor-tab-title');
        this.subtitle = this.tab.querySelector('.ui-cursor-tab-subtitle');
        this.skillWidgetManager = new SkillWidgetManager({ skillEngine: null });
        this.equipmentProvider = equipmentProvider;
    }

    createTab() {
        const tab = document.createElement('div');
        tab.className = 'ui-cursor-tab is-hidden';
        tab.setAttribute('role', 'dialog');
        tab.setAttribute('aria-hidden', 'true');

        const header = document.createElement('div');
        header.className = 'ui-cursor-tab-header';

        const title = document.createElement('div');
        title.className = 'ui-cursor-tab-title';
        const subtitle = document.createElement('div');
        subtitle.className = 'ui-cursor-tab-subtitle';

        header.append(title, subtitle);

        const body = document.createElement('div');
        body.className = 'ui-cursor-tab-body';

        tab.append(header, body);
        this.root.appendChild(tab);

        return tab;
    }

    attachItemHover(element, item) {
        if (!element || !item) {
            return;
        }

        const show = (event) => {
            const anchor = this.extractAnchor(event, element);
            this.showItemTab(item, anchor);
        };

        element.addEventListener('mouseenter', show);
        element.addEventListener('mousemove', show);
        element.addEventListener('mouseleave', () => this.hide());
    }

    attachMonsterHover(sprite, monster) {
        if (!sprite || !monster || !sprite.setInteractive) {
            return;
        }

        sprite.setInteractive({ cursor: 'pointer' });

        sprite.on('pointerover', (pointer) => {
            this.showMonsterTab(monster, this.extractAnchor(pointer?.event));
        });

        sprite.on('pointermove', (pointer) => {
            this.showMonsterTab(monster, this.extractAnchor(pointer?.event));
        });

        sprite.on('pointerout', () => this.hide());
    }

    showItemTab(item, anchor = null) {
        const slot = item.slot ? `${item.slot.toUpperCase()} 슬롯` : '장비 아이템';
        const type = item.type ? `${item.type.toUpperCase()} 타입` : '기본형';
        const subtitle = `${slot} · ${type}`;
        const description = item.description || '설명이 없는 장비입니다.';

        this.populateTab({
            title: item.name ?? '알 수 없는 아이템',
            subtitle,
            anchor,
            sections: [
                this.createDescription(description),
                this.createStatList(item.stats)
            ]
        });
    }

    showMonsterTab(monster, anchor = null) {
        const title = monster.getName?.() ?? monster.name ?? '알 수 없는 몬스터';
        const stats = monster.stats ?? {};
        const healthLine = `${monster.currentHealth ?? stats.health ?? 0} / ${monster.maxHealth ?? stats.health ?? 0}`;
        const overview = `${monster.faction ?? '적대 세력'} · 시야 ${stats.sightRange ?? '-'} · 이동력 ${stats.movePoints ?? stats.mobility ?? '-'}`;
        const description = monster.description ?? `${title}는 이 구역을 배회하며 침입자를 노립니다.`;
        const skills = this.extractSkillHints(monster);
        const equipment = this.getEquipment(monster);

        this.populateTab({
            title,
            subtitle: overview,
            anchor,
            sections: [
                this.createDescription(description),
                this.createEquipmentSection(equipment),
                this.createStatList({
                    health: healthLine,
                    attack: stats.attack,
                    defense: stats.defense,
                    magicAttack: stats.magicAttack,
                    magicDefense: stats.magicDefense,
                    movePoints: stats.movePoints ?? stats.mobility,
                    actionSpeed: stats.actionSpeed,
                    sightRange: stats.sightRange,
                    accuracy: stats.accuracy,
                    evasion: stats.evasion,
                    critChance: stats.critChance
                }),
                this.createSkillSection(skills)
            ]
        });
    }

    setEquipmentProvider(provider)
    {
        this.equipmentProvider = provider;
    }

    getEquipment(monster)
    {
        if (!monster) {
            return null;
        }
        if (typeof this.equipmentProvider === 'function') {
            return this.equipmentProvider(monster);
        }
        if (this.equipmentProvider?.getLoadout) {
            return this.equipmentProvider.getLoadout(monster);
        }
        return null;
    }

    populateTab({ title, subtitle = '', sections = [], anchor = null } = {}) {
        if (!this.body || !this.title || !this.subtitle) {
            return;
        }

        clearTimeout(this.hideTimer);
        this.body.innerHTML = '';
        this.title.textContent = title ?? '';
        this.subtitle.textContent = subtitle ?? '';

        sections.filter(Boolean).forEach((section) => this.body.appendChild(section));

        this.tab.classList.remove('is-hidden');
        this.tab.setAttribute('aria-hidden', 'false');
        if (anchor) {
            this.positionTab(anchor);
        }
    }

    createDescription(text) {
        const paragraph = document.createElement('p');
        paragraph.className = 'ui-cursor-tab-text';
        paragraph.textContent = text;
        return paragraph;
    }

    createSkillSection(skills = [])
    {
        if (!skills || skills.length === 0) {
            return null;
        }

        const wrapper = document.createElement('div');
        wrapper.className = 'ui-cursor-skill-list';

        const title = document.createElement('div');
        title.className = 'ui-cursor-stat-label';
        title.textContent = '사용 스킬';
        wrapper.appendChild(title);

        skills.forEach((skill) => {
            const display = this.skillWidgetManager.getSkillData(skill, { level: skill.level ?? 1 });
            const row = document.createElement('div');
            row.className = 'ui-cursor-skill-row';

            const name = document.createElement('div');
            name.className = 'ui-cursor-skill-name';
            name.textContent = display?.name ?? '알 수 없는 스킬';

            const detail = document.createElement('div');
            detail.className = 'ui-cursor-skill-detail';
            detail.textContent = this.skillWidgetManager.formatDetail(display ?? skill, { showCosts: true });

            row.append(name, detail);
            wrapper.appendChild(row);
        });

        return wrapper;
    }

    createEquipmentSection(loadout = null)
    {
        if (!loadout) {
            return null;
        }

        const equipped = Object.entries(loadout).filter(([, item]) => Boolean(item));
        if (equipped.length === 0) {
            return null;
        }

        const wrapper = document.createElement('div');
        wrapper.className = 'ui-cursor-stat-list';

        const title = document.createElement('div');
        title.className = 'ui-cursor-stat-label';
        title.textContent = '장비';
        wrapper.appendChild(title);

        equipped.forEach(([slot, item]) => {
            const row = document.createElement('div');
            row.className = 'ui-cursor-stat-row';

            const label = document.createElement('span');
            label.className = 'ui-cursor-stat-label';
            label.textContent = slot.toUpperCase();

            const value = document.createElement('span');
            value.className = 'ui-cursor-stat-value';
            value.textContent = this.formatEquipmentName(item);

            row.append(label, value);
            wrapper.appendChild(row);
        });

        return wrapper;
    }

    formatEquipmentName(item)
    {
        if (!item) {
            return '-';
        }
        const enchant = item.enchantType ? ` (${ATTRIBUTE_DISPLAY_NAMES?.[item.enchantType] ?? item.enchantType})` : '';
        return `${item.name ?? item.baseName ?? '알 수 없음'}${enchant}`;
    }

    createStatList(stats = {}) {
        const entries = Object.entries(stats).filter(([, value]) => value !== undefined && value !== null);
        if (entries.length === 0) {
            return null;
        }

        const wrapper = document.createElement('div');
        wrapper.className = 'ui-cursor-stat-list';

        entries.forEach(([key, value]) => {
            const row = document.createElement('div');
            row.className = 'ui-cursor-stat-row';

            const label = document.createElement('span');
            label.className = 'ui-cursor-stat-label';
            label.textContent = STAT_LABELS[key] ?? key;

            const val = document.createElement('span');
            val.className = 'ui-cursor-stat-value';
            val.textContent = value;

            row.append(label, val);
            wrapper.appendChild(row);
        });

        return wrapper;
    }

    extractSkillHints(monster)
    {
        if (!monster) {
            return [];
        }
        if (Array.isArray(monster.skillHints)) {
            return monster.skillHints.filter(Boolean);
        }
        if (Array.isArray(monster.skills)) {
            return monster.skills.filter(Boolean);
        }
        return [];
    }

    extractAnchor(event, element = null) {
        if (event?.clientX !== undefined && event?.clientY !== undefined) {
            return { x: event.clientX, y: event.clientY };
        }

        if (element) {
            const rect = element.getBoundingClientRect();
            return { x: rect.right, y: rect.top };
        }

        return null;
    }

    positionTab(anchor) {
        const offset = 14;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const { width, height } = this.tab.getBoundingClientRect();

        const proposedLeft = Math.min(anchor.x + offset, viewportWidth - width - offset);
        const proposedTop = Math.min(anchor.y + offset, viewportHeight - height - offset);

        this.tab.style.left = `${Math.max(offset, proposedLeft)}px`;
        this.tab.style.top = `${Math.max(offset, proposedTop)}px`;
    }

    hide() {
        clearTimeout(this.hideTimer);
        this.hideTimer = setTimeout(() => {
            this.tab.classList.add('is-hidden');
            this.tab.setAttribute('aria-hidden', 'true');
        }, this.hideDelay);
    }
}

