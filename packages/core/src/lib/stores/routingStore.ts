import {writable} from 'svelte/store';
import type {XYPosition} from '@xyflow/svelte';
import {type Avoid, AvoidLib, type ConnRef, type Router, type ShapeRef} from 'libavoid-js';
import {OFFSET_STEP} from "$lib/utils/flow/layout";

// --- Types ---

export interface EdgeRoutingUpdate {
    edgeId: string;
    sourceNodeId: string;
    targetNodeId: string;
    sourcePos: XYPosition;
    sourceSide: string;
    targetPos: XYPosition;
    targetSide: string;
}

export interface NodeRoutingUpdate {
    nodeId: string;
    absPos: XYPosition;
    width: number;
    height: number;
    isGroup: boolean;
}

// --- Library Loading ---

let avoidLibPromise: Promise<void> | null = null;
let avoidLibInstance: Avoid | null = null;

async function ensureAvoidLibLoaded() {
    if (avoidLibPromise) return avoidLibPromise;
    if (typeof window === 'undefined') {
        //We're in test mode in node, load the library directly from the file system
        avoidLibPromise = AvoidLib.load();
    } else {
        avoidLibPromise = AvoidLib.load("/libavoid.wasm");
    }
    return avoidLibPromise;
}

async function getAvoidLib() {
    await ensureAvoidLibLoaded();
    avoidLibInstance ??= AvoidLib.getInstance();
    return avoidLibInstance;
}

// --- Helpers ---

const getDirFlag = (pos: string) => {
    const p = pos.toLowerCase();
    if (p === 'right') return 8;
    if (p === 'left') return 4;
    if (p === 'top') return 1;
    if (p === 'bottom') return 2;
    return 15;
};

const getShoulderPoint = (avoid: Avoid, x: number, y: number, pos: string, dist: number) => {
    switch (pos.toLowerCase()) {
        case 'right': return new avoid.Point(x + dist, y);
        case 'left': return new avoid.Point(x - dist, y);
        case 'top': return new avoid.Point(x, y - dist);
        case 'bottom': return new avoid.Point(x, y + dist);
        default: return new avoid.Point(x, y);
    }
};

// --- Store Implementation ---

