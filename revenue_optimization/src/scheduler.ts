import { Ad, Area, Schedule, ScheduledAd, PlacementEngine } from './placementEngine';
import { RevenueEngine } from './revenueEngine';

export class Scheduler {
    placementEngine: PlacementEngine;
    revenueEngine: RevenueEngine;

    constructor(placementEngine: PlacementEngine, revenueEngine: RevenueEngine) {
        this.placementEngine = placementEngine;
        this.revenueEngine = revenueEngine;
    }

    getNextAvailableStartTime(areaSchedule: ScheduledAd[]): number {
        if (areaSchedule.length === 0) return 0;

        const sorted = [...areaSchedule].sort((a, b) => a.startTime - b.startTime);

        // Walk forward from time 0 tracking where coverage ends.
        // The first gap we encounter is the earliest available slot.
        let coveredUntil = 0;
        for (const sa of sorted) {
            if (sa.startTime > coveredUntil) return coveredUntil;
            coveredUntil = Math.max(coveredUntil, sa.endTime);
        }

        return coveredUntil;
    }

    isValidSchedule(
        schedule: Schedule,
        areas: Area[],
        ads: Ad[]
    ): boolean {
        const areaMap = new Map<string, Area>();
        for (const area of areas) {
            areaMap.set(area.areaId, area);
        }

        const adMap = new Map<string, Ad>();
        for (const ad of ads) {
            adMap.set(ad.adId, ad);
        }

        // Each ad may only appear once globally across all areas
        const seenAdIds = new Set<string>();

        for (const areaId in schedule) {
            // Reject schedule keys that don't correspond to a known area
            const area = areaMap.get(areaId);
            if (!area) return false;

            for (const sa of schedule[areaId]) {
                // Each ScheduledAd's areaId must match the bucket it sits in
                if (sa.areaId !== areaId) return false;

                if (seenAdIds.has(sa.adId)) return false;
                seenAdIds.add(sa.adId);

                const ad = adMap.get(sa.adId);
                if (!ad) return false;

                // isAreaScheduleValid doesn't check the ad's availability window,
                // so we verify it here
                if (sa.startTime < ad.timeReceived) return false;
                if (sa.startTime > ad.timeReceived + ad.timeout) return false;
            }

            // Delegate overlap, duration, compatibility, and bounds checks
            if (!this.placementEngine.isAreaScheduleValid(area, schedule[areaId], ads)) {
                return false;
            }
        }

        return true;
    }

    compareSchedules(
        ads: Ad[],
        areas: Area[],
        scheduleA: Schedule,
        scheduleB: Schedule,
        decayRate: number
    ): number {
        // 1. Higher total revenue wins
        let revenueA = 0;
        let revenueB = 0;
        for (const area of areas) {
            revenueA += this.revenueEngine.getAreaRevenue(area, areas, scheduleA, ads, decayRate);
            revenueB += this.revenueEngine.getAreaRevenue(area, areas, scheduleB, ads, decayRate);
        }
        if (revenueA !== revenueB) return revenueA - revenueB;

        // 2. Less unused time wins
        // 2. Less unused time wins
        let unusedA = 0;
        let unusedB = 0;
        for (const area of areas) {
            unusedA += area.timeWindow - this.placementEngine.getTotalScheduledTimeForArea(scheduleA[area.areaId] || []);
            unusedB += area.timeWindow - this.placementEngine.getTotalScheduledTimeForArea(scheduleB[area.areaId] || []);
        }
        if (unusedA !== unusedB) return unusedB - unusedA;

        // 3. Greater advertiser diversity wins
        const diversityA = this.revenueEngine.getAdvertiserDiversity(ads, scheduleA);
        const diversityB = this.revenueEngine.getAdvertiserDiversity(ads, scheduleB);
        if (diversityA !== diversityB) return diversityA - diversityB;

        return 0;
    }

