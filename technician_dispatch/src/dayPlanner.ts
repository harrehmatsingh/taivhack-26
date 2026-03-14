/**
 * CHALLENGE 2: Single Technician — Maximum Boxes in a Working Day
 *
 * A technician has a fixed number of working minutes today. Each box has a
 * GPS location and a repair time. Travelling between locations also burns
 * time. Your goal: choose WHICH boxes to visit and in WHAT ORDER to maximise
 * the number of boxes fixed before time runs out.
 *
 * The key insight — the closest box is NOT always the best choice:
 *   A nearby box with a long fix time can consume all remaining budget,
 *   whereas skipping it might let you fix two or three faster boxes instead.
 *   Your algorithm must weigh travel time against fix time to make the right call.
 *
 * Do NOT modify any interface or the pre-implemented helper methods.
 * Implement every method marked with TODO.
 */

export interface Location {
    latitude: number;
    longitude: number;
}

export interface Box {
    id: string;
    name: string;
    location: Location;
    /** Minutes needed to fully repair this box once the technician arrives. */
    fixTimeMinutes: number;
}

export interface Technician {
    id: string;
    name: string;
    startLocation: Location;
    speedKmh: number;
    workingMinutes: number;
}

export interface DayPlanResult {
    technicianId: string;
    /** Ordered list of box IDs visited today. Every box must be fully completed. */
    plannedRoute: string[];
    /** Total minutes used (travel + all fix times). Must be ≤ workingMinutes. */
    totalTimeUsedMinutes: number;
    /** Equal to plannedRoute.length. */
    boxesFixed: number;
    /** Every box NOT in plannedRoute. */
    skippedBoxIds: string[];
}

export class DayPlanner {

    // ── Pre-implemented helpers — do not modify ───────────────────────────────

    /**
     * Returns the great-circle distance in kilometres between two GPS
     * coordinates using the Haversine formula (Earth radius = 6 371 km).
     */
    haversineDistance(loc1: Location, loc2: Location): number {
        const R = 6371;
        const toRad = (deg: number) => (deg * Math.PI) / 180;
        const dLat = toRad(loc2.latitude - loc1.latitude);
        const dLng = toRad(loc2.longitude - loc1.longitude);
        const lat1 = toRad(loc1.latitude);
        const lat2 = toRad(loc2.latitude);
        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    /**
     * Returns the travel time in minutes between two locations at a given speed.
     *   travelTimeMinutes = (distanceKm / speedKmh) × 60
     */
    travelTimeMinutes(loc1: Location, loc2: Location, speedKmh: number): number {
        return (this.haversineDistance(loc1, loc2) / speedKmh) * 60;
    }

    // ── Your implementation below ─────────────────────────────────────────────

    calculateRouteDuration(
        technician: Technician,
        boxes: Box[],
        routeIds: string[]
    ): number | null {
        if (routeIds.length === 0) {
            return 0;
        }

        const boxById = new Map<string, Box>();
        for (const box of boxes) {
            boxById.set(box.id, box);
        }

        const visited = new Set<string>();
        let total = 0;
        let currentLocation = technician.startLocation;

        for (const id of routeIds) {
            const box = boxById.get(id);
            if (!box) {
                return null;
            }
            if (visited.has(id)) {
                continue;
            }
            total += this.travelTimeMinutes(currentLocation, box.location, technician.speedKmh);
            total += box.fixTimeMinutes;
            currentLocation = box.location;
            visited.add(id);
        }

        return total;
    }

    planDay(technician: Technician, boxes: Box[]): DayPlanResult {
        if (boxes.length === 0) {
            return {
                technicianId: technician.id,
                plannedRoute: [],
                totalTimeUsedMinutes: 0,
                boxesFixed: 0,
                skippedBoxIds: [],
            };
        }

        // First filter out boxes that can never fit (fix time alone exceeds the day).
        const { remaining, skipped } = this.partitionBoxesByFeasibility(technician, boxes);

        const plannedRoute: string[] = [];
        let totalTime = 0;
        let currentLocation = technician.startLocation;

        while (remaining.size > 0) {
            // Pick the next box that adds the least extra time from where we are now.
            const bestId = this.selectNextBoxId(
                remaining,
                currentLocation,
                technician.speedKmh,
                totalTime,
                technician.workingMinutes,
            );

            if (!bestId) {
                // Nothing else fits in the remaining time budget
                break;
            }

            // Apply the choice and advance our position/time
            const step = this.commitSelection(
                remaining,
                bestId,
                currentLocation,
                technician.speedKmh,
            );
            totalTime += step.stepMinutes;
            currentLocation = step.newLocation;
            plannedRoute.push(bestId);
        }

        // Everything left unvisited is considered skipped.
        for (const id of remaining.keys()) {
            skipped.add(id);
        }

        return {
            technicianId: technician.id,
            plannedRoute,
            totalTimeUsedMinutes: totalTime,
            boxesFixed: plannedRoute.length,
            skippedBoxIds: Array.from(skipped),
        };
    }

    /*
    partitionBoxesByFeasibility
    parameters: technician, boxes
    return: { remaining: Map<string, Box>; skipped: Set<string> }
    summary: Splits boxes into those that could ever fit in the workday and those that cannot.
    */
    private partitionBoxesByFeasibility(
        technician: Technician,
        boxes: Box[],
    ): { remaining: Map<string, Box>; skipped: Set<string> } {
        const remaining = new Map<string, Box>();
        const skipped = new Set<string>();
        for (const box of boxes) {
            // If a single repair is longer than the whole day, it can never be done, so SKIP (the dishes) it !!!
            if (box.fixTimeMinutes > technician.workingMinutes) {
                skipped.add(box.id);
            } else {
                remaining.set(box.id, box);
            }
        }
        return { remaining, skipped };
    }

    /*
    selectNextBoxId
    parameters: remaining, currentLocation, speedKmh, totalTime, workingMinutes
    return: string or null
    summary: Picks the next feasible box with the lowest incremental time cost.
    */
    private selectNextBoxId(
        remaining: Map<string, Box>,
        currentLocation: Location,
        speedKmh: number,
        totalTime: number,
        workingMinutes: number,
    ): string | null {
        let bestId: string | null = null;
        let bestCost = Infinity;

        for (const [id, box] of remaining) {
            const travel = this.travelTimeMinutes(currentLocation, box.location, speedKmh);
            const cost = travel + box.fixTimeMinutes;
            // Skip boxes that would push us over the time limit.
            if (totalTime + cost > workingMinutes) {
                continue;
            }
            if (
                cost < bestCost - 1e-9 ||
                (Math.abs(cost - bestCost) <= 1e-9 && (bestId === null || id < bestId))
            ) {
                bestCost = cost;
                bestId = id;
            }
        }

        return bestId;
    }

    /*
    commitSelection
    parameters: remaining, chosenId, currentLocation, speedKmh
    return: { stepMinutes: number; newLocation: Location }
    summary: Applies the chosen box to the route and returns its time cost and new position.
    */
    private commitSelection(
        remaining: Map<string, Box>,
        chosenId: string,
        currentLocation: Location,
        speedKmh: number,
    ): { stepMinutes: number; newLocation: Location } {

        const chosen = remaining.get(chosenId)!;
        // Travel time plus fix time is the full cost for this step.
        const stepMinutes =
            this.travelTimeMinutes(currentLocation, chosen.location, speedKmh) +
            chosen.fixTimeMinutes;
        remaining.delete(chosenId);

        return { stepMinutes, newLocation: chosen.location };
    }
}
