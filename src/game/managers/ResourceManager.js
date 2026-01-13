export class ResourceManager {
    constructor(initialResources = {}) {
        this.resources = {
            gold: initialResources.gold || 0,
            ink: initialResources.ink || 0,
            letters: initialResources.letters || 0,
            blood: initialResources.blood || 0
        };
        this.listeners = new Set();
    }

    getResource(type) {
        return this.resources[type] || 0;
    }

    addResource(type, amount) {
        if (!this.resources.hasOwnProperty(type)) {
            this.resources[type] = 0;
        }
        this.resources[type] += amount;
        this.notify();
    }

    removeResource(type, amount) {
        if (!this.resources.hasOwnProperty(type) || this.resources[type] < amount) {
            return false;
        }
        this.resources[type] -= amount;
        this.notify();
        return true;
    }

    hasResource(type, amount) {
        return (this.resources[type] || 0) >= amount;
    }

    onChange(listener) {
        if (listener) {
            this.listeners.add(listener);
        }
    }

    notify() {
        this.listeners.forEach(listener => listener(this.resources));
    }
}

export function createResourceManager() {
    return new ResourceManager({
        gold: 1000,
        ink: 100,
        letters: 50,
        blood: 10
    });
}