    /**
     * Finds the earliest time an ad can start in an area without overlapping
     * existing ads, while respecting the ad's availability window and the
     * area's time boundary. Expects sortedAreaSchedule to already be sorted
     * by startTime ascending.
     */
    private findEarliestValidSlot(
        ad: Ad,
        area: Area,
        sortedAreaSchedule: ScheduledAd[]
    ): number | null {
        const earliestStart = ad.timeReceived;
        const latestStart = ad.timeReceived + ad.timeout;

        // Walk through gaps: [0, first.start), [first.end, second.start), ...
        let gapStart = 0;
        for (const sa of sortedAreaSchedule) {
            const gapEnd = sa.startTime;
            const candidateStart = Math.max(gapStart, earliestStart);

            if (candidateStart <= latestStart &&
                candidateStart + ad.duration <= gapEnd &&
                candidateStart + ad.duration <= area.timeWindow) {
                return candidateStart;
            }

            gapStart = Math.max(gapStart, sa.endTime);
        }

        // Try the gap after all existing ads
        const candidateStart = Math.max(gapStart, earliestStart);
        if (candidateStart <= latestStart && candidateStart + ad.duration <= area.timeWindow) {
            return candidateStart;
        }

        return null;
    }

    /**
     * Binary-search insert into an already-sorted (by startTime) array.
     */
    private insertSorted(sortedSchedule: ScheduledAd[], entry: ScheduledAd): void {
        let lo = 0;
        let hi = sortedSchedule.length;
        while (lo < hi) {
            const mid = (lo + hi) >>> 1;
            if (sortedSchedule[mid].startTime <= entry.startTime) {
                lo = mid + 1;
            } else {
                hi = mid;
            }
        }
        sortedSchedule.splice(lo, 0, entry);
    }

    private precomputeCompatibleAreas(
        ads: Ad[],
        areas: Area[]
    ): Map<string, Array<{ area: Area; rawRevenue: number }>> {
        const result = new Map<string, Array<{ area: Area; rawRevenue: number }>>();
        for (const ad of ads) {
            const entries: Array<{ area: Area; rawRevenue: number }> = [];
            for (const area of areas) {
                if (this.placementEngine.isAdCompatibleWithArea(ad, area)) {
                    entries.push({ area, rawRevenue: ad.baseRevenue * area.multiplier });
                }
            }
            entries.sort((a, b) => b.rawRevenue - a.rawRevenue);
            result.set(ad.adId, entries);
        }
        return result;
    }

    /**
     * Core greedy scheduler parameterized by scoring mode.
     * - 'revenue': pure marginal revenue (best for datasets dominated by a few high-value ads)
     * - 'density': marginal revenue per time unit (best when many short ads outperform fewer long ones)
     */
    private buildGreedySchedule(
        ads: Ad[],
        areas: Area[],
        decayRate: number,
        useDensityScoring: boolean
    ): { schedule: Schedule; sortedAreaSchedules: Map<string, ScheduledAd[]>; scheduledAdIds: Set<string> } {
        const schedule: Schedule = {};
        const sortedAreaSchedules = new Map<string, ScheduledAd[]>();
        for (const area of areas) {
            schedule[area.areaId] = [];
            sortedAreaSchedules.set(area.areaId, []);
        }

        const scheduledAdIds = new Set<string>();
        const advertiserCounts = new Map<string, number>();

        // Precompute which areas each ad is compatible with, sorted by
        // rawRevenue (baseRevenue × multiplier) descending. This lets us
        // exit the inner loop early: once the best possible revenue for
        // an area can't beat our current best, neither can any remaining area.
        const compatibleAreas = new Map<string, Array<{ area: Area; rawRevenue: number }>>();
        for (const ad of ads) {
            const entries: Array<{ area: Area; rawRevenue: number }> = [];
            for (const area of areas) {
                if (this.placementEngine.isAdCompatibleWithArea(ad, area)) {
                    entries.push({ area, rawRevenue: ad.baseRevenue * area.multiplier });
                }
            }
            entries.sort((a, b) => b.rawRevenue - a.rawRevenue);
            compatibleAreas.set(ad.adId, entries);
        }

        // Greedy: each iteration finds the single unscheduled (ad, area) pair
        // with the highest marginal revenue and places it at the earliest valid slot.
        // Marginal revenue = baseRevenue × multiplier × decayRate^(advertiserCount)
        // This naturally balances high-value placements with advertiser diversity,
        // since repeated advertiser ads get decayed marginal revenue.
        let placed = true;
        while (placed) {
            placed = false;

            let bestAd: Ad | null = null;
            let bestArea: Area | null = null;
            let bestStartTime = -1;
            let bestScore = -1;

            for (const ad of ads) {
                if (scheduledAdIds.has(ad.adId)) continue;

                const advCount = advertiserCounts.get(ad.advertiserId) || 0;
                const decayMultiplier = Math.pow(decayRate, advCount);

                for (const { area, rawRevenue } of compatibleAreas.get(ad.adId)!) {
                    const marginalRevenue = rawRevenue * decayMultiplier;
                    const score = useDensityScoring
                        ? marginalRevenue / ad.duration
                        : marginalRevenue;

                    if (score <= bestScore) break;

                    const sortedSchedule = sortedAreaSchedules.get(area.areaId)!;
                    const startTime = this.findEarliestValidSlot(ad, area, sortedSchedule);
                    if (startTime === null) continue;

                    bestScore = score;
                    bestAd = ad;
                    bestArea = area;
                    bestStartTime = startTime;
                    break;
                }
            }

            if (bestAd && bestArea && bestStartTime >= 0) {
                const entry: ScheduledAd = {
                    adId: bestAd.adId,
                    areaId: bestArea.areaId,
                    startTime: bestStartTime,
                    endTime: bestStartTime + bestAd.duration,
                };

                schedule[bestArea.areaId].push(entry);
                this.insertSorted(sortedAreaSchedules.get(bestArea.areaId)!, entry);

                scheduledAdIds.add(bestAd.adId);
                advertiserCounts.set(
                    bestAd.advertiserId,
                    (advertiserCounts.get(bestAd.advertiserId) || 0) + 1
                );
                placed = true;
            }
        }

        return { schedule, sortedAreaSchedules, scheduledAdIds };
    }

