import { Scene } from 'phaser';
import { DungeonGenerator, TileType } from '../dungeon/DungeonGenerator.js';
import { measurementManager } from '../config/MeasurementManager.js';
import { TurnEngine } from '../engine/TurnEngine.js';
import { AnimationEngine } from '../engine/AnimationEngine.js';
import { OffscreenEngine } from '../engine/OffscreenEngine.js';
import { SpecialEffectManager } from '../engine/SpecialEffectManager.js';
import { CombatEngine } from '../engine/CombatEngine.js';
import { PathfindingEngine } from '../engine/PathfindingEngine.js';
import { VisionEngine } from '../engine/VisionEngine.js';
import { ActionOrderEngine } from '../engine/ActionOrderEngine.js';
import { CORE_EVENT_TOPICS, EventEngine } from '../engine/EventEngine.js';
import { ClassManager } from '../managers/ClassManager.js';
import { StatManager } from '../managers/StatManager.js';
import { MonsterManager } from '../managers/MonsterManager.js';
import { PlayerUnit } from '../units/Player.js';
import { MinimapEngine } from '../engine/MinimapEngine.js';
import { uiContext } from '../engine/UiContext.js';
import { PlayerStatusManager } from '../engine/PlayerStatusManager.js';
import { ParticleAnimationEngine } from '../engine/ParticleAnimationEngine.js';
import { TextAnimationEngine } from '../engine/TextAnimationEngine.js';
import { PlayerVitalsManager } from '../engine/PlayerVitalsManager.js';
import { MovementManager } from '../managers/MovementManager.js';
import { PartyEngine } from '../managers/PartyEngine.js';
import { PartyFormationManager } from '../managers/PartyFormationManager.js';
import { PartyAiManager } from '../managers/PartyAiManager.js';
import { MercenaryRosterPanel } from '../engine/MercenaryRosterPanel.js';
import { UnitStatusPanel } from '../engine/UnitStatusPanel.js';
import { createDefaultItemEngine } from '../engine/ItemEngine.js';
import { createSharedInventory } from '../engine/InventoryEngine.js';
import { createEquipmentEngine } from '../engine/EquipmentEngine.js';
import { EquipmentPanel } from '../engine/EquipmentPanel.js';
import { SkillEngine } from '../skills/SkillEngine.js';
import { registerCoreSkills } from '../skills/SkillRegistry.js';
import { PlayerSkillManager } from '../skills/PlayerSkillManager.js';
import { PlayerSkillMechanismManager } from '../skills/PlayerSkillMechanismManager.js';
import { SkillAiManager } from '../skills/SkillAiManager.js';
import { SkillBookPanel } from '../engine/SkillBookPanel.js';
import { TurnCounterEngine } from '../engine/TurnCounterEngine.js';
import { RegenManager } from '../managers/RegenManager.js';
import { runDebugRegenTest } from '../tests/DebugRegenTest.js';
import { StatusIconManager } from '../managers/StatusIconManager.js';
import { AttributeResourceEngine } from '../engine/AttributeResourceEngine.js';
import { PlayerAttributeResourceManager } from '../engine/PlayerAttributeResourceManager.js';
import { MonsterAttributeResourceManager } from '../engine/MonsterAttributeResourceManager.js';
import { AttributeResourceDomManager } from '../engine/AttributeResourceDomManager.js';
import { ShieldManager } from '../managers/ShieldManager.js';
import { AttributeDamageManager } from '../managers/AttributeDamageManager.js';
import { EnchantManager } from '../managers/EnchantManager.js';
import { createDefaultDiceEngine } from '../engine/DiceEngine.js';
import { RandomTableManager } from '../managers/RandomTableManager.js';
import { PrefixSuffixManager } from '../managers/PrefixSuffixManager.js';
import { MonsterEquipmentManager } from '../managers/MonsterEquipmentManager.js';

export class Game extends Scene
{
    constructor ()
    {
        super('Game');
    }

