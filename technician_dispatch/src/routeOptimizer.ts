/**
 * CHALLENGE 1: Single Technician — Shortest Route
 *
 * A technician starts at a known GPS location and must visit every broken
 * box exactly once. Your goal is to find the shortest possible total travel
 * distance.
 *
 * Scoring:
 *   - Correctness  — every box visited exactly once, distance is accurate.
 *   - Route quality — your total distance is compared against other teams;
 *                     shorter routes score higher on the load tests.
 *
 * Do NOT modify any interface or the pre-implemented helper methods.
 * Implement every method marked with TODO.
 */

export interface Location {
    latitude: number;   // decimal degrees
    longitude: number;  // decimal degrees
}

export interface Box {
    id: string;
    name: string;
    location: Location;
}

export interface Technician {
    id: string;
    name: string;
    startLocation: Location;
}

export interface RouteResult {
    technicianId: string;
    /** Ordered list of box IDs. Every box must appear exactly once. */
    route: string[];
    /** Total travel distance in km. Does NOT include a return leg to start. */
    totalDistanceKm: number;
}

export class RouteOptimizer {

    // ── Pre-implemented helper — do not modify ────────────────────────────────

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

    // ── Your implementation below ─────────────────────────────────────────────

    calculateRouteDistance(
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
            total += this.haversineDistance(currentLocation, box.location);
            currentLocation = box.location;
            visited.add(id);
        }

        return total;
    }

    findShortestRoute(technician: Technician, boxes: Box[]): RouteResult {
        if (boxes.length === 0) {
            return {
                technicianId: technician.id,
                route: [],
                totalDistanceKm: 0,
            };
        }
        const ids = boxes.map((b) => b.id);
        const dist = this.buildDistanceMatrix(boxes);
        const startDist = this.buildStartDistances(technician.startLocation, boxes);
        const routeIdx = this.buildGreedyRoute(ids, dist, startDist);
        this.improveRoute2Opt(routeIdx, dist);

        const route = routeIdx.map((idx) => ids[idx]);
        const totalDistanceKm = this.calculateRouteDistance(technician, boxes, route) ?? 0;

        return {
            technicianId: technician.id,
            route,
            totalDistanceKm,
        };
    }

    /*
        buildDistanceMatrix
        parameters: boxes
        return: number[][]
        summary: Pre-computes the symmetric pairwise haversine distances between all boxes.
        */
    private buildDistanceMatrix(boxes: Box[]): number[][] {

        const n = boxes.length;
        const dist: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                const d = this.haversineDistance(boxes[i].location, boxes[j].location);
                dist[i][j] = d;
                dist[j][i] = d;
            }
        }
        return dist;
    }

    /*
        buildStartDistances
        parameters: start, boxes
        return: number[]
        summary: Computes the distance from the technician start location to each box.
        */
    private buildStartDistances(start: Location, boxes: Box[]): number[] {

        const n = boxes.length;
        const startDist: number[] = new Array(n);
        for (let i = 0; i < n; i++) {
            startDist[i] = this.haversineDistance(start, boxes[i].location);
        }
        return startDist;
    }

    /*
        buildGreedyRoute
        parameters: ids, dist, startDist
        return: number[]
        summary: Builds a nearest-neighbor route with deterministic tie-breaking by ID.
        */
    private buildGreedyRoute(
        ids: string[],
        dist: number[][],
        startDist: number[],
    ): number[] {

        const n = ids.length;
        const visited = new Array<boolean>(n).fill(false);
        const routeIdx: number[] = [];
        let current = -1;

        for (let step = 0; step < n; step++) {
            let bestIdx = -1;
            let bestDist = Infinity;
            for (let i = 0; i < n; i++) {
                if (visited[i]) continue;
                const d = current === -1 ? startDist[i] : dist[current][i];
                if (
                    d < bestDist - 1e-9 ||
                    (Math.abs(d - bestDist) <= 1e-9 && (bestIdx === -1 || ids[i] < ids[bestIdx]))
                ) {
                    bestDist = d;
                    bestIdx = i;
                }
            }
            visited[bestIdx] = true;
            routeIdx.push(bestIdx);
            current = bestIdx;
        }

        return routeIdx;
    }

    /*
        improveRoute2Opt
        parameters: routeIdx, dist
        return: void
        summary: Applies a capped 2-opt pass to reduce path length by reversing segments.
        */
    private improveRoute2Opt(routeIdx: number[], dist: number[][]): void {

        const n = routeIdx.length;
        if (n < 4) {
            return;
        }

        const maxChecks = Math.min(20000, n * n);
        let checks = 0;
        let improved = true;
        while (improved && checks < maxChecks) {
            improved = false;
            for (let i = 0; i < n - 2 && checks < maxChecks; i++) {
                for (let k = i + 1; k < n - 1 && checks < maxChecks; k++) {
                    checks++;
                    const a = routeIdx[i];
                    const b = routeIdx[i + 1];
                    const c = routeIdx[k];
                    const d = routeIdx[k + 1];

                    const currentDist = dist[a][b] + dist[c][d];
                    const swappedDist = dist[a][c] + dist[b][d];

                    if (swappedDist + 1e-9 < currentDist) {
                        for (let left = i + 1, right = k; left < right; left++, right--) {
                            const tmp = routeIdx[left];
                            routeIdx[left] = routeIdx[right];
                            routeIdx[right] = tmp;
                        }
                        improved = true;
                    }
                }
            }
        }
    }
}