function createRoutingStore() {
    const { subscribe, set } = writable<Record<string, XYPosition[]>>({});

    let router: Router | null = null;
    let avoid: Avoid | null = null;

    const nodes = new Map<string, ShapeRef>();
    const nodesMetadata = new Map<string, XYPosition>();
    const edges = new Map<string, ConnRef>();

    let pendingTransaction = false;

    async function init() {
        if (router) return;
        avoid = await getAvoidLib();
        router = new avoid.Router(avoid.RouterFlag.OrthogonalRouting.value);

        router.setRoutingParameter(avoid.RoutingParameter.reverseDirectionPenalty.valueOf(), 1000);
        router.setRoutingParameter(avoid.RoutingParameter.portDirectionPenalty.valueOf(), 500);
        router.setRoutingParameter(avoid.RoutingParameter.idealNudgingDistance.valueOf(), OFFSET_STEP);
        router.setRoutingParameter(avoid.RoutingParameter.segmentPenalty.valueOf(), 50);

        // Options for nudging
        router.setRoutingOption(avoid.RoutingOption.nudgeOrthogonalSegmentsConnectedToShapes.valueOf(), true);
        router.setRoutingOption(avoid.RoutingOption.nudgeOrthogonalTouchingColinearSegments.valueOf(), true);
    }

    function processTransaction() {
        if (!router || pendingTransaction) return;

        pendingTransaction = true;
        // Batch to next frame (16ms)
        setTimeout(() => {
            if (!router) {
                pendingTransaction = false;
                return;
            }

            router.processTransaction();

            const results: Record<string, XYPosition[]> = {};
            edges.forEach((conn, id) => {
                const route = conn.displayRoute();
                const pts: XYPosition[] = [];
                for (let i = 0; i < route.size(); i++) {
                    const p = route.at(i);
                    pts.push({ x: p.x, y: p.y });
                }
                results[id] = pts;
            });

            set(results);
            pendingTransaction = false;
        }, 16);
    }

    return {
        subscribe,

        registerNode: async (data: NodeRoutingUpdate) => {
            await init();
            if (!router || !avoid) return;

            if (data.isGroup) {
                if (nodes.has(data.nodeId)) {
                    const shape = nodes.get(data.nodeId)!;
                    router.deleteShape(shape);
                    nodes.delete(data.nodeId);
                    nodesMetadata.delete(data.nodeId);
                }
                return;
            }

            nodesMetadata.set(data.nodeId, data.absPos);

            const poly = new avoid.Polygon(4);
            poly.setPoint(0, new avoid.Point(data.absPos.x, data.absPos.y));
            poly.setPoint(1, new avoid.Point(data.absPos.x + data.width, data.absPos.y));
            poly.setPoint(2, new avoid.Point(data.absPos.x + data.width, data.absPos.y + data.height));
            poly.setPoint(3, new avoid.Point(data.absPos.x, data.absPos.y + data.height));

            if (nodes.has(data.nodeId)) {
                const shape = nodes.get(data.nodeId)!;
                //@ts-ignore - libavoid typings are wrong, moveShape_poly actually needs three args
                router.moveShape_poly(shape, poly, false);
            } else {
                const shape = new avoid.ShapeRef(router, poly);
                nodes.set(data.nodeId, shape);
            }

            processTransaction();
        },

        registerEdge: async (data: EdgeRoutingUpdate) => {
            await init();
            if (!router || !avoid) return;

            const sShape = nodes.get(data.sourceNodeId);
            const tShape = nodes.get(data.targetNodeId);

            if (!sShape || !tShape) return;

            const createConnEnd = (nodeId: string, x: number, y: number, side: string, shape: ShapeRef) => {
                if (!avoid) throw new Error('Avoid not loaded');
                const pinClass = Array.from(data.edgeId).reduce((a, b) => a + (b.codePointAt(0) ?? 0), 0);

                // Convert absolute coords to relative coords for the pin (libavoid expects relative to shape's top-left)
                const abs = nodesMetadata.get(nodeId);
                const xOff = x - (abs?.x ?? 0);
                const yOff = y - (abs?.y ?? 0);

                const pin = new avoid.ShapeConnectionPin(shape, pinClass, xOff, yOff, false, -40, getDirFlag(side));
                pin.setExclusive(true);
                return new avoid.ConnEnd(shape, pinClass);
            };

            const srcEnd = createConnEnd(data.sourceNodeId, data.sourcePos.x, data.sourcePos.y, data.sourceSide, sShape);
            const dstEnd = createConnEnd(data.targetNodeId, data.targetPos.x, data.targetPos.y, data.targetSide, tShape);

            let conn: ConnRef;
            if (edges.has(data.edgeId)) {
                conn = edges.get(data.edgeId)!;
                conn.setSourceEndpoint(srcEnd);
                conn.setDestEndpoint(dstEnd);
            } else {
                conn = new avoid.ConnRef(router, srcEnd, dstEnd);
                edges.set(data.edgeId, conn);
            }

            // Checkpoints for shoulders
            const checkpoints = new avoid.CheckpointVector();
            checkpoints.push_back(new avoid.Checkpoint(getShoulderPoint(avoid, data.sourcePos.x, data.sourcePos.y, data.sourceSide, 10)));
            checkpoints.push_back(new avoid.Checkpoint(getShoulderPoint(avoid, data.targetPos.x, data.targetPos.y, data.targetSide, 10)));
            conn.setRoutingCheckpoints(checkpoints);

            processTransaction();
        },

        unregisterEdge: (id: string) => {
            if (!router || !edges.has(id)) return;
            const conn = edges.get(id)!;
            router.deleteConnector(conn);
            edges.delete(id);

            set(Object.fromEntries(
                Array.from(edges.entries()).map(([id, conn]) => {
                    const route = conn.displayRoute();
                    const pts: XYPosition[] = [];
                    for (let i = 0; i < route.size(); i++) {
                        const p = route.at(i);
                        pts.push({ x: p.x, y: p.y });
                    }
                    return [id, pts];
                })
            ));

            processTransaction();
        }
    };
}

export const routingStore = createRoutingStore();
