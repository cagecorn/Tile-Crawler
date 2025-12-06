import StartGame from './game/main.js';
import { DomEngine } from './game/engine/DomEngine.js';
import { LayerManager } from './game/engine/LayerManager.js';
import { LogEngine } from './game/engine/LogEngine.js';
import { uiContext } from './game/engine/UiContext.js';
import { StatusManager } from './game/engine/StatusManager.js';

document.addEventListener('DOMContentLoaded', () => {
    const domEngine = new DomEngine('game-container');
    const { logViewport, minimapViewport, playerStatusContainer, topButtons, layerRoot, hireButtons } = domEngine.bootstrap({ buttonCount: 5 });

    const layerManager = new LayerManager({ root: layerRoot });
    const statusManager = new StatusManager({ layerManager });

    uiContext.minimapViewport = minimapViewport;
    uiContext.playerStatusContainer = playerStatusContainer;
    uiContext.layerManager = layerManager;
    uiContext.statusManager = statusManager;
    uiContext.hireSentinelButton = hireButtons?.sentinelButton;
    uiContext.hireMedicButton = hireButtons?.medicButton;

    const logEngine = new LogEngine(logViewport);

    uiContext.logEngine = logEngine;

    logEngine.log('로그 엔진이 초기화되었습니다.');
    logEngine.log('파티를 배치할 준비가 되었습니다.');

    const playerButton = topButtons?.[0];
    if (playerButton) {
        playerButton.textContent = '[플레이어]';
        playerButton.title = '플레이어 스테이터스 보기';
        playerButton.setAttribute('aria-label', '플레이어 스테이터스 보기');
        playerButton.addEventListener('click', () => {
            statusManager.show('player');
            highlightTopButton(playerButton, topButtons);
        });
    }

    const skillButton = topButtons?.[1];
    if (skillButton) {
        skillButton.textContent = '[스킬]';
        skillButton.title = '스킬 북 열기';
        skillButton.setAttribute('aria-label', '스킬 북 열기');
        skillButton.addEventListener('click', () => {
            statusManager.show('skills');
            highlightTopButton(skillButton, topButtons);
        });
    }

    const mercenaryButton = topButtons?.[2];
    if (mercenaryButton) {
        mercenaryButton.textContent = '[용병]';
        mercenaryButton.title = '용병 목록 열기';
        mercenaryButton.setAttribute('aria-label', '용병 목록 열기');
        mercenaryButton.addEventListener('click', () => {
            statusManager.show('mercenaries');
            highlightTopButton(mercenaryButton, topButtons);
        });
    }

    const equipmentButton = topButtons?.[3];
    if (equipmentButton) {
        equipmentButton.textContent = '[장비]';
        equipmentButton.title = '장비 관리 창 열기';
        equipmentButton.setAttribute('aria-label', '장비 관리 창 열기');
        equipmentButton.addEventListener('click', () => {
            statusManager.show('equipment');
            highlightTopButton(equipmentButton, topButtons);
        });
    }

    StartGame('game-container');
});

function highlightTopButton(activeButton, buttons = []) {
    buttons.forEach((button) => {
        button.classList.toggle('is-active', button === activeButton);
    });
}
