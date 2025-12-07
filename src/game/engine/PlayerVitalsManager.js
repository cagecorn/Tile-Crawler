import { CORE_EVENT_TOPICS } from './EventEngine.js';
import { PlayerVitalsWidget } from './PlayerVitalsWidget.js';

export class PlayerVitalsManager
{
    constructor ({ container, eventEngine = null, skillManager = null, skillEngine = null } = {})
    {
        this.container = container;
        this.eventEngine = eventEngine;
        this.player = null;
        this.unsubscribers = [];

        this.widget = new PlayerVitalsWidget({
            container,
            skillManager,
            skillEngine,
            listenToEvents: false
        });

        this.bindSkillManager(skillManager, skillEngine);
        this.registerEventBridges();
    }

    bindPlayer (player)
    {
        this.player = player;
        this.widget?.bindPlayer(player);
    }

    bindSkillManager (skillManager, skillEngine = null)
    {
        this.widget?.bindSkillManager(skillManager, skillEngine);
    }

    refresh ()
    {
        this.widget?.refreshFromPlayer?.();
        this.widget?.refreshSkillSlots?.();
    }

    destroy ()
    {
        this.unsubscribers.forEach((unsubscribe) => unsubscribe?.());
        this.unsubscribers = [];
    }

    registerEventBridges ()
    {
        if (!this.eventEngine)
        {
            return;
        }

        this.unsubscribers.push(
            this.eventEngine.on(CORE_EVENT_TOPICS.UNIT_HEALTH_CHANGED, this.handleHealthChanged, this)
        );
        this.unsubscribers.push(
            this.eventEngine.on(CORE_EVENT_TOPICS.UNIT_MANA_CHANGED, this.handleManaChanged, this)
        );
        this.unsubscribers.push(
            this.eventEngine.on(CORE_EVENT_TOPICS.PLAYER_SKILL_CHANGED, this.handleSkillChanged, this)
        );
    }

    handleHealthChanged ({ unit, current, max })
    {
        if (unit !== this.player)
        {
            return;
        }
        this.widget?.updateHealth({ current, max });
    }

    handleManaChanged ({ unit, current, max })
    {
        if (unit !== this.player)
        {
            return;
        }
        this.widget?.updateMana({ current, max });
    }

    handleSkillChanged ()
    {
        this.widget?.refreshSkillSlots();
    }
}
