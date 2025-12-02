class OffscreenLayer {
    constructor(scene, renderTexture, scaleFactor, baseWidth, baseHeight) {
        this.scene = scene;
        this.renderTexture = renderTexture;
        this.scaleFactor = scaleFactor;
        this.baseWidth = baseWidth;
        this.baseHeight = baseHeight;
    }

    draw(drawCallback) {
        const graphics = this.scene.make.graphics({ x: 0, y: 0, add: false });
        graphics.clear();
        drawCallback(graphics, this.scaleFactor, this.baseWidth, this.baseHeight);
        this.renderTexture.clear();
        this.renderTexture.draw(graphics);
        graphics.destroy();
    }

    setPosition(x, y) {
        this.renderTexture.setPosition(x, y);
    }

    setDepth(depth) {
        this.renderTexture.setDepth(depth);
    }
}

export class OffscreenEngine {
    constructor(scene, scaleFactor = 2) {
        this.scene = scene;
        this.scaleFactor = scaleFactor;
    }

    createLayer(width, height, { depth = 25 } = {}) {
        const renderTexture = this.scene.make.renderTexture({
            width: width * this.scaleFactor,
            height: height * this.scaleFactor,
            add: true
        });

        renderTexture.setDisplaySize(width, height);
        renderTexture.setOrigin(0.5, 0.5);
        renderTexture.setDepth(depth);

        return new OffscreenLayer(this.scene, renderTexture, this.scaleFactor, width, height);
    }
}

export { OffscreenLayer };
