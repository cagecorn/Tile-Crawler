import { AUTO, Game, Scale } from 'phaser';
import { Boot } from './scenes/Boot.js';
import { Game as MainGame } from './scenes/Game.js';
import { Preloader } from './scenes/Preloader.js';
import { Sanctuary } from './scenes/Sanctuary.js';

//  Find out more information about the Game Config at:
//  https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config = {
    type: AUTO,
    width: 1024,
    height: 768,
    parent: 'game-container',
    backgroundColor: '#028af8',
    scale: {
        mode: Scale.FIT,
        autoCenter: Scale.CENTER_BOTH
    },
    scene: [
        Boot,
        Preloader,
        Sanctuary,
        MainGame
    ]
};

const StartGame = (parent) => {

    return new Game({ ...config, parent });

};

export default StartGame;

