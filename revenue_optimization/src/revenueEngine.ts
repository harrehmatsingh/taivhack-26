import { Ad, Area, Schedule, ScheduledAd, PlacementEngine } from './placementEngine';

export class RevenueEngine {
    placementEngine: PlacementEngine;

    constructor(placementEngine: PlacementEngine) {
        this.placementEngine = placementEngine;
    }

    // Return how many scheduled ads belong to the given advertiser across the full schedule. Return 0 if the advertiser has no scheduled ads.
    getAdvertiserScheduleCount(
        advertiserId: string,
        ads: Ad[],
        schedule: Schedule
    ): number {
        // Build a lookup from adId -> advertiserId for fast matching
        const adOwner = new Map<string, string>();
        for (const ad of ads) {
            adOwner.set(ad.adId, ad.advertiserId);
        }

        let count = 0;
        for (const areaId in schedule) {
            for (const scheduledAd of schedule[areaId]) {
                if (adOwner.get(scheduledAd.adId) === advertiserId) {
                    count++;
                }
            }
        }

        return count;
    }

    // Return the reduced revenue after applying diminishing returns. When advertiserScheduledCount is 0, treat the placement as the first (k=1), so the multiplier is 1 and the result is the full baseRevenue.
    calculateDiminishedRevenue(
        baseRevenue: number,
        advertiserScheduledCount: number,
        decayRate: number
    ): number {
        // advertiserScheduledCount represents how many ads from this advertiser
        // are already scheduled BEFORE this one. So this ad is the (count+1)-th,
        // and the decay multiplier is decayRate^count.
        return baseRevenue * Math.pow(decayRate, advertiserScheduledCount);
    }

    // Return the final revenue for placing one ad in one area, including the area multiplier and advertiser decay.
    calculatePlacementRevenue(
        ad: Ad,
        areas: Area[],
        ads: Ad[],
        schedule: Schedule,
        decayRate: number
    ): number {
        // Build lookups for fast access
        // use a map to store the ads and areas for fast access.
        const adMap = new Map<string, Ad>();
        for (const a of ads) {
            adMap.set(a.adId, a);
        }

        const areaMap = new Map<string, Area>();
        for (const a of areas) {
            areaMap.set(a.areaId, a);
        }

        // Collect all scheduled ads from the same advertiser across the full schedule,
        // paired with their scheduling info so we can determine decay order
        const sameAdvertiserPlacements: Array<{
            adId: string;
            startTime: number;
            rawRevenue: number;
        }> = [];

        for (const areaId in schedule) {
            for (const sa of schedule[areaId]) {
                const scheduledAd = adMap.get(sa.adId);
                if (scheduledAd && scheduledAd.advertiserId === ad.advertiserId) {
                    const area = areaMap.get(sa.areaId);
                    const multiplier = area ? area.multiplier : 1;
                    sameAdvertiserPlacements.push({
                        adId: sa.adId,
                        startTime: sa.startTime,
                        rawRevenue: scheduledAd.baseRevenue * multiplier,
                    });
                }
            }
        }

        // Sort by the deterministic decay ordering rules:
        // 1. startTime ascending (earlier ad gets full revenue)
        // 2. raw placement revenue ascending (lower raw revenue comes first when startTimes tie)
        // 3. adId lexicographically ascending (final tiebreaker)

        // use a custom sort function to sort the ads by the deterministic decay ordering rules.
        sameAdvertiserPlacements.sort((a, b) => {
            // sort by startTime ascending
            if (a.startTime !== b.startTime) return a.startTime - b.startTime;
            
            // sort by rawRevenue ascending
            if (a.rawRevenue !== b.rawRevenue) return a.rawRevenue - b.rawRevenue;
            
            // sort by adId lexicographically ascending
            return a.adId < b.adId ? -1 : a.adId > b.adId ? 1 : 0;
        });

        // Find this ad's position in the sorted order to determine its decay exponent
        const position = sameAdvertiserPlacements.findIndex(p => p.adId === ad.adId);

        // Find which area this ad is scheduled in to get the multiplier
        let areaMultiplier = 1;
        for (const areaId in schedule) {
            for (const sa of schedule[areaId]) {
                if (sa.adId === ad.adId) {
                    const area = areaMap.get(sa.areaId);
                    if (area) areaMultiplier = area.multiplier;
                    break;
                }
            }
        }

        const decayMultiplier = position >= 0 ? Math.pow(decayRate, position) : 1;
        return ad.baseRevenue * areaMultiplier * decayMultiplier;
    }

    // Return the number of unique advertisers represented in the schedule.
    getAdvertiserDiversity(ads: Ad[], schedule: Schedule): number {
        const adOwner = new Map<string, string>();
        for (const ad of ads) {
            adOwner.set(ad.adId, ad.advertiserId);
        }

        const uniqueAdvertisers = new Set<string>();
        for (const areaId in schedule) {
            for (const sa of schedule[areaId]) {
                const advertiserId = adOwner.get(sa.adId);
                if (advertiserId) {
                    uniqueAdvertisers.add(advertiserId);
                }
            }
        }

        return uniqueAdvertisers.size;
    }

    // Return the total revenue generated by the given area using the areas array, the full schedule, ad list, and decay rate. Revenue must account for the area’s multiplier and advertiser decay based on the full schedule, not just the target area. Return 0 when the given area's `areaId` is not a key in the schedule.
    getAreaRevenue(
        area: Area,
        areasArray: Area[],
        fullSchedule: Schedule,
        ads: Ad[],
        decayRate: number
    ): number {
        const areaSchedule = fullSchedule[area.areaId];
        if (!areaSchedule || areaSchedule.length === 0) return 0;

        // Sum up the revenue for each ad in this area.
        // Each ad's revenue depends on its global decay position across the full schedule.
        let totalRevenue = 0;
        for (const sa of areaSchedule) {
            const ad = ads.find(a => a.adId === sa.adId);
            if (!ad) continue;
            totalRevenue += this.calculatePlacementRevenue(ad, areasArray, ads, fullSchedule, decayRate);
        }

        return totalRevenue;
    }
}
