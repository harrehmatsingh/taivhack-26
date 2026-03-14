export interface Ad {
    adId: string;
    advertiserId: string;
    timeReceived: number;
    timeout: number;
    duration: number;
    baseRevenue: number;
    bannedLocations: string[];
}

export interface Area {
    areaId: string;
    location: string;
    multiplier: number;
    totalScreens: number;
    timeWindow: number;
}

export interface ScheduledAd {
    adId: string;
    areaId: string;
    startTime: number;
    endTime: number;
}

export type Schedule = Record<string, ScheduledAd[]>;

export class PlacementEngine {

    constructor() {
    }

    // TODO optimize this. since .includes works by linear search, it's not efficient for large arrays. 
    isAdCompatibleWithArea(ad: Ad, area: Area): boolean {
        return !ad.bannedLocations.includes(area.location);
    }

    // rename SA to a meaningful name.
    getTotalScheduledTimeForArea(areaSchedule: ScheduledAd[]): number {
        let total = 0;

        // sum the durations of all scheduled ads
        for (const scheduledAd of areaSchedule) {
            total += scheduledAd.endTime - scheduledAd.startTime;
        }

        return total;    
    }

    // Return true only if the ad can start at startTime, starts within its allowed availability window, and fully fits within the area's time window.
    doesPlacementFitTimingConstraints(
        ad: Ad,
        area: Area,
        startTime: number
    ): boolean {
        if (startTime < 0) return false;

        const adAvailableFrom = ad.timeReceived;
        const adAvailableUntil = ad.timeReceived + ad.timeout;
        if (startTime < adAvailableFrom || startTime > adAvailableUntil) return false;

        const endTime = startTime + ad.duration;
        if (endTime > area.timeWindow) return false;

        return true;
    }

    // optimize
    isAdAlreadyScheduled(adId: string, schedule: Schedule): boolean {        // one for loop to iterate over the areas
        for (const areaId in schedule) {
            for (const scheduledAd of schedule[areaId]) {
                if (scheduledAd.adId === adId) {
                    return true;
                }
            }
        }
        return false;
    }

    canScheduleAd(
        ad: Ad,
        area: Area,
        schedule: Schedule,
        startTime: number
    ): boolean {
        // do the checks
        if (!this.isAdCompatibleWithArea(ad, area)) return false;
        if (this.isAdAlreadyScheduled(ad.adId, schedule)) return false;
        if (!this.doesPlacementFitTimingConstraints(ad, area, startTime)) return false;

        // make sure the placement doesn't overlap with existing ads
        const areaSchedule = schedule[area.areaId] || [];
        const newEndTime = startTime + ad.duration;

        for (const existing of areaSchedule) {
            if (startTime < existing.endTime && newEndTime > existing.startTime) {
                return false;
            }
        }

        return true;
    }

    isAreaScheduleValid(area: Area, areaSchedule: ScheduledAd[], ads: Ad[]): boolean {
        if (areaSchedule.length === 0) return true;

        const adMap = new Map<string, Ad>();
        for (const ad of ads) {
            adMap.set(ad.adId, ad);
        }

        for (const sa of areaSchedule) {
            const ad = adMap.get(sa.adId);
            if (!ad) return false;
            if (!this.isAdCompatibleWithArea(ad, area)) return false;

            const scheduledDuration = sa.endTime - sa.startTime;
            if (scheduledDuration !== ad.duration) return false;
        }

        const totalScheduledTime = this.getTotalScheduledTimeForArea(areaSchedule);
        if (totalScheduledTime > area.timeWindow) return false;

        const sorted = [...areaSchedule].sort((a, b) => a.startTime - b.startTime);
        for (let i = 0; i < sorted.length; i++) {
            if (sorted[i].startTime < 0) return false;
            if (sorted[i].endTime > area.timeWindow) return false;

            if (i > 0 && sorted[i].startTime < sorted[i - 1].endTime) {
                return false;
            }
        }

        return true;
    }
}
