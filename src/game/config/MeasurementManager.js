export class MeasurementManager {
    constructor() {
        this.units = {
            tileSize: 512,
            corridorWidth: 5, // 4~6 tiles for 6-player party comfort
            room: {
                minWidth: 12,
                maxWidth: 20,
                minHeight: 12,
                maxHeight: 20,
                padding: 2,
                maxRooms: 18
            },
            map: {
                width: 70,
                height: 55
            },
            camera: {
                defaultZoom: 0.12
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
        return this.units.corridorWidth;
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
}

export const measurementManager = new MeasurementManager();
