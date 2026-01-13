import { Scene } from 'phaser';
import { AuthorManager } from '../content/Authors.js';
import { createDefaultItemEngine } from '../engine/ItemEngine.js';
import { createSharedInventory } from '../engine/InventoryEngine.js';

export class Sanctuary extends Scene {
    constructor() {
        super('Sanctuary');
    }

    create() {
        this.resourceManager = this.registry.get('resourceManager');
        this.authorManager = new AuthorManager();
        this.itemEngine = createDefaultItemEngine();

        // Use existing inventory or create new one?
        // For now, let's create a global inventory or assume one is passed.
        // In a real implementation, this should persist.
        if (!this.registry.get('inventory')) {
            this.registry.set('inventory', createSharedInventory(20));
        }
        this.inventoryEngine = this.registry.get('inventory');

        // Background
        this.add.rectangle(0, 0, 1024, 768, 0x110011).setOrigin(0);
        this.add.text(512, 50, '작가의 성소 (Micro World)', { fontSize: '32px', color: '#e0b0ff', fontFamily: 'Arial' }).setOrigin(0.5);

        this.createResourceDisplay();
        this.createNavigation();
        this.createAuthorList();
        this.createInventoryView();
    }

    createResourceDisplay() {
        this.resourceText = this.add.text(50, 50, '', { fontSize: '20px', color: '#e0b0ff', fontFamily: 'Arial' });
        this.updateResourceDisplay();
        if (this.resourceManager) {
            this.resourceManager.onChange(() => this.updateResourceDisplay());
        }
    }

    updateResourceDisplay() {
        if (!this.resourceManager) return;
        const ink = this.resourceManager.getResource('ink');
        const letters = this.resourceManager.getResource('letters');
        const blood = this.resourceManager.getResource('blood');
        this.resourceText.setText(`Ink: ${ink} | Letters: ${letters} | Blood: ${blood}`);
    }

    createNavigation() {
        // To Territory
        const territoryBtn = this.add.container(900, 600);
        const tBg = this.add.rectangle(0, 0, 200, 60, 0x8B4513).setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.scene.start('Territory'));

        const tText = this.add.text(0, 0, '영지로 이동\n(Macro World)', { fontSize: '18px', color: '#ffffff', align: 'center', fontFamily: 'Arial' }).setOrigin(0.5);

        territoryBtn.add([tBg, tText]);
        this.add.existing(territoryBtn);
    }

    createAuthorList() {
        const authors = this.authorManager.getAuthors();
        let y = 150;

        authors.forEach((author) => {
            const container = this.add.container(200, y);

            const bg = this.add.rectangle(0, 0, 300, 100, 0x333333).setOrigin(0.5);
            const name = this.add.text(0, -20, author.name, { fontSize: '20px', color: '#ffcc00', fontFamily: 'Arial' }).setOrigin(0.5);
            const desc = this.add.text(0, 10, author.description, { fontSize: '14px', color: '#aaaaaa', wordWrap: { width: 280 }, fontFamily: 'Arial' }).setOrigin(0.5);

            const costText = this.add.text(0, 35, '비용: 잉크 10, 글자 5', { fontSize: '12px', color: '#888888', fontFamily: 'Arial' }).setOrigin(0.5);
            const btn = this.add.text(0, 60, '[ 집필 의뢰 ]', { fontSize: '16px', color: '#00ff00', backgroundColor: '#000', fontFamily: 'Arial' })
                .setPadding(5)
                .setInteractive({ useHandCursor: true })
                .setOrigin(0.5);

            btn.on('pointerdown', () => {
                this.requestBook(author.id);
            });

            container.add([costText]);

            container.add([bg, name, desc, btn]);
            this.add.existing(container);
            y += 120;
        });
    }

    createInventoryView() {
        this.inventoryContainer = this.add.container(600, 150);
        this.add.text(600, 100, '보유한 책', { fontSize: '24px', color: '#ffffff', fontFamily: 'Arial' }).setOrigin(0.5);
        this.refreshInventory();
    }

    refreshInventory() {
        this.inventoryContainer.removeAll(true);
        const items = this.inventoryEngine.getItems();
        let y = 0;

        items.forEach((item, index) => {
            if (!item || item.type !== 'book') return;

            const bg = this.add.rectangle(0, y, 300, 50, 0x444444).setOrigin(0.5);
            const name = this.add.text(-140, y, item.name, { fontSize: '16px', color: '#ffffff', fontFamily: 'Arial' }).setOrigin(0, 0.5);

            // Enter Button
            const enterBtn = this.add.text(100, y, '[ 입장 ]', { fontSize: '14px', color: '#00ffff', backgroundColor: '#000', fontFamily: 'Arial' })
                .setPadding(3)
                .setInteractive({ useHandCursor: true })
                .setOrigin(0.5);

            enterBtn.on('pointerdown', () => {
                this.enterBook(item);
            });

            this.inventoryContainer.add([bg, name, enterBtn]);
            y += 60;
        });
    }

    requestBook(authorId) {
        const inkCost = 10;
        const lettersCost = 5;

        if (this.resourceManager) {
            if (!this.resourceManager.hasResource('ink', inkCost) || !this.resourceManager.hasResource('letters', lettersCost)) {
                this.showFeedback('자원이 부족합니다! (잉크 10, 글자 5 필요)', '#ff0000');
                return;
            }
            this.resourceManager.removeResource('ink', inkCost);
            this.resourceManager.removeResource('letters', lettersCost);
        }

        const bookData = this.authorManager.writeBook(authorId);
        if (bookData) {
            // Create item instance
            const bookItem = this.itemEngine.createInstance('mysterious-book', {
                name: bookData.title,
                description: bookData.description,
                dungeonConfig: bookData.dungeonConfig,
                theme: bookData.theme,
                type: 'book' // Explicitly set type
            });

            this.inventoryEngine.addItem(bookItem);
            this.refreshInventory();

            this.showFeedback(`"${bookData.title}" 집필 완료!`, '#ffff00');
        }
    }

    showFeedback(message, color) {
        const feedback = this.add.text(512, 700, message, { fontSize: '20px', color: color, fontFamily: 'Arial' }).setOrigin(0.5);
        this.tweens.add({
            targets: feedback,
            alpha: 0,
            duration: 2000,
            onComplete: () => feedback.destroy()
        });
    }

    enterBook(bookItem) {
        if (!bookItem.dungeonConfig) return;

        // Transition to Game scene with config
        this.scene.start('Game', {
            dungeonConfig: bookItem.dungeonConfig,
            bookTitle: bookItem.name,
            bookTheme: bookItem.theme
        });
    }
}
