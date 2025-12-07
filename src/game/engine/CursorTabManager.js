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
    constructor({ root = null, hideDelay = 160 } = {}) {
        this.root = root ?? document.body;
        this.hideDelay = hideDelay;
        this.hideTimer = null;
        this.tab = this.createTab();
        this.body = this.tab.querySelector('.ui-cursor-tab-body');
        this.title = this.tab.querySelector('.ui-cursor-tab-title');
        this.subtitle = this.tab.querySelector('.ui-cursor-tab-subtitle');
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

        this.populateTab({
            title,
            subtitle: overview,
            anchor,
            sections: [
                this.createDescription(description),
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
                })
            ]
        });
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

