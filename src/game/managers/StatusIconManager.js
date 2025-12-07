import { CORE_EVENT_TOPICS } from '../engine/EventEngine.js';

const DEFAULT_ICON_SIZE = 18;
const ICON_GAP = 4;

export class StatusIconManager {
    constructor({ scene = null, turnCounterEngine = null, eventEngine = null, specialEffectManager = null, textAnimationEngine = null, logEngine = null } = {}) {
        this.scene = scene;
        this.turnCounterEngine = turnCounterEngine;
        this.eventEngine = eventEngine;
        this.specialEffectManager = specialEffectManager;
        this.textAnimationEngine = textAnimationEngine;
        this.logEngine = logEngine;
        this.statuses = new Map();

        this.handleTick = this.handleTick.bind(this);
        this.handleUnitDeath = this.handleUnitDeath.bind(this);

        this.turnCounterEngine?.onTick?.(this.handleTick);
        this.eventEngine?.on?.(CORE_EVENT_TOPICS.UNIT_DIED, this.handleUnitDeath);
    }

    applyStatus({ unit, id, name, icon, type = 'buff', duration = 1, modifiers = null, data = null, onTick = null }) {
        if (!unit || !id || !this.scene) {
            return null;
        }

        const entry = this.ensureEntry(unit);
        const existing = entry.statusMap.get(id) ?? {};
        const remaining = Math.max(duration, existing.remaining ?? 0);

        if (existing.iconSprite) {
            existing.iconSprite.setTexture(icon ?? existing.icon ?? '');
        }

        const status = {
            id,
            name,
            icon,
            type,
            duration,
            remaining,
            modifiers,
            data: data ?? existing.data ?? null,
            onTick
        };

        if (!existing.iconSprite) {
            status.iconSprite = this.createIconSprite(unit, status);
            this.assignIconToRow(entry, status);
        } else {
            status.iconSprite = existing.iconSprite;
        }

        entry.statusMap.set(id, status);
        this.recalculateModifiers(unit, entry);
        this.layoutIcons(unit, entry);
        return status;
    }

    removeStatus(unit, id) {
        const entry = this.statuses.get(unit);
        if (!entry) {
            return;
        }
        const status = entry.statusMap.get(id);
        if (!status) {
            return;
        }

        this.destroyIcon(entry, status);
        entry.statusMap.delete(id);
        this.recalculateModifiers(unit, entry);
        this.layoutIcons(unit, entry);
    }

    destroyIcon(entry, status) {
        const { iconSprite } = status;
        if (iconSprite) {
            const row = status.type === 'buff' || status.type === 'aura' ? entry.headRow : entry.footRow;
            row.icons = row.icons.filter((sprite) => sprite !== iconSprite);
            iconSprite.destroy();
        }
    }

    handleTick(payload = {}) {
        const isTickPayload = Object.prototype.hasOwnProperty.call(payload, 'units');
        if (!isTickPayload) {
            return;
        }

        const aliveUnits = payload.units ?? [];
        for (const unit of aliveUnits) {
            const entry = this.statuses.get(unit);
            if (!entry) {
                continue;
            }

            const expired = [];
            for (const status of entry.statusMap.values()) {
                status.remaining -= 1;
                if (typeof status.onTick === 'function') {
                    status.onTick({ unit, data: status.data, manager: this });
                }
                if (status.remaining <= 0) {
                    expired.push(status.id);
                }
            }

            expired.forEach((id) => this.removeStatus(unit, id));
        }
    }

    handleUnitDeath({ unit } = {}) {
        if (!unit) {
            return;
        }
        const entry = this.statuses.get(unit);
        if (!entry) {
            return;
        }

        entry.statusMap.forEach((status) => this.destroyIcon(entry, status));
        this.statuses.delete(unit);
    }

    ensureEntry(unit) {
        if (!this.statuses.has(unit)) {
            this.statuses.set(unit, {
                statusMap: new Map(),
                headRow: { icons: [] },
                footRow: { icons: [] }
            });
        }
        return this.statuses.get(unit);
    }

    createIconSprite(unit, status) {
        const sprite = this.scene.add.image(unit.sprite.x, unit.sprite.y, status.icon ?? '');
        sprite.setDisplaySize(DEFAULT_ICON_SIZE, DEFAULT_ICON_SIZE);
        sprite.setDepth((unit.sprite.depth ?? 10) + (status.type === 'buff' || status.type === 'aura' ? 2 : -1));
        return sprite;
    }

    assignIconToRow(entry, status) {
        const row = status.type === 'buff' || status.type === 'aura' ? entry.headRow : entry.footRow;
        row.icons.push(status.iconSprite);
    }

    recalculateModifiers(unit, entry) {
        if (!unit) {
            return;
        }
        const modifiers = {};
        entry.statusMap.forEach((status) => {
            if (!status.modifiers) {
                return;
            }
            Object.entries(status.modifiers).forEach(([key, value]) => {
                if (typeof value === 'number') {
                    modifiers[key] = (modifiers[key] ?? 0) + value;
                }
            });
        });

        unit.applyStatModifiers(modifiers);
    }

    layoutIcons(unit, entry) {
        const headOffsetY = unit.sprite.y - unit.sprite.displayHeight / 2 - DEFAULT_ICON_SIZE * 0.75;
        const footOffsetY = unit.sprite.y + unit.sprite.displayHeight / 2 + DEFAULT_ICON_SIZE * 0.5;
        this.layoutRow(entry.headRow.icons, unit.sprite.x, headOffsetY, unit.sprite.depth + 3);
        this.layoutRow(entry.footRow.icons, unit.sprite.x, footOffsetY, unit.sprite.depth - 1);
    }

    layoutRow(icons, centerX, y, depth) {
        if (!icons.length) {
            return;
        }
        const totalWidth = icons.length * DEFAULT_ICON_SIZE + (icons.length - 1) * ICON_GAP;
        const startX = centerX - totalWidth / 2 + DEFAULT_ICON_SIZE / 2;

        icons.forEach((icon, index) => {
            const x = startX + index * (DEFAULT_ICON_SIZE + ICON_GAP);
            icon.setPosition(x, y);
            icon.setDepth(depth);
        });
    }

    update() {
        this.statuses.forEach((entry, unit) => {
            this.layoutIcons(unit, entry);
        });
    }
}
