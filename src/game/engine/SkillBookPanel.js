export class SkillBookPanel {
    constructor({ container, skillEngine, playerSkillManager }) {
        this.container = container;
        this.skillEngine = skillEngine;
        this.playerSkillManager = playerSkillManager;
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
            const skill = this.skillEngine?.getSkill(skillId);
            if (!skill) {
                return;
            }
            const row = document.createElement('div');
            row.className = 'ui-skill-row';

            const icon = document.createElement('img');
            icon.src = skill.icon;
            icon.alt = `${skill.name} 아이콘`;
            icon.className = 'ui-skill-icon';

            const info = document.createElement('div');
            info.className = 'ui-skill-info';
            const name = document.createElement('div');
            name.className = 'ui-skill-name';
            name.textContent = skill.name;

            const detail = document.createElement('div');
            detail.className = 'ui-skill-detail';
            detail.textContent = `${skill.description ?? ''} · 마나 ${skill.manaCost ?? 0} · 쿨타임 ${skill.cooldown ?? 0}턴`;

            info.appendChild(name);
            info.appendChild(detail);

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

            row.appendChild(icon);
            row.appendChild(info);
            row.appendChild(actions);
            this.activeList.appendChild(row);
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
            const skill = this.skillEngine?.getSkill(skillId);
            if (!skill) {
                return;
            }
            const row = document.createElement('div');
            row.className = 'ui-skill-row';

            const icon = document.createElement('img');
            icon.src = skill.icon;
            icon.alt = `${skill.name} 아이콘`;
            icon.className = 'ui-skill-icon';

            const info = document.createElement('div');
            info.className = 'ui-skill-info';
            const name = document.createElement('div');
            name.className = 'ui-skill-name';
            name.textContent = skill.name;

            const detail = document.createElement('div');
            detail.className = 'ui-skill-detail';
            detail.textContent = skill.description ?? '';

            info.appendChild(name);
            info.appendChild(detail);

            row.appendChild(icon);
            row.appendChild(info);
            this.passiveList.appendChild(row);
        });
    }
}
