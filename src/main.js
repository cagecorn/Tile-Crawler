import StartGame from './game/main.js';
import { DomEngine } from './game/engine/DomEngine.js';
import { LogEngine } from './game/engine/LogEngine.js';

document.addEventListener('DOMContentLoaded', () => {

    const domEngine = new DomEngine('game-container');
    const { logViewport } = domEngine.bootstrap({ buttonCount: 5 });
    const logEngine = new LogEngine(logViewport);

    logEngine.log('로그 엔진이 초기화되었습니다.');
    logEngine.log('파티를 배치할 준비가 되었습니다.');

    StartGame('game-container');

});