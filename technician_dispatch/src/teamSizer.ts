/**
 * CHALLENGE 3: Minimum Technicians — Fix All Boxes Within a Deadline
 *
 * All boxes must be repaired within deadlineMinutes. All technicians start
 * from the SAME location. Each box is assigned to exactly one technician
 * (no overlapping). Your goal: find the MINIMUM number of technicians needed
 * so that every technician finishes all their assigned boxes on time.
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
    /** Minutes needed to fully repair this box. */
    fixTimeMinutes: number;
}

export interface TechnicianAssignment {
    /** Label for this technician, e.g. "Technician 1", "Technician 2", … */
    technicianLabel: string;
    /** Ordered list of box IDs this technician will visit and fix. */
    assignedBoxIds: string[];
    /** Total time used (travel + fix). Must be ≤ deadlineMinutes. */
    totalTimeMinutes: number;
}

export interface TeamSizeResult {
    /** Minimum number of technicians needed. Equals assignments.length. */
    techniciansNeeded: number;
    /** One entry per technician. No box ID appears in more than one entry. */
    assignments: TechnicianAssignment[];
    /** True when all boxes are assigned and every technician finishes on time. */
    feasible: boolean;
}

export class TeamSizer {

    // ── Pre-implemented helpers — do not modify ───────────────────────────────

