export class DiceEngine
{
    constructor({ rng = Math.random } = {})
    {
        this.rng = typeof rng === 'function' ? rng : Math.random;
    }

    rollDie(sides = 6)
    {
        const normalized = Math.max(1, Math.floor(sides));
        return this.rollRange(1, normalized);
    }

    rollRange(min = 1, max = 1)
    {
        const low = Math.min(min, max);
        const high = Math.max(min, max);
        const span = high - low + 1;
        return low + Math.floor(this.rng() * span);
    }

    pickOne(entries = [])
    {
        if (!Array.isArray(entries) || entries.length === 0) {
            return null;
        }
        const index = this.rollRange(0, entries.length - 1);
        return entries[index];
    }

    pickWeighted(entries = [])
    {
        if (!Array.isArray(entries) || entries.length === 0) {
            return null;
        }
        const totalWeight = entries.reduce((sum, entry) => sum + Math.max(0, entry?.weight ?? 1), 0);
        if (totalWeight <= 0) {
            return this.pickOne(entries);
        }
        let roll = this.rng() * totalWeight;
        for (const entry of entries) {
            roll -= Math.max(0, entry?.weight ?? 1);
            if (roll <= 0) {
                return entry;
            }
        }
        return entries[entries.length - 1];
    }
}

export function createDefaultDiceEngine()
{
    return new DiceEngine();
}
