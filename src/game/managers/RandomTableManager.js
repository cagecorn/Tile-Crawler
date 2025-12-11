export class RandomTableManager
{
    constructor({ diceEngine = null } = {})
    {
        this.diceEngine = diceEngine;
        this.tables = new Map();
    }

    registerTable(name, entries = [])
    {
        if (!name) {
            return;
        }
        this.tables.set(name, Array.isArray(entries) ? entries.slice() : []);
    }

    addEntry(tableName, entry)
    {
        if (!tableName || !entry) {
            return;
        }
        const table = this.tables.get(tableName) ?? [];
        table.push(entry);
        this.tables.set(tableName, table);
    }

    roll(tableName)
    {
        const entries = this.tables.get(tableName) ?? [];
        if (!entries.length) {
            return null;
        }
        const selection = this.diceEngine?.pickWeighted?.(entries) ?? entries[0];
        if (!selection) {
            return null;
        }
        if (typeof selection.create === 'function') {
            return selection.create();
        }
        return selection.value ?? selection;
    }
}