    /**
     * Returns the great-circle distance in kilometres between two GPS
     * coordinates using the Haversine formula (Earth radius = 6 371 km).
     */
    haversineDistance(loc1: Location, loc2: Location): number {
        const R = 6371;
        const toRad = (deg: number) => (deg * Math.PI) / 180;
        const dLat = toRad(loc2.latitude  - loc1.latitude);
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

    calculateAssignmentDuration(
        startLocation: Location,
        speedKmh: number,
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
        let currentLocation = startLocation;

        for (const id of routeIds) {
            const box = boxById.get(id);
            if (!box) {
                return null;
            }
            if (visited.has(id)) {
                continue;
            }
            total += this.travelTimeMinutes(currentLocation, box.location, speedKmh);
            total += box.fixTimeMinutes;
            currentLocation = box.location;
            visited.add(id);
        }

        return total;
    }

    tryAssign(
        startLocation: Location,
        speedKmh: number,
        boxes: Box[],
        numTechnicians: number,
        deadlineMinutes: number
    ): TechnicianAssignment[] | null {
        const assignments = this.createEmptyAssignments(numTechnicians);

        if (boxes.length === 0) {
            return assignments;
        }

        // If any single box can't meet the deadline alone, the plan is impossible.
        if (!this.allBoxesIndividuallyFeasible(startLocation, speedKmh, boxes, deadlineMinutes)) {
            return null;
        }

        const orderedBoxes = this.orderBoxesBySoloCost(startLocation, speedKmh, boxes);
        const techState = this.createTechnicianState(numTechnicians, startLocation);

        for (const box of orderedBoxes) {
            const choice = this.chooseBestTechnician(
                techState,
                box,
                speedKmh,
                deadlineMinutes,
            );

            if (!choice) {
                return null;
            }

            // Commit the box to the chosen technician.
            assignments[choice.index].assignedBoxIds.push(box.id);
            techState[choice.index].totalTime += choice.addedMinutes;
            techState[choice.index].currentLocation = box.location;
            assignments[choice.index].totalTimeMinutes = techState[choice.index].totalTime;
        }

        return assignments;
    }

    findMinimumTeamSize(
        startLocation: Location,
        speedKmh: number,
        boxes: Box[],
        deadlineMinutes: number
    ): TeamSizeResult {
        if (boxes.length === 0) {
            return {
                techniciansNeeded: 0,
                assignments: [],
                feasible: true,
            };
        }

        for (const box of boxes) {
            const aloneTime =
                this.travelTimeMinutes(startLocation, box.location, speedKmh) +
                box.fixTimeMinutes;
            // One box already exceeds the deadline → impossible for any team size.
            if (aloneTime > deadlineMinutes) {
                return {
                    techniciansNeeded: 0,
                    assignments: [],
                    feasible: false,
                };
            }
        }

        for (let n = 1; n <= boxes.length; n++) {
            const assignments = this.tryAssign(startLocation, speedKmh, boxes, n, deadlineMinutes);
            if (assignments) {
                return {
                    techniciansNeeded: n,
                    assignments,
                    feasible: true,
                };
            }
        }

        return {
            techniciansNeeded: 0,
            assignments: [],
            feasible: false,
        };
    }

    /*
    createEmptyAssignments
    parameters: numTechnicians
    return: TechnicianAssignment[]
    summary: Creates N empty technician assignments with labels.
    */
    private createEmptyAssignments(numTechnicians: number): TechnicianAssignment[] {
        return Array.from(
            { length: numTechnicians },
            (_, i) => ({
                technicianLabel: `Technician ${i + 1}`,
                assignedBoxIds: [],
                totalTimeMinutes: 0,
            }),
        );
    }

    /*
    allBoxesIndividuallyFeasible
    parameters: startLocation, speedKmh, boxes, deadlineMinutes
    return: boolean
    summary: Ensures every box can be completed alone within the deadline.
    */
    private allBoxesIndividuallyFeasible(
        startLocation: Location,
        speedKmh: number,
        boxes: Box[],
        deadlineMinutes: number,
    ): boolean {
        for (const box of boxes) {
            const aloneTime =
                this.travelTimeMinutes(startLocation, box.location, speedKmh) +
                box.fixTimeMinutes;
            if (aloneTime > deadlineMinutes) {
                return false;
            }
        }
        return true;
    }

    /*
    orderBoxesBySoloCost
    parameters: startLocation, speedKmh, boxes
    return: Box[]
    summary: Sorts boxes so heavier (slower) ones get assigned first.
    */
    private orderBoxesBySoloCost(
        startLocation: Location,
        speedKmh: number,
        boxes: Box[],
    ): Box[] {
        return [...boxes].sort((a, b) => {
            const aCost =
                this.travelTimeMinutes(startLocation, a.location, speedKmh) +
                a.fixTimeMinutes;
            const bCost =
                this.travelTimeMinutes(startLocation, b.location, speedKmh) +
                b.fixTimeMinutes;
            if (bCost !== aCost) return bCost - aCost;
            return a.id.localeCompare(b.id);
        });
    }

    /*
    createTechnicianState
    parameters: numTechnicians, startLocation
    return: { currentLocation: Location; totalTime: number }[]
    summary: Initializes each technician at the shared start with zero time.
    */
    private createTechnicianState(
        numTechnicians: number,
        startLocation: Location,
    ): { currentLocation: Location; totalTime: number }[] {
        return Array.from({ length: numTechnicians }, () => ({
            currentLocation: startLocation,
            totalTime: 0,
        }));
    }

    /*
    chooseBestTechnician
    parameters: techState, box, speedKmh, deadlineMinutes
    return: { index: number; addedMinutes: number } | null
    summary: Picks the technician that can take the box with the smallest new total time.
    */
    private chooseBestTechnician(
        techState: { currentLocation: Location; totalTime: number }[],
        box: Box,
        speedKmh: number,
        deadlineMinutes: number,
    ): { index: number; addedMinutes: number } | null {
        let bestIndex = -1;
        let bestAdded = Infinity;
        let bestResultTotal = Infinity;

        for (let i = 0; i < techState.length; i++) {
            const travel = this.travelTimeMinutes(techState[i].currentLocation, box.location, speedKmh);
            const added = travel + box.fixTimeMinutes;
            const newTotal = techState[i].totalTime + added;
            if (newTotal > deadlineMinutes) {
                continue;
            }
            if (
                newTotal < bestResultTotal - 1e-9 ||
                (Math.abs(newTotal - bestResultTotal) <= 1e-9 && added < bestAdded)
            ) {
                bestResultTotal = newTotal;
                bestAdded = added;
                bestIndex = i;
            }
        }

        if (bestIndex === -1) {
            return null;
        }

        return { index: bestIndex, addedMinutes: bestAdded };
    }
}