    /**
     * After the main greedy, try to place remaining ads in available gaps.
     * Sorts by duration ascending so smaller ads fill tighter gaps first,
     * reducing unused time and potentially increasing advertiser diversity.
     */
    private fillRemainingGaps(
        schedule: Schedule,
        ads: Ad[],
        sortedAreaSchedules: Map<string, ScheduledAd[]>,
        scheduledAdIds: Set<string>,
        compatibleAreas: Map<string, Array<{ area: Area; rawRevenue: number }>>
    ): void {
        const remaining = ads
            .filter(ad => !scheduledAdIds.has(ad.adId))
            .sort((a, b) => a.duration - b.duration);

        for (const ad of remaining) {
            const areas = compatibleAreas.get(ad.adId);
            if (!areas) continue;

            for (const { area } of areas) {
                const sortedSchedule = sortedAreaSchedules.get(area.areaId);
                if (!sortedSchedule) continue;

                const startTime = this.findEarliestValidSlot(ad, area, sortedSchedule);
                if (startTime === null) continue;

                const entry: ScheduledAd = {
                    adId: ad.adId,
                    areaId: area.areaId,
                    startTime,
                    endTime: startTime + ad.duration,
                };

                schedule[area.areaId].push(entry);
                this.insertSorted(sortedSchedule, entry);
                scheduledAdIds.add(ad.adId);
                break;
            }
        }
    }

    private cleanEmptyAreas(schedule: Schedule): void {
        for (const areaId in schedule) {
            if (schedule[areaId].length === 0) delete schedule[areaId];
        }
    }

    buildSchedule(
        ads: Ad[],
        areas: Area[],
        decayRate: number
    ): Schedule {
        if (ads.length === 0 || areas.length === 0) return {};

        const compatibleAreas = this.precomputeCompatibleAreas(ads, areas);

        // Strategy 1: greedy by marginal revenue — favors high-value individual placements
        const revResult = this.buildGreedySchedule(ads, areas, decayRate, false);
        this.fillRemainingGaps(revResult.schedule, ads, revResult.sortedAreaSchedules, revResult.scheduledAdIds, compatibleAreas);
        this.cleanEmptyAreas(revResult.schedule);

        // Strategy 2: greedy by revenue density — favors efficient time usage
        const denResult = this.buildGreedySchedule(ads, areas, decayRate, true);
        this.fillRemainingGaps(denResult.schedule, ads, denResult.sortedAreaSchedules, denResult.scheduledAdIds, compatibleAreas);
        this.cleanEmptyAreas(denResult.schedule);

        return this.compareSchedules(ads, areas, revResult.schedule, denResult.schedule, decayRate) >= 0
            ? revResult.schedule
            : denResult.schedule;
    }
}