    create ()
    {
        const generator = new DungeonGenerator(measurementManager);
        const dungeon = generator.generate();
        const tileSize = measurementManager.getTileSize();
        const cameraConfig = measurementManager.getCameraConfig();
        this.dungeon = dungeon;
        this.tileSize = tileSize;
        this.currentFloor = 1;

        // 입력 버퍼링을 위한 변수 초기화
        this.isProcessingTurn = false;
        this.nextQueuedAction = null;

        this.eventEngine = new EventEngine({ scene: this });
        this.eventEngine.bridgePhaserEvents(this.events, [
            CORE_EVENT_TOPICS.UNIT_HEALTH_CHANGED,
            CORE_EVENT_TOPICS.UNIT_MANA_CHANGED,
            CORE_EVENT_TOPICS.UNIT_MOVED,
            CORE_EVENT_TOPICS.UNIT_DIED
        ]);
        uiContext.eventEngine = this.eventEngine;

        this.diceEngine = createDefaultDiceEngine();
        this.animationEngine = new AnimationEngine(this);
        this.particleAnimationEngine = new ParticleAnimationEngine(this);
        this.textAnimationEngine = new TextAnimationEngine(this);
        this.actionOrderEngine = new ActionOrderEngine();
        this.turnCounterEngine = new TurnCounterEngine();
        this.turnEngine = new TurnEngine(this.actionOrderEngine, this.turnCounterEngine);
        this.initializeAttributeResources();
        this.enchantManager = new EnchantManager({ attributeResourceEngine: this.attributeResourceEngine });
        this.attributeDamageManager = new AttributeDamageManager({
            attributeResourceEngine: this.attributeResourceEngine,
            playerAttributeResourceManager: this.playerAttributeResourceManager,
            monsterAttributeResourceManager: this.monsterAttributeResourceManager,
            enchantManager: this.enchantManager
        });
        this.prefixSuffixManager = new PrefixSuffixManager({
            attributeResourceEngine: this.attributeResourceEngine,
            diceEngine: this.diceEngine,
            allowedTypes: ['fire', 'water', 'wind', 'earth', 'light', 'dark']
        });
        this.randomTableManager = new RandomTableManager({ diceEngine: this.diceEngine });
        this.movementManager = new MovementManager({ turnEngine: this.turnEngine });
        this.shieldManager = new ShieldManager();
        this.offscreenEngine = new OffscreenEngine(this);
        this.specialEffectManager = new SpecialEffectManager(this, this.offscreenEngine);
        this.statusIconManager = new StatusIconManager({
            scene: this,
            turnCounterEngine: this.turnCounterEngine,
            eventEngine: this.eventEngine,
            specialEffectManager: this.specialEffectManager,
            textAnimationEngine: this.textAnimationEngine,
            logEngine: uiContext.logEngine
        });
        this.statManager = new StatManager();
        this.classManager = new ClassManager(this.statManager);
        this.regenManager = new RegenManager({
            turnCounterEngine: this.turnCounterEngine,
            specialEffectManager: this.specialEffectManager,
            unitProvider: () => Array.from(this.turnEngine?.units ?? []),
            logEngine: uiContext.logEngine
        });
        this.turnEngine.setMovementManager(this.movementManager);
        this.combatEngine = new CombatEngine({
            turnEngine: this.turnEngine,
            specialEffectManager: this.specialEffectManager,
            particleAnimationEngine: this.particleAnimationEngine,
            textAnimationEngine: this.textAnimationEngine,
            logEngine: uiContext.logEngine,
            attributeDamageManager: this.attributeDamageManager
        });
        this.turnEngine.setCombatEngine(this.combatEngine);
        this.pathfindingEngine = new PathfindingEngine(this.dungeon, this.turnEngine);
        this.visionEngine = new VisionEngine(this.dungeon);
        this.turnEngine.setVisionEngine(this.visionEngine);
        this.skillEngine = new SkillEngine({
            movementManager: this.movementManager,
            pathfindingEngine: this.pathfindingEngine,
            turnEngine: this.turnEngine,
            turnCounterEngine: this.turnCounterEngine,
            combatEngine: this.combatEngine,
            animationEngine: this.animationEngine,
            specialEffectManager: this.specialEffectManager,
            statusEffectManager: this.statusIconManager,
            logEngine: uiContext.logEngine,
            visionEngine: this.visionEngine,
            textAnimationEngine: this.textAnimationEngine,
            attributeResourceEngine: this.attributeResourceEngine,
            playerAttributeResourceManager: this.playerAttributeResourceManager,
            monsterAttributeResourceManager: this.monsterAttributeResourceManager,
            attributeDamageManager: this.attributeDamageManager
        });
        registerCoreSkills(this.skillEngine);
        this.playerSkillManager = new PlayerSkillManager({
            skillEngine: this.skillEngine,
            eventEngine: this.eventEngine
        });
        this.playerSkillMechanismManager = new PlayerSkillMechanismManager({
            skillEngine: this.skillEngine,
            playerSkillManager: this.playerSkillManager,
            monsterProvider: () => this.monsterManager?.getMonsters() ?? [],
            visionEngine: this.visionEngine,
            allyProvider: () => this.getNavigableUnits()
        });
        this.skillAiManager = new SkillAiManager({
            skillEngine: this.skillEngine,
            visionEngine: this.visionEngine,
            pathfindingEngine: this.pathfindingEngine
        });
        this.itemEngine = createDefaultItemEngine();
        this.inventoryEngine = createSharedInventory(48);
        this.equipmentEngine = createEquipmentEngine();
        this.monsterEquipmentManager = new MonsterEquipmentManager({
            itemEngine: this.itemEngine,
            equipmentEngine: this.equipmentEngine,
            enchantManager: this.enchantManager,
            prefixSuffixManager: this.prefixSuffixManager,
            diceEngine: this.diceEngine
        });
        this.configureLootTables();
        uiContext.cursorTabManager?.setEquipmentProvider?.((unit) => this.equipmentEngine?.getLoadout?.(unit) ?? null);
        this.partyFormationManager = new PartyFormationManager({
            turnEngine: this.turnEngine,
            dungeon: this.dungeon,
            tileSize: this.tileSize,
            pathfindingEngine: this.pathfindingEngine
        });
        this.partyAiManager = new PartyAiManager({
            pathfindingEngine: this.pathfindingEngine,
            visionEngine: this.visionEngine,
            turnEngine: this.turnEngine,
            formationManager: this.partyFormationManager,
            movementManager: this.movementManager
        });

        this.createMinimap();
        this.initializeStatusPanels();

        this.mapLayer = this.add.layer();
        this.renderMap();

        const worldWidth = dungeon.width * tileSize;
        const worldHeight = dungeon.height * tileSize;
        this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
        this.cameras.main.setBackgroundColor(0x000000);
        this.cameras.main.centerOn(worldWidth / 2, worldHeight / 2);
        this.cameras.main.setZoom(cameraConfig.defaultZoom);

        this.enableCameraDrag();
        this.enableCameraZoom(cameraConfig);
        this.setupPlayer();
        this.initializeVitalsWidget();
        this.playerStatusPanel?.bindPlayer(this.player);
        this.initializePartySystems();
        this.seedStarterInventory();
        this.monsterManager = new MonsterManager({
            scene: this,
            dungeon: this.dungeon,
            tileSize: this.tileSize,
            animationEngine: this.animationEngine,
            specialEffectManager: this.specialEffectManager,
            shieldManager: this.shieldManager,
            turnEngine: this.turnEngine,
            statManager: this.statManager,
            pathfindingEngine: this.pathfindingEngine,
            visionEngine: this.visionEngine,
            movementManager: this.movementManager,
            cursorTabManager: uiContext.cursorTabManager,
            skillEngine: this.skillEngine,
            monsterEquipmentManager: this.monsterEquipmentManager
        });
        this.monsterManager.spawnMonsters();
        this.events.on('unit-died', ({ unit }) => this.handleUnitDeathLoot(unit));
        if (import.meta?.env?.MODE !== 'production') {
            runDebugRegenTest({ regenManager: this.regenManager, logger: uiContext.logEngine });
        }
        this.registerInput();
        this.trackUnitsOnMinimap();
    }

