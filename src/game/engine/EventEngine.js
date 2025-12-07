import { Events } from 'phaser';

export const CORE_EVENT_TOPICS = {
    UNIT_HEALTH_CHANGED: 'unit-health-changed',
    UNIT_MANA_CHANGED: 'unit-mana-changed',
    UNIT_MOVED: 'unit-moved',
    UNIT_DIED: 'unit-died',
    PLAYER_SKILL_CHANGED: 'player-skill-changed'
};

export class EventEngine
{
    constructor ({ scene = null } = {})
    {
        this.emitter = new Events.EventEmitter();
        this.bridges = [];
        this.scene = scene;
    }

    emit (eventName, payload)
    {
        this.emitter.emit(eventName, payload);
    }

    on (eventName, handler, context)
    {
        this.emitter.on(eventName, handler, context);
        return () => this.off(eventName, handler, context);
    }

    once (eventName, handler, context)
    {
        this.emitter.once(eventName, handler, context);
        return () => this.off(eventName, handler, context);
    }

    off (eventName, handler, context)
    {
        this.emitter.off(eventName, handler, context);
    }

    bridgePhaserEvents (phaserEvents, eventNames = [])
    {
        if (!phaserEvents || !Array.isArray(eventNames))
        {
            return;
        }

        eventNames.forEach((eventName) =>
        {
            const forwarder = (payload) => this.emit(eventName, payload);
            phaserEvents.on(eventName, forwarder);
            this.bridges.push({ phaserEvents, eventName, forwarder });
        });
    }

    destroy ()
    {
        this.bridges.forEach(({ phaserEvents, eventName, forwarder }) =>
        {
            phaserEvents?.off(eventName, forwarder);
        });
        this.bridges = [];
        this.emitter.removeAllListeners();
    }
}
