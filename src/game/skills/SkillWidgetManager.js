export class SkillWidgetManager {
    constructor({ skillEngine = null } = {}) {
        this.skillEngine = skillEngine;
    }

    setSkillEngine(skillEngine) {
        this.skillEngine = skillEngine;
    }

    getSkillData(skillOrId, { level = 1, modifiers = [] } = {}) {
        const skill = typeof skillOrId === 'string'
            ? this.skillEngine?.getSkill?.(skillOrId)
            : skillOrId;

        if (!skill) {
            return null;
        }

        const display = {
            id: skill.id,
            name: skill.name,
            icon: skill.icon,
            description: skill.description,
            cooldown: skill.cooldown,
            manaCost: skill.manaCost,
            level,
            power: skill.power ?? skill.damageMultiplier ?? null,
            skill
        };

        modifiers?.forEach((modifier) => {
            if (typeof modifier !== 'function') {
                return;
            }
            const updates = modifier({ ...display });
            if (updates && typeof updates === 'object') {
                Object.assign(display, updates);
            }
        });

        return display;
    }

    formatDetail(display, { showCosts = true } = {}) {
        if (!display) {
            return '알 수 없는 스킬';
        }

        const segments = [];
        if (display.description) {
            segments.push(display.description);
        }

        if (showCosts) {
            const costBits = [];
            if (display.manaCost !== undefined && display.manaCost !== null) {
                costBits.push(`마나 ${display.manaCost}`);
            }
            if (display.cooldown !== undefined && display.cooldown !== null) {
                costBits.push(`쿨타임 ${display.cooldown}턴`);
            }
            if (costBits.length > 0) {
                segments.push(costBits.join(' · '));
            }
        }

        if (display.level !== undefined && display.level !== null) {
            segments.push(`Lv.${display.level}`);
        }

        return segments.join(' · ') || '설명이 없습니다.';
    }

    createInfoRow(skillOrId, {
        level = 1,
        showCosts = true,
        detailFormatter = null,
        rowClass = 'ui-skill-row',
        iconClass = 'ui-skill-icon',
        nameClass = 'ui-skill-name',
        detailClass = 'ui-skill-detail'
    } = {}) {
        const display = this.getSkillData(skillOrId, { level });
        const row = document.createElement('div');
        row.className = rowClass;

        const icon = document.createElement('img');
        icon.className = iconClass;
        icon.src = display?.icon ?? 'assets/images/unit-ui/warrior-ui.png';
        icon.alt = display?.name ? `${display.name} 아이콘` : '스킬 아이콘';

        const info = document.createElement('div');
        info.className = 'ui-skill-info';

        const name = document.createElement('div');
        name.className = nameClass;
        name.textContent = display?.name ?? '알 수 없는 스킬';

        const detail = document.createElement('div');
        detail.className = detailClass;
        const formatter = detailFormatter || ((data) => this.formatDetail(data, { showCosts }));
        detail.textContent = formatter(display);

        info.append(name, detail);
        row.append(icon, info);

        return { row, icon, info, name, detail, display };
    }
}
