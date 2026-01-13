export class InventoryEngine {
    constructor({ size = 24 } = {}) {
        this.size = size;
        this.slots = Array.from({ length: size }).map(() => null);
        this.listeners = new Set();
    }

    addItem(item) {
        const index = this.slots.findIndex((slot) => slot === null);
        if (index === -1) {
            return -1;
        }
        this.slots[index] = item;
        this.notify();
        return index;
    }

    moveItem(fromIndex, toIndex) {
        if (!this.isValidIndex(fromIndex) || !this.isValidIndex(toIndex)) {
            return false;
        }
        const source = this.slots[fromIndex];
        const target = this.slots[toIndex];
        this.slots[toIndex] = source;
        this.slots[fromIndex] = target;
        this.notify();
        return true;
    }

    placeItem(index, item) {
        if (!this.isValidIndex(index)) {
            return null;
        }
        const displaced = this.slots[index];
        this.slots[index] = item;
        this.notify();
        return displaced;
    }

    removeItem(index) {
        if (!this.isValidIndex(index)) {
            return null;
        }
        const item = this.slots[index];
        this.slots[index] = null;
        this.notify();
        return item;
    }

    getItem(index) {
        if (!this.isValidIndex(index)) {
            return null;
        }
        return this.slots[index];
    }

    getItems() {
        return this.slots;
    }

    onChange(listener) {
        if (listener) {
            this.listeners.add(listener);
        }
    }

    notify() {
        this.listeners.forEach((listener) => listener?.(this.slots));
    }

    isValidIndex(index) {
        return index >= 0 && index < this.size;
    }
}

export function createSharedInventory(size = 36) {
    return new InventoryEngine({ size });
}
