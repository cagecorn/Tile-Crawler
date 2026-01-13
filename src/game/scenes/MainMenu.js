import { Scene } from 'phaser';
import { createSharedInventory } from '../engine/InventoryEngine.js';
import { createResourceManager } from '../managers/ResourceManager.js';

export class MainMenu extends Scene
{
    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        // Initialize Global State (Inventory & Resources)
        if (!this.registry.get('inventory')) {
            this.registry.set('inventory', createSharedInventory(36));
        }
        if (!this.registry.get('resourceManager')) {
            this.registry.set('resourceManager', createResourceManager());
        }

        this.add.image(512, 384, 'background');

        this.add.image(512, 300, 'logo');

        this.add.text(512, 460, 'Main Menu', {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5);

        this.add.text(512, 520, 'Click to Start', {
            fontFamily: 'Arial', fontSize: 24, color: '#aaaaaa',
            align: 'center'
        }).setOrigin(0.5);

        this.input.once('pointerdown', () => {

            this.scene.start('Territory');

        });
    }
}
