export class MeasurementManager {
    constructor() {
        this.units = {
            tileSize: 512,
            corridorWidth: { min: 3, max: 4 },
            room: {
                minWidth: 10,
                maxWidth: 18,
                minHeight: 10,
                maxHeight: 18,
                padding: 1,
                maxRooms: 28
            },
            map: {
                width: 140,
                height: 110
            },
            camera: {
                defaultZoom: 0.18,
                minZoom: 0.08,
                maxZoom: 0.35,
                zoomStep: 0.02
            }
        };
    }

    update(partialUnits) {
        this.units = {
            ...this.units,
            ...partialUnits,
            room: {
                ...this.units.room,
                ...(partialUnits?.room ?? {})
            },
            map: {
                ...this.units.map,
                ...(partialUnits?.map ?? {})
            },
            corridorWidth: {
                ...this.units.corridorWidth,
                ...(partialUnits?.corridorWidth ?? {})
            },
            camera: {
                ...this.units.camera,
                ...(partialUnits?.camera ?? {})
            }
        };
    }

    getTileSize() {
        return this.units.tileSize;
    }

    getCorridorWidth() {
        const { min, max } = this.units.corridorWidth;
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    getRoomConfig() {
        return this.units.room;
    }

    getMapSize() {
        return this.units.map;
    }

    getDefaultZoom() {
        return this.units.camera.defaultZoom;
    }

    getCameraConfig() {
        return this.units.camera;
    }
}

export const measurementManager = new MeasurementManager();
