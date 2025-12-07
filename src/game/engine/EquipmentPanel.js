export class EquipmentPanel {
    constructor({ container, inventoryEngine, equipmentEngine, itemEngine, unitProvider, cursorTabManager } = {}) {
        this.container = container;
        this.inventoryEngine = inventoryEngine;
        this.equipmentEngine = equipmentEngine;
        this.itemEngine = itemEngine;
        this.unitProvider = unitProvider;
        this.cursorTabManager = cursorTabManager;

        this.activeUnit = null;
        this.inventoryGrid = null;
        this.equipmentSlots = [];
        this.navLabel = null;

        if (this.container) {
            this.buildUi();
        }

        this.inventoryEngine?.onChange(() => this.refreshInventory());
    }

    buildUi() {
        this.container.innerHTML = '';
        const wrapper = document.createElement('div');
        wrapper.className = 'ui-equipment-wrapper';

        const left = document.createElement('div');
        left.className = 'ui-equipment-column';
        const right = document.createElement('div');
        right.className = 'ui-equipment-column';

        left.appendChild(this.buildUnitPanel());
        right.appendChild(this.buildInventoryPanel());

        wrapper.append(left, right);
        this.container.appendChild(wrapper);
        this.refreshNavigation();
    }

    buildUnitPanel() {
        const card = document.createElement('div');
        card.className = 'ui-status-card ui-status-player';

        const header = document.createElement('div');
        header.className = 'ui-status-header ui-equipment-header';

        const leftBtn = document.createElement('button');
        leftBtn.type = 'button';
        leftBtn.className = 'ui-cycle-button';
        leftBtn.textContent = '←';
        leftBtn.addEventListener('click', () => this.navigate(-1));

        const rightBtn = document.createElement('button');
        rightBtn.type = 'button';
        rightBtn.className = 'ui-cycle-button';
        rightBtn.textContent = '→';
        rightBtn.addEventListener('click', () => this.navigate(1));

        this.navLabel = document.createElement('div');
        this.navLabel.className = 'ui-status-name';
        this.navLabel.textContent = '장비 대상 없음';

        header.append(leftBtn, this.navLabel, rightBtn);

        const equipmentSection = document.createElement('div');
        equipmentSection.className = 'ui-status-section';
        const equipTitle = document.createElement('div');
        equipTitle.className = 'ui-status-section-title';
        equipTitle.textContent = '장비';
        const grid = document.createElement('div');
        grid.className = 'ui-slot-grid ui-equipment-grid';
        this.equipmentSlots = this.equipmentEngine?.slots.map((slotKey) => this.createEquipmentSlot(slotKey)) ?? [];
        this.equipmentSlots.forEach((slot) => grid.appendChild(slot));

        const statList = document.createElement('div');
        statList.className = 'ui-status-section';
        const statTitle = document.createElement('div');
        statTitle.className = 'ui-status-section-title';
        statTitle.textContent = '주요 스탯';
        this.statGrid = document.createElement('div');
        this.statGrid.className = 'ui-stat-grid';
        const fields = [
            ['attack', '물리 공격력'],
            ['defense', '물리 방어력'],
            ['magicAttack', '마법 공격력'],
            ['magicDefense', '마법 방어력'],
            ['movePoints', '이동력'],
            ['sightRange', '시야'],
            ['critChance', '치명타율'],
            ['actionSpeed', '행동 속도']
        ];
        this.statLabels = {};
        fields.forEach(([key, label]) => {
            const row = document.createElement('div');
            row.className = 'ui-stat-item';
            const labelEl = document.createElement('div');
            labelEl.className = 'ui-stat-label';
            labelEl.textContent = label;
            const valueEl = document.createElement('div');
            valueEl.className = 'ui-stat-value';
            valueEl.textContent = '-';
            this.statLabels[key] = valueEl;
            row.append(labelEl, valueEl);
            this.statGrid.appendChild(row);
        });

        equipmentSection.append(equipTitle, grid);
        statList.append(statTitle, this.statGrid);
        card.append(header, equipmentSection, statList);
        return card;
    }

    buildInventoryPanel() {
        const card = document.createElement('div');
        card.className = 'ui-status-card ui-status-player';

        const title = document.createElement('div');
        title.className = 'ui-status-section-title';
        title.textContent = '공용 인벤토리';

        this.inventoryGrid = document.createElement('div');
        this.inventoryGrid.className = 'ui-inventory-grid';
        this.refreshInventory();

        card.append(title, this.inventoryGrid);
        return card;
    }

    createEquipmentSlot(slotKey) {
        const slot = document.createElement('div');
        slot.className = 'ui-slot ui-equip-slot';
        slot.dataset.slot = slotKey;
        slot.textContent = slotKey;
        slot.addEventListener('dragover', (event) => event.preventDefault());
        slot.addEventListener('drop', (event) => this.handleDrop(event));
        return slot;
    }

    createInventorySlot(index, item) {
        const slot = document.createElement('div');
        slot.className = 'ui-slot ui-inventory-slot';
        slot.dataset.index = index;
        slot.addEventListener('dragover', (event) => event.preventDefault());
        slot.addEventListener('drop', (event) => this.handleDrop(event));

        if (item) {
            slot.classList.add('is-filled');
            slot.draggable = true;
            slot.addEventListener('dragstart', (event) => this.beginDrag(event, { type: 'inventory', index }));
            slot.appendChild(this.renderItem(item));
        }

        return slot;
    }

    renderItem(item) {
        const wrapper = document.createElement('div');
        wrapper.className = 'ui-item-chip';
        if (item.icon) {
            const icon = document.createElement('img');
            icon.src = item.icon;
            icon.alt = item.name;
            wrapper.appendChild(icon);
        }
        const label = document.createElement('span');
        label.textContent = item.name;
        wrapper.title = item.description ?? '상세 보기';
        wrapper.appendChild(label);
        wrapper.draggable = true;
        wrapper.addEventListener('dragstart', (event) => this.beginDrag(event, { type: 'item', item }));
        this.cursorTabManager?.attachItemHover(wrapper, item);
        return wrapper;
    }

    beginDrag(event, payload) {
        event.dataTransfer.setData('application/json', JSON.stringify(payload));
    }

    handleDrop(event) {
        event.preventDefault();
        const data = event.dataTransfer.getData('application/json');
        if (!data) {
            return;
        }
        const payload = JSON.parse(data);
        const equipSlot = event.currentTarget.dataset.slot;
        const inventoryIndex = event.currentTarget.dataset.index;

        if (payload.type === 'inventory' && equipSlot) {
            this.moveInventoryToEquipment(payload.index, equipSlot);
        } else if (payload.type === 'item' && equipSlot) {
            this.equipItem(payload.item, equipSlot);
        } else if (payload.type === 'item' && inventoryIndex !== undefined) {
            this.placeItemInInventory(payload.item, Number(inventoryIndex));
        } else if (payload.type === 'inventory' && inventoryIndex !== undefined) {
            this.inventoryEngine?.moveItem(payload.index, Number(inventoryIndex));
        } else if (payload.type === 'equipment' && inventoryIndex !== undefined) {
            this.unequipToInventory(payload.slot, Number(inventoryIndex));
        }
    }

    moveInventoryToEquipment(index, slot) {
        const item = this.inventoryEngine?.getItem(index);
        if (!item || !this.activeUnit) {
            return;
        }
        const { swapped } = this.equipmentEngine?.equip(this.activeUnit, item, slot) ?? {};
        this.inventoryEngine?.removeItem(index);
        if (swapped) {
            this.inventoryEngine?.addItem(swapped);
        }
        this.refreshUnit();
    }

    equipItem(item, slot) {
        if (!item || !this.activeUnit) {
            return;
        }
        const { swapped } = this.equipmentEngine?.equip(this.activeUnit, item, slot) ?? {};
        if (swapped) {
            this.inventoryEngine?.addItem(swapped);
        }
        this.refreshUnit();
    }

    unequipToInventory(slot, targetIndex) {
        if (!this.activeUnit) {
            return;
        }
        const removed = this.equipmentEngine?.unequip(this.activeUnit, slot);
        if (!removed) {
            return;
        }
        const displaced = this.inventoryEngine?.placeItem(targetIndex, removed);
        if (displaced === null) {
            this.inventoryEngine?.addItem(removed);
        } else if (displaced) {
            this.inventoryEngine?.addItem(displaced);
        }
        this.refreshUnit();
    }

    placeItemInInventory(item, index) {
        if (!this.inventoryEngine?.isValidIndex?.(index)) {
            return;
        }
        const displaced = this.inventoryEngine.placeItem(index, item);
        if (displaced) {
            this.inventoryEngine.addItem(displaced);
        }
    }

    bindUnit(unit) {
        this.activeUnit = unit;
        this.refreshUnit();
    }

    refreshUnit() {
        if (!this.activeUnit) {
            return;
        }
        const stats = this.activeUnit.stats ?? {};
        if (this.navLabel) {
            this.navLabel.textContent = `${this.activeUnit.getName?.() ?? '동료'} 장비`; 
        }

        Object.entries(this.statLabels ?? {}).forEach(([key, el]) => {
            if (!el) {
                return;
            }
            const value = stats[key] ?? 0;
            el.textContent = typeof value === 'number' ? value : value ?? '-';
        });

        const loadout = this.equipmentEngine?.getLoadout(this.activeUnit) ?? {};
        this.equipmentSlots.forEach((slot) => {
            const slotKey = slot.dataset.slot;
            const item = loadout[slotKey] ?? null;
            slot.innerHTML = '';
            slot.classList.toggle('is-filled', Boolean(item));
            slot.draggable = Boolean(item);
            if (item) {
                const chip = this.renderItem(item);
                chip.addEventListener('dragstart', (event) => this.beginDrag(event, { type: 'equipment', slot: slotKey }));
                slot.appendChild(chip);
            } else {
                slot.textContent = slotKey;
            }
        });
    }

    refreshInventory() {
        if (!this.inventoryGrid) {
            return;
        }
        this.inventoryGrid.innerHTML = '';
        const slots = this.inventoryEngine?.slots ?? [];
        slots.forEach((item, index) => {
            this.inventoryGrid.appendChild(this.createInventorySlot(index, item));
        });
    }

    refreshNavigation() {
        const units = this.unitProvider?.() ?? [];
        if (!this.activeUnit && units.length > 0) {
            this.bindUnit(units[0]);
        } else if (this.activeUnit && units.includes(this.activeUnit)) {
            this.refreshUnit();
        }
    }

    navigate(delta) {
        const units = this.unitProvider?.() ?? [];
        if (units.length === 0 || !this.activeUnit) {
            return;
        }
        const index = units.indexOf(this.activeUnit);
        const next = (index + delta + units.length) % units.length;
        this.bindUnit(units[next]);
    }
}
