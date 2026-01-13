import { Scene } from 'phaser';
import { AuthorManager } from '../content/Authors.js';
import { createDefaultItemEngine } from '../engine/ItemEngine.js';
import { createSharedInventory } from '../engine/InventoryEngine.js';

export class Sanctuary extends Scene {
    constructor() {
        super('Sanctuary');
    }

    create() {
        this.authorManager = new AuthorManager();
        this.itemEngine = createDefaultItemEngine();

        // Use existing inventory or create new one?
        // For now, let's create a global inventory or assume one is passed.
        // In a real implementation, this should persist.
        if (!this.registry.get('inventory')) {
            this.registry.set('inventory', createSharedInventory(20));
        }
        this.inventoryEngine = this.registry.get('inventory');

        this.add.text(400, 50, '작가의 성소', { fontSize: '32px', color: '#ffffff', fontFamily: 'Arial' }).setOrigin(0.5);

        this.createAuthorList();
        this.createInventoryView();

    }

    createAuthorList() {
        const authors = this.authorManager.getAuthors();
        let y = 150;

        authors.forEach((author) => {
            const container = this.add.container(200, y);

            const bg = this.add.rectangle(0, 0, 300, 100, 0x333333).setOrigin(0.5);
            const name = this.add.text(0, -20, author.name, { fontSize: '20px', color: '#ffcc00', fontFamily: 'Arial' }).setOrigin(0.5);
            const desc = this.add.text(0, 10, author.description, { fontSize: '14px', color: '#aaaaaa', wordWrap: { width: 280 }, fontFamily: 'Arial' }).setOrigin(0.5);

            const btn = this.add.text(0, 35, '[ 집필 의뢰 ]', { fontSize: '16px', color: '#00ff00', backgroundColor: '#000', fontFamily: 'Arial' })
                .setPadding(5)
                .setInteractive({ useHandCursor: true })
                .setOrigin(0.5);

            btn.on('pointerdown', () => {
                this.requestBook(author.id);
            });

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
        const bookData = this.authorManager.writeBook(authorId);
        if (bookData) {
            // Create item instance
            const bookItem = this.itemEngine.createInstance('mysterious-book', {
                name: bookData.title,
                description: bookData.description,
                dungeonConfig: bookData.dungeonConfig,
                theme: bookData.theme
            });

            this.inventoryEngine.addItem(bookItem);
            this.refreshInventory();

            // Simple feedback
            const feedback = this.add.text(400, 550, `"${bookData.title}" 집필 완료!`, { fontSize: '20px', color: '#ffff00', fontFamily: 'Arial' }).setOrigin(0.5);
            this.tweens.add({
                targets: feedback,
                alpha: 0,
                duration: 2000,
                onComplete: () => feedback.destroy()
            });
        }
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