    initializeAttributeResources()
    {
        this.attributeResourceEngine = new AttributeResourceEngine();
        this.playerAttributeResourceManager = new PlayerAttributeResourceManager({
            resourceEngine: this.attributeResourceEngine,
            initialBase: 0
        });
        this.monsterAttributeResourceManager = new MonsterAttributeResourceManager({
            resourceEngine: this.attributeResourceEngine,
            floorProvider: () => this.currentFloor ?? 1,
            initialBase: this.currentFloor ?? 0
        });

        if (this.turnCounterEngine) {
            this.turnCounterEngine.onTick(() => this.handleAttributeResourceTick());
        }

        if (uiContext.attributeResourceContainer) {
            this.attributeResourceDomManager = new AttributeResourceDomManager({
                container: uiContext.attributeResourceContainer,
                playerResourceManager: this.playerAttributeResourceManager,
                resourceEngine: this.attributeResourceEngine
            });
        }
    }

    handleAttributeResourceTick()
    {
        this.playerAttributeResourceManager?.decayOverchargeAll?.();
        this.monsterAttributeResourceManager?.decayOverchargeAll?.(1, this.currentFloor ?? 1);
    }

    enableCameraDrag ()
    {
        const camera = this.cameras.main;
        this.input.on('pointermove', (pointer) => {
            if (!pointer.isDown) {
                return;
            }

            camera.scrollX -= (pointer.x - pointer.prevPosition.x) / camera.zoom;
            camera.scrollY -= (pointer.y - pointer.prevPosition.y) / camera.zoom;
        });
    }

