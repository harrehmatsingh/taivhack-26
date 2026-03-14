export interface Device {
    id: string;
    name: string;
    version: string;
    user_id: string;
    status: 'active' | 'inactive';
    location: {
        latitude: number;
        longitude: number;
    };
}

export class DeviceManager {

    // mapping id (key) to device (value)
    private devicesById: Map<string, Device>;

    // constructor, gets called when a new instance of the class is created
    constructor() {
        this.devicesById = new Map();
    }

    addDevice(device: Device): void {
        if (!device.id) {
            throw new Error('Device must have an id');
        }
        if (this.devicesById.has(device.id)) {
            throw new Error(`Device with id ${device.id} already exists`);
        }
        this.devicesById.set(device.id, device);
    }

    removeDevice(id: string): void {
        if (!this.devicesById.has(id)) {
            throw new Error(`Device with id ${id} not found`);
        }
        this.devicesById.delete(id);
    }

    getDevice(id: string): Device | null {
        return this.devicesById.get(id) ?? null;
    }

    getDevicesByVersion(version: string): Device[] | null {
        return this.getAllDevices().filter((device) => device.version === version);
    }

    getDevicesByUserId(user_id: string): Device[] | null {
        return this.getAllDevices().filter((device) => device.user_id === user_id);
    }

    getDevicesByStatus(status: 'active' | 'inactive' | 'pending' | 'failed'): Device[] | null {
        return this.getAllDevices().filter((device) => device.status === status);
    }

    getDevicesInArea(latitude: number, longitude: number, radius_km: number): Device[] | null {
        // returns all devices within a radius of the given latitude and longitude
        // the radius is in kilometers
        return this.getAllDevices().filter((device) => {
            const distance = this.getDistanceKm(
                latitude,
                longitude,
                device.location.latitude,
                device.location.longitude,
            );
            return distance <= radius_km;
        });
    }

    getDevicesNearDevice(device_id: string, radius_km: number): Device[] | null {
        // returns all devices within a radius of the given device (not including the device itself)
        // the radius is in kilometers
        const device = this.getDevice(device_id);
        if (!device) {
            return null;
        }
        const nearby = this.getDevicesInArea(
            device.location.latitude,
            device.location.longitude,
            radius_km,
        ) ?? [];
        return nearby.filter((candidate) => candidate.id !== device_id);
    }

    getAllDevices(): Device[] {
        return Array.from(this.devicesById.values());
    }

    getDeviceCount(): number {
        return this.devicesById.size;
    }

    /*
    getDistanceKm()

    parameters: 4 numbers (2 latitude and 2 longitude co-ordinates for two points on Earth)
    returns: the "great circle distance" between two points on Earth. 

    Great Circle Distance is the shortest path between two points on a sphere's surface.
    This uses Haversine formula to compute the "great circle distance". 
    */
    private getDistanceKm(
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number,
    ): number {

        const toRadians = (deg: number) => (deg * Math.PI) / 180;
        const earthRadiusKm = 6371;

        const dLat = toRadians(lat2 - lat1); // latitudinal distance
        const dLon = toRadians(lon2 - lon1); // longitudinal distance

        const radLat1 = toRadians(lat1);
        const radLat2 = toRadians(lat2);

        // squared half chord length between two points on Earth (sphere)
        const sqHalfChordLen =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(radLat1) * Math.cos(radLat2) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

        // angular distance between two points
        const angDist = 2 * Math.atan2(Math.sqrt(sqHalfChordLen), Math.sqrt(1 - sqHalfChordLen));
        return earthRadiusKm * angDist;
    }
}
