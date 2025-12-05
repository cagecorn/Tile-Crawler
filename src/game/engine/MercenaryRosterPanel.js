export class MercenaryRosterPanel {
    constructor({ container, partyEngine, onSelect } = {}) {
        this.container = container;
        this.partyEngine = partyEngine;
        this.onSelect = onSelect;
        this.activeList = null;
        this.reserveList = null;

        if (this.container) {
            this.buildUi();
        }

        this.partyEngine?.onChange(() => this.refresh());
    }

    buildUi() {
        this.container.innerHTML = '';
        const card = document.createElement('div');
        card.className = 'ui-status-card ui-status-player';

        const header = document.createElement('div');
        header.className = 'ui-status-header';
        const title = document.createElement('div');
        title.className = 'ui-status-name';
        title.textContent = '용병 관리';
        header.appendChild(title);

        const activeSection = this.createSection('현역 용병 (최대 6명)');
        this.activeList = activeSection.list;
        const reserveSection = this.createSection('대기 용병 (최대 2명)');
        this.reserveList = reserveSection.list;

        card.append(header, activeSection.wrapper, reserveSection.wrapper);
        this.container.appendChild(card);

        this.refresh();
    }

    createSection(titleText) {
        const wrapper = document.createElement('div');
        wrapper.className = 'ui-status-section';

        const title = document.createElement('div');
        title.className = 'ui-status-section-title';
        title.textContent = titleText;

        const list = document.createElement('div');
        list.className = 'ui-slot-grid';

        wrapper.append(title, list);
        return { wrapper, list };
    }

    renderSlot(unit, index, total) {
        const slot = document.createElement('button');
        slot.type = 'button';
        slot.className = 'ui-slot';
        slot.textContent = '빈 공간';
        slot.disabled = !unit;

        if (unit) {
            slot.innerHTML = '';
            const portrait = document.createElement('img');
            portrait.src = unit.portrait ?? 'assets/images/unit-ui/warrior-ui.png';
            portrait.alt = unit.getName?.() ?? '용병';
            portrait.style.width = '100%';
            portrait.style.borderRadius = '8px';

            const caption = document.createElement('div');
            caption.className = 'ui-status-meta';
            const className = unit.className ?? '용병';
            caption.textContent = `${unit.getName?.() ?? className} · ${className}`;

            slot.append(portrait, caption);
            slot.addEventListener('click', () => this.onSelect?.(unit));
        } else {
            slot.title = `슬롯 ${index + 1} / ${total}`;
        }

        return slot;
    }

    populateList(listEl, members, limit) {
        listEl.innerHTML = '';
        for (let i = 0; i < limit; i++) {
            const unit = members[i] ?? null;
            listEl.appendChild(this.renderSlot(unit, i, limit));
        }
    }

    refresh() {
        if (!this.activeList || !this.reserveList) {
            return;
        }
        const roster = this.partyEngine?.getRoster?.();
        if (!roster) {
            return;
        }
        this.populateList(this.activeList, roster.active, roster.activeLimit);
        this.populateList(this.reserveList, roster.reserve, roster.reserveLimit);
    }
}