    enableCameraZoom (cameraConfig)
    {
        const camera = this.cameras.main;
        const { minZoom, maxZoom, zoomStep } = cameraConfig;

        this.input.on('wheel', (_pointer, _gameObjects, _deltaX, deltaY) => {
            const zoomDelta = deltaY > 0 ? -zoomStep : zoomStep;
            const newZoom = Math.min(maxZoom, Math.max(minZoom, camera.zoom + zoomDelta));

            if (newZoom !== camera.zoom) {
                camera.setZoom(newZoom);
            }
        });
    }

    setupPlayer()
    {
        const spawnTile = this.pickSpawnTile();
        this.player = new PlayerUnit(
            this,
            spawnTile,
            this.tileSize,
            this.animationEngine,
            this.dungeon,
            this.classManager,
            this.specialEffectManager,
            this.shieldManager,
            this.turnEngine,
            this.movementManager
        );
        this.cameras.main.startFollow(this.player.sprite, false, 0.12, 0.12);
        this.minimap?.updatePlayerPosition(spawnTile);
        this.playerSkillManager?.bindPlayer(this.player);
        this.playerSkillMechanismManager?.bindPlayer(this.player);
        this.playerSkillManager?.learnSkill('charge');
        this.playerSkillManager?.assignToSlot?.('KeyQ', 'charge');
        this.playerSkillManager?.learnSkill('heal');
        this.playerSkillManager?.assignToSlot?.('KeyW', 'heal');
        this.skillBookPanel?.refresh();
    }

    initializeStatusPanels()
    {
        this.statusManager = uiContext.statusManager ?? null;
        if (!this.statusManager) {
            return;
        }

        this.playerStatusPanel = this.statusManager.registerPanel('player', (container) => new PlayerStatusManager({
            container
        }), { mode: 'layer', title: '플레이어 스테이터스' });
        this.playerStatusPanel?.setEquipmentEngine?.(this.equipmentEngine);

        this.equipmentPanel = this.statusManager.registerPanel('equipment', (container) => new EquipmentPanel({
            container,
            inventoryEngine: this.inventoryEngine,
            equipmentEngine: this.equipmentEngine,
            itemEngine: this.itemEngine,
            unitProvider: () => this.getNavigableUnits(),
            cursorTabManager: uiContext.cursorTabManager
        }), { mode: 'layer', title: '장비 관리' });

        this.skillBookPanel = this.statusManager.registerPanel('skills', (container) => new SkillBookPanel({
            container,
            skillEngine: this.skillEngine,
            playerSkillManager: this.playerSkillManager
        }), { mode: 'layer', title: '스킬 북' });
    }

    initializePartySystems()
    {
        this.partyEngine = new PartyEngine({
            scene: this,
            player: this.player,
            dungeon: this.dungeon,
            tileSize: this.tileSize,
            animationEngine: this.animationEngine,
            specialEffectManager: this.specialEffectManager,
            shieldManager: this.shieldManager,
            turnEngine: this.turnEngine,
            movementManager: this.movementManager,
            formationManager: this.partyFormationManager,
            aiManager: this.partyAiManager,
            skillAiManager: this.skillAiManager,
            classManager: this.classManager,
            statManager: this.statManager,
            logEngine: uiContext.logEngine,
            minimap: this.minimap,
            equipmentEngine: this.equipmentEngine,
            skillEngine: this.skillEngine,
            turnEngine: this.turnEngine
        });

        this.registerPartyPanels();
        this.registerHireButton();
        this.playerStatusPanel?.setNavigator(() => this.getNavigableUnits());
        this.partyEngine?.onChange(() => {
            this.playerStatusPanel?.refreshNavigation?.();
            this.equipmentPanel?.refreshNavigation();
            this.mercenaryStatusPanel?.refreshNavigation?.();
        });
    }

