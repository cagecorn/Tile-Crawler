import { Scene } from 'phaser';

export class Territory extends Scene {
    constructor() {
        super('Territory');
    }

    create() {
        // Initialize managers if not present (handled in MainMenu usually, but safety check)
        if (!this.registry.get('resourceManager')) {
            // This should ideally be handled in MainMenu, but for robustness:
            // console.warn('ResourceManager missing in Registry');
        }

        this.resourceManager = this.registry.get('resourceManager');
        this.inventoryEngine = this.registry.get('inventory');

        // Background
        this.add.rectangle(0, 0, 1024, 768, 0x222222).setOrigin(0);
        this.add.text(512, 50, '영지 (Macro World)', { fontSize: '32px', color: '#ffffff', fontFamily: 'Arial' }).setOrigin(0.5);

        // Resource Display (Gold only)
        this.createResourceDisplay();

        // Inventory Display (Weapons/Armor - filtering out books)
        this.createInventoryView();

        // Navigation Buttons
        this.createNavigation();
    }

    createResourceDisplay() {
        this.resourceText = this.add.text(50, 50, '', { fontSize: '20px', color: '#ffd700', fontFamily: 'Arial' });

        // Initial update
        this.updateResourceDisplay();

        // Listen for changes
        if (this.resourceManager) {
            this.resourceManager.onChange(() => this.updateResourceDisplay());
        }
    }

    updateResourceDisplay() {
        if (!this.resourceManager) return;
        const gold = this.resourceManager.getResource('gold');
        this.resourceText.setText(`Gold: ${gold}`);
    }

    createInventoryView() {
        this.inventoryContainer = this.add.container(100, 150);
        this.add.text(100, 120, '창고 (장비/물품)', { fontSize: '24px', color: '#ffffff', fontFamily: 'Arial' }).setOrigin(0, 0.5);

        // Listen for inventory changes
        if (this.inventoryEngine) {
            this.inventoryEngine.onChange(() => this.refreshInventory());
        }
        this.refreshInventory();
    }

    refreshInventory() {
        this.inventoryContainer.removeAll(true);
        if (!this.inventoryEngine) return;

        const items = this.inventoryEngine.getItems();
        let y = 0;
        let count = 0;

        items.forEach((item, index) => {
            // Territory shows everything EXCEPT books (Sanctuary domain)
            // Or maybe it shows everything? User said "Weapons, Armor...".
            // Let's filter OUT books to make the distinction clear.
            if (item && item.type === 'book') return;
            if (!item) return; // Skip empty slots for simple list view

            const bg = this.add.rectangle(0, y, 300, 40, 0x444444).setOrigin(0, 0.5);
            const name = this.add.text(10, y, item.name, { fontSize: '16px', color: '#ffffff', fontFamily: 'Arial' }).setOrigin(0, 0.5);

            this.inventoryContainer.add([bg, name]);
            y += 50;
            count++;
        });

        if (count === 0) {
            const noItems = this.add.text(0, 0, '(아이템 없음)', { fontSize: '14px', color: '#aaaaaa', fontFamily: 'Arial' });
            this.inventoryContainer.add(noItems);
        }
    }

    createNavigation() {
        // To Sanctuary
        const sanctuaryBtn = this.add.container(800, 600);
        const sBg = this.add.rectangle(0, 0, 200, 60, 0x4a0072).setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.scene.start('Sanctuary'));

        const sText = this.add.text(0, 0, '성소로 이동\n(Micro World)', { fontSize: '18px', color: '#ffffff', align: 'center', fontFamily: 'Arial' }).setOrigin(0.5);

        sanctuaryBtn.add([sBg, sText]);
        this.add.existing(sanctuaryBtn);
    }
}
