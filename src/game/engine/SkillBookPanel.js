import { SkillWidgetManager } from '../skills/SkillWidgetManager.js';

export class SkillBookPanel {
    constructor({ container, skillEngine, playerSkillManager }) {
        this.container = container;
        this.skillEngine = skillEngine;
        this.playerSkillManager = playerSkillManager;
        this.skillWidgetManager = new SkillWidgetManager({ skillEngine });
        this.root = null;
        this.activeList = null;
        this.passiveList = null;

        if (this.container) {
            this.buildUi();
            this.refresh();
        }

        this.playerSkillManager?.onChange(() => this.refresh());
    }

    buildUi() {
        this.container.innerHTML = '';
        const card = document.createElement('div');
        card.className = 'ui-status-card ui-status-player';

        const header = document.createElement('div');
        header.className = 'ui-status-header';
        const title = document.createElement('div');
        title.className = 'ui-status-name';
        title.textContent = '스킬 북';
        header.appendChild(title);

        const body = document.createElement('div');
        body.className = 'ui-skill-columns';

        const activeSection = this.createActiveSection();
        const passiveSection = this.createPassiveSection();

        body.appendChild(activeSection);
        body.appendChild(passiveSection);

        card.appendChild(header);
        card.appendChild(body);
        this.container.appendChild(card);
        this.root = card;
    }

    createActiveSection() {
        const section = document.createElement('div');
        section.className = 'ui-skill-section';

        const title = document.createElement('div');
        title.className = 'ui-status-section-title';
        title.textContent = '액티브 스킬 (Q/W 할당)';

        const list = document.createElement('div');
        list.className = 'ui-skill-list';
        this.activeList = list;

        section.appendChild(title);
        section.appendChild(list);
        return section;
    }

    createPassiveSection() {
        const section = document.createElement('div');
        section.className = 'ui-skill-section';

        const title = document.createElement('div');
        title.className = 'ui-status-section-title';
        title.textContent = '패시브 스킬';

        const list = document.createElement('div');
        list.className = 'ui-skill-list';
        this.passiveList = list;

        section.appendChild(title);
        section.appendChild(list);
        return section;
    }

    refresh() {
        this.refreshActive();
        this.refreshPassive();
    }

    refreshActive() {
        if (!this.activeList) {
            return;
        }
        this.activeList.innerHTML = '';

        const learned = this.playerSkillManager?.getLearnedActive?.() ?? [];
        if (learned.length === 0) {
            this.activeList.textContent = '해금된 액티브 스킬이 없습니다.';
            return;
        }

        learned.forEach((skillId) => {
            const baseRow = this.skillWidgetManager.createInfoRow(skillId, { showCosts: true });
            if (!baseRow.display) {
                return;
            }

            const actions = document.createElement('div');
            actions.className = 'ui-skill-actions';

            ['KeyQ', 'KeyW'].forEach((keyCode) => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'ui-bar-button';
                button.textContent = `[${keyCode === 'KeyQ' ? 'Q' : 'W'}]`;
                const assigned = this.playerSkillManager.getAssignedSkill(keyCode) === skillId;
                button.classList.toggle('is-active', assigned);
                button.addEventListener('click', () => this.playerSkillManager.assignToSlot(keyCode, skillId));
                actions.appendChild(button);
            });

            baseRow.row.appendChild(actions);
            this.activeList.appendChild(baseRow.row);
        });
    }

    refreshPassive() {
        if (!this.passiveList) {
            return;
        }
        this.passiveList.innerHTML = '';

        const learned = this.playerSkillManager?.getLearnedPassive?.() ?? [];
        if (learned.length === 0) {
            this.passiveList.textContent = '해금된 패시브 스킬이 없습니다.';
            return;
        }

        learned.forEach((skillId) => {
            const row = this.skillWidgetManager.createInfoRow(skillId);
            if (row.display) {
                this.passiveList.appendChild(row.row);
            }
        });
    }
}