    pickSpawnTile()
    {
        if (this.dungeon.rooms.length > 0) {
            const room = this.dungeon.rooms[0];
            return {
                x: Math.floor(room.x + room.width / 2),
                y: Math.floor(room.y + room.height / 2)
            };
        }

        for (let y = 0; y < this.dungeon.height; y++) {
            for (let x = 0; x < this.dungeon.width; x++) {
                if (this.dungeon.tiles[y][x] === TileType.FLOOR) {
                    return { x, y };
                }
            }
        }
        return { x: 1, y: 1 };
    }

    initializeVitalsWidget()
    {
        const container = uiContext.playerStatusContainer ?? null;
        if (!container) {
            return;
        }

        this.playerVitalsManager = new PlayerVitalsManager({
            container,
            eventEngine: this.eventEngine,
            skillManager: this.playerSkillManager,
            skillEngine: this.skillEngine
        });
        if (this.player) {
            this.playerVitalsManager.bindPlayer(this.player);
        }
    }

    registerInput()
    {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.input.keyboard.on('keydown', (event) => {
            // 중복 입력 방지 (키를 꾹 누르고 있을 때의 반복 입력은 무시하거나 처리 정책에 따름)
            if (event.repeat) {
                // 필요하다면 return; 하여 꾹 누르기 반복 입력을 막을 수 있음
            }
            
            const action = this.translateKeyToAction(event.code);
            if (!action) {
                return;
            }

            this.handlePlayerInput(action);
        });
    }

    // 입력 버퍼 처리 로직
    handlePlayerInput(action)
    {
        // 이미 턴을 처리 중이라면, 다음 동작으로 예약(Buffer)만 걸어둡니다.
        if (this.isProcessingTurn) {
            this.nextQueuedAction = action;
            return;
        }

        // 처리 중이 아니라면 즉시 실행합니다.
        this.processTurn(action);
    }

    // 실제 턴 실행 로직
    async processTurn(action)
    {
        this.isProcessingTurn = true;

        // 1. 플레이어 행동 예약
        this.turnEngine.queueAction(this.player, action);

        // 2. AI(몬스터, 파티원) 계획 수립
        this.partyEngine?.planTurn(this.player, this.monsterManager?.getMonsters() ?? []);
        this.monsterManager.planTurn(this.player);

        // 3. 턴 해결 및 애니메이션 대기 (비동기 처리)
        // turnEngine.resolveTurn이 애니메이션이 끝날 때까지 기다려준다고 가정합니다.
        await this.turnEngine.resolveTurn();

        // 4. 예약된 행동이 있는지 확인 (입력 버퍼 확인)
        if (this.nextQueuedAction) {
            const nextAction = this.nextQueuedAction;
            this.nextQueuedAction = null;
            
            // 재귀 호출로 다음 행동 즉시 실행 (스택 오버플로우 방지를 위해 약간의 텀을 줄 수도 있음)
            // 여기서는 Phaser의 delayedCall을 사용하여 안전하게 다음 프레임에 실행
            this.time.delayedCall(0, () => {
                this.processTurn(nextAction);
            });
        } else {
            // 예약된 행동이 없다면 처리 상태 해제
            this.isProcessingTurn = false;
        }
    }

    translateKeyToAction(keyCode)
    {
        const skillAction = this.playerSkillMechanismManager?.translateKeyToSkill(keyCode);
        if (skillAction) {
            return skillAction;
        }
        switch (keyCode) {
        case 'ArrowLeft':
            return { type: 'move', dx: -1, dy: 0 };
        case 'ArrowRight':
            return { type: 'move', dx: 1, dy: 0 };
        case 'ArrowUp':
            return { type: 'move', dx: 0, dy: -1 };
        case 'ArrowDown':
            return { type: 'move', dx: 0, dy: 1 };
        default:
            return null;
        }
    }

    update()
    {
        if (this.specialEffectManager) {
            this.specialEffectManager.update();
        }
        if (this.statusIconManager) {
            this.statusIconManager.update();
        }
    }

    renderMap() {
        this.mapLayer.removeAll();
        for (let y = 0; y < this.dungeon.height; y++) {
            for (let x = 0; x < this.dungeon.width; x++) {
                const tile = this.dungeon.tiles[y][x];
                let textureKey = 'wall-tile-1';
                let tint = 0xffffff;

                if (tile === TileType.FLOOR) {
                    textureKey = 'floor-tile-1';
                } else if (tile === TileType.STAIRS_DOWN) {
                    textureKey = 'floor-tile-1';
                    tint = 0x00ff00; // Green tint for stairs
                }

                const image = this.add.image(
                    x * this.tileSize + this.tileSize / 2,
                    y * this.tileSize + this.tileSize / 2,
                    textureKey
                );
                if (tint !== 0xffffff) {
                    image.setTint(tint);
                }
                this.mapLayer.add(image);
            }
        }
    }

