export class SkillWidgetManager {
    constructor({ skillEngine = null } = {}) {
        this.skillEngine = skillEngine;
    }

    setSkillEngine(skillEngine) {
        this.skillEngine = skillEngine;
    }

    buildEffectDescription(skill = {})
    {
        const effects = [];

        if (skill.effectText) {
            effects.push(skill.effectText);
        }

        if (skill.damageMultiplier || skill.power) {
            const multiplier = skill.damageMultiplier ?? skill.power;
            effects.push(`공격 배율 ${multiplier}배`);
        }

        if (skill.healingRatio) {
            effects.push(`치유 배율 ${skill.healingRatio}배`);
        }

        if (skill.range?.min !== undefined && skill.range?.max !== undefined) {
            effects.push(`사거리 ${skill.range.min}~${skill.range.max}`);
        }

        if (effects.length === 0 && skill.description) {
            return '부가 효과 없음';
        }

        return effects.join(' · ') || '부가 효과 없음';
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
            effect: skill.effect ?? skill.effectText ?? null,
            level,
            power: skill.power ?? skill.damageMultiplier ?? null,
            skill
        };

        display.effect ??= this.buildEffectDescription(display.skill);

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
        const description = display.description ?? '설명이 없습니다.';
        const effect = display.effect ?? this.buildEffectDescription(display.skill) ?? '부가 효과 없음';
        segments.push(description);
        segments.push(`효과: ${effect}`);

        if (showCosts) {
            const manaText = display.manaCost !== undefined && display.manaCost !== null
                ? `${display.manaCost} 마나`
                : '마나 소모 없음';
            const cooldownText = display.cooldown !== undefined && display.cooldown !== null
                ? `${display.cooldown}턴`
                : '쿨타임 없음';
            segments.push(`소모: ${manaText} · 쿨타임 ${cooldownText}`);
        }

        if (display.level !== undefined && display.level !== null) {
            segments.push(`Lv.${display.level}`);
        }

        return segments.join(' | ') || '설명이 없습니다.';
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