    createMinimap()
    {
        if (!uiContext.minimapViewport) {
            return;
        }

        this.minimap = new MinimapEngine({
            container: uiContext.minimapViewport,
            dungeon: this.dungeon
        });
    }

    trackUnitsOnMinimap()
    {
        if (!this.minimap) {
            return;
        }

        this.events.on('unit-moved', ({ unit, tile }) => {
            if (unit === this.player) {
                this.minimap.updatePlayerPosition(tile);
                this.checkStairs(tile);
                return;
            }

            if (unit.faction === 'undead') {
                this.minimap.updateMonsterPosition(unit, tile);
                return;
            }

            if (unit.faction === 'allies') {
                this.minimap.updateAllyPosition(unit, tile);
            }
        });

        this.events.on('unit-died', ({ unit }) => {
            if (unit.faction === 'undead') {
                this.minimap.removeMonster(unit);
                return;
            }
            if (unit.faction === 'allies') {
                this.minimap.removeAlly(unit);
            }
        });

        this.minimap.setMonsterPositions(this.monsterManager?.getMonsters() ?? []);
        this.minimap.setAllies(this.partyEngine?.getPartyOrder?.(false) ?? []);
    }

    registerPartyPanels()
    {
        if (!this.statusManager || !this.partyEngine) {
            return;
        }

        this.mercenaryRosterPanel = this.statusManager.registerPanel('mercenaries', (container) => new MercenaryRosterPanel({
            container,
            partyEngine: this.partyEngine,
            onSelect: (unit) => this.showMercenaryStatus(unit)
        }), { mode: 'layer', title: '용병 관리' });

        this.mercenaryStatusPanel = this.statusManager.registerPanel('mercenary-status', (container) => new UnitStatusPanel({
            container,
            skillEngine: this.skillEngine,
            navigator: () => this.partyEngine?.getPartyOrder?.(false) ?? []
        }), { mode: 'layer', title: '용병 스테이터스' });
    }

    registerHireButton()
    {
        const sentinelButton = uiContext.hireSentinelButton ?? null;
        const medicButton = uiContext.hireMedicButton ?? null;
        const gunnerButton = uiContext.hireGunnerButton ?? null;
        if ((!sentinelButton && !medicButton && !gunnerButton) || !this.partyEngine) {
            return;
        }

        sentinelButton?.addEventListener('click', () => {
            this.partyEngine.hireSentinel();
            this.mercenaryRosterPanel?.refresh();
        });

        medicButton?.addEventListener('click', () => {
            this.partyEngine.hireMedic();
            this.mercenaryRosterPanel?.refresh();
        });

        gunnerButton?.addEventListener('click', () => {
            this.partyEngine.hireGunner();
            this.mercenaryRosterPanel?.refresh();
        });
    }

    showMercenaryStatus(unit)
    {
        if (!unit || !this.mercenaryStatusPanel) {
            return;
        }
        this.mercenaryStatusPanel.bindUnit(unit);
        this.mercenaryStatusPanel.refreshNavigation?.();
        this.statusManager?.show('mercenary-status');
    }

    getNavigableUnits()
    {
        const partyUnits = this.partyEngine?.getPartyOrder?.(false) ?? [];
        const uniqueUnits = new Set([this.player, ...partyUnits]);
        return Array.from(uniqueUnits).filter(Boolean);
    }

    safeAddToInventory(item, label = '획득')
    {
        if (!item) {
            return;
        }
        const index = this.inventoryEngine?.addItem?.(item) ?? -1;
        const itemName = item.name ?? item.baseName ?? '알 수 없는 장비';
        if (index === -1) {
            uiContext.logEngine?.log?.(`${label}: 인벤토리가 가득 차 ${itemName}을(를) 주울 수 없습니다.`);
            return;
        }
        uiContext.logEngine?.log?.(`${label}: ${itemName}을(를) 얻었습니다.`);
    }

    seedStarterInventory()
    {
        const dropCount = this.diceEngine?.rollRange?.(1, 2) ?? 1;
        for (let i = 0; i < dropCount; i++) {
            const item = this.randomTableManager?.roll('core-drops');
            this.safeAddToInventory(item, '[던전 발견]');
        }

        if (this.player) {
            this.equipmentEngine?.registerUnit(this.player);
        }
    }

    configureLootTables()
    {
        if (!this.randomTableManager) {
            return;
        }

        const entry = (definitionId) => ({
            weight: 1,
            create: () => this.prefixSuffixManager?.applyEnchant?.(
                this.itemEngine?.createInstance?.(definitionId),
                this.prefixSuffixManager?.pickEnchantType?.()
            )
        });

        this.randomTableManager.registerTable('core-drops', [
            entry('short-axe'),
            entry('plate-armor')
        ]);
    }

    handleUnitDeathLoot(unit)
    {
        if (unit === this.player) {
            this.handlePlayerDeath();
            return;
        }

        if (!unit || unit.faction === 'allies') {
            return;
        }
        const drop = this.monsterEquipmentManager?.createDrop?.(unit)
            ?? this.randomTableManager?.roll('core-drops');
        this.safeAddToInventory(drop, '[전리품]');
    }

    handlePlayerDeath()
    {
        uiContext.logEngine?.log?.('플레이어가 사망했습니다!');
        this.time.delayedCall(1500, () => {
            this.scene.start('GameOver');
        });
    }

    checkStairs(tile)
    {
        const tileType = this.dungeon.tiles[tile.y][tile.x];
        if (tileType === TileType.STAIRS_DOWN) {
            uiContext.logEngine?.log?.('계단을 발견했습니다! (내려가려면 스페이스바)');
        }
    }

    handlePlayerInput(action)
    {
        if (action.type === 'interact') {
            const playerTile = this.player.tilePosition;
            const tileType = this.dungeon.tiles[playerTile.y][playerTile.x];
            if (tileType === TileType.STAIRS_DOWN) {
                this.descendFloor();
                return;
            }
        }

        // 이미 턴을 처리 중이라면, 다음 동작으로 예약(Buffer)만 걸어둡니다.
        if (this.isProcessingTurn) {
            this.nextQueuedAction = action;
            return;
        }

        // 처리 중이 아니라면 즉시 실행합니다.
        this.processTurn(action);
    }

    descendFloor()
    {
        this.currentFloor++;
        uiContext.logEngine?.log?.(`지하 ${this.currentFloor}층으로 내려갑니다...`);

        // Regenerate Dungeon
        const generator = new DungeonGenerator(measurementManager);
        const dungeon = generator.generate();
        this.dungeon = dungeon;

        // Cleanup old entities
        this.mapLayer.removeAll();
        this.renderMap();

        // Reposition Player
        const spawnTile = this.pickSpawnTile();
        this.player.setPosition(spawnTile.x, spawnTile.y);

        // Reset Camera
        const worldWidth = dungeon.width * this.tileSize;
        const worldHeight = dungeon.height * this.tileSize;
        this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);

        // Update Systems
        this.pathfindingEngine.setDungeon(dungeon);
        this.visionEngine.setDungeon(dungeon);
        this.minimap.setDungeon(dungeon);
        this.minimap.updatePlayerPosition(spawnTile);

        // Respawn Monsters
        // Clear old monsters
        this.monsterManager.clearMonsters();
        this.monsterManager.setDungeon(dungeon);
        this.monsterManager.spawnMonsters(this.currentFloor);

        // Update Party
        this.partyEngine.setDungeon(dungeon);
        this.partyEngine.repositionParty(spawnTile);

        // Reset turn state
        this.isProcessingTurn = false;
        this.nextQueuedAction = null;
    }

    translateKeyToAction(keyCode)
    {
        if (keyCode === 'Space' || keyCode === 'Enter') {
            return { type: 'interact' };
        }
        const skillAction = this.playerSkillMechanismManager?.translateKeyToSkill(keyCode);
        if (skillAction) {
            return skillAction;
        }
        switch (keyCode) {
        case 'ArrowLeft':
            return { type: 'move', dx: -1, dy: 0 };
        case 'ArrowRight':
            return { type: 'move', dx: 1, dy: 0 };
        case 'ArrowUp':
            return { type: 'move', dx: 0, dy: -1 };
        case 'ArrowDown':
            return { type: 'move', dx: 0, dy: 1 };
        default:
            return null;
        }
    }
}
