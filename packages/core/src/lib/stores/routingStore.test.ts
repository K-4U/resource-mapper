import { describe, it, expect, beforeEach, vi } from 'vitest';
import { routingStore } from './routingStore';
import type { XYPosition } from '@xyflow/svelte';

// Mock setTimeout to control the 16ms debounce
vi.useFakeTimers();

describe('routingStore', () => {
    beforeEach(() => {
        // Reset the store/router if possible? 
        // Since it's a singleton, we might need a reset method or just clear the maps.
        // For now let's just assume we can test it incrementally.
    });

    it('registers nodes and routes an edge between them', async () => {
        const nodeA = {
            nodeId: 'a',
            absPos: { x: 0, y: 0 },
            width: 100,
            height: 50,
            isGroup: false
        };
        const nodeB = {
            nodeId: 'b',
            absPos: { x: 200, y: 200 },
            width: 100,
            height: 50,
            isGroup: false
        };

        await routingStore.registerNode(nodeA);
        await routingStore.registerNode(nodeB);

        await routingStore.registerEdge({
            edgeId: 'e1',
            sourceNodeId: 'a',
            targetNodeId: 'b',
            sourcePos: { x: 100, y: 25 },
            sourceSide: 'right',
            targetPos: { x: 200, y: 225 },
            targetSide: 'left'
        });

        // Trigger debounce
        vi.advanceTimersByTime(20);

        // Check if edge e1 has points
        let results: Record<string, XYPosition[]> = {};
        const unsubscribe = routingStore.subscribe(val => {
            results = val;
        });

        expect(results['e1']).toBeDefined();
        // Since we use shoulders (checkpoints), libavoid might still return 3 points if it's very direct,
        // but typically it's 4+ for orthogonal snaking.
        expect(results['e1'].length).toBeGreaterThanOrEqual(3); 
        
        unsubscribe();
    });

    it('nudges parallel edges apart', async () => {
        // Vertically stacked nodes
        const nodes = [
            { nodeId: 's', absPos: { x: 0, y: 100 }, width: 100, height: 50, isGroup: false },
            { nodeId: 't1', absPos: { x: 300, y: 0 }, width: 100, height: 50, isGroup: false },
            { nodeId: 't2', absPos: { x: 300, y: 200 }, width: 100, height: 50, isGroup: false }
        ];

        for (const n of nodes) await routingStore.registerNode(n);

        // Two edges from same source to different targets
        // Their paths might want to share the same "lane" if they were routed individually
        await routingStore.registerEdge({
            edgeId: 'e1', sourceNodeId: 's', targetNodeId: 't1',
            sourcePos: { x: 100, y: 125 }, sourceSide: 'right',
            targetPos: { x: 300, y: 25 }, targetSide: 'left'
        });
        await routingStore.registerEdge({
            edgeId: 'e2', sourceNodeId: 's', targetNodeId: 't2',
            sourcePos: { x: 100, y: 125 }, sourceSide: 'right',
            targetPos: { x: 300, y: 225 }, targetSide: 'left'
        });

        vi.advanceTimersByTime(20);

        let results: Record<string, XYPosition[]> = {};
        routingStore.subscribe(val => results = val)();

        const p1 = results['e1'];
        const p2 = results['e2'];

        expect(p1).toBeDefined();
        expect(p2).toBeDefined();

        // Check vertical segments (trunks)
        const getTrunkX = (pts: XYPosition[]) => {
            const v = pts.find((p, i) => i > 0 && p.x === pts[i-1].x && Math.abs(p.y - pts[i-1].y) > 10);
            return v ? v.x : null;
        };

        const x1 = getTrunkX(p1);
        const x2 = getTrunkX(p2);

        if (x1 !== null && x2 !== null) {
            expect(Math.abs(x1 - x2)).toBeGreaterThanOrEqual(10); // Nudging working
        }
    });

    it('unregisters an edge and stops returning its points', async () => {
        await routingStore.registerEdge({
            edgeId: 'e_remove',
            sourceNodeId: 'a',
            targetNodeId: 'b',
            sourcePos: { x: 100, y: 25 },
            sourceSide: 'right',
            targetPos: { x: 200, y: 225 },
            targetSide: 'left'
        });

        vi.advanceTimersByTime(20);
        
        let results: Record<string, XYPosition[]> = {};
        routingStore.subscribe(val => results = val)();
        expect(results['e_remove']).toBeDefined();

        routingStore.unregisterEdge('e_remove');
        
        // Unregistering deletes from state immediately but also processes transaction
        results = {};
        routingStore.subscribe(val => results = val)();
        expect(results['e_remove']).toBeUndefined();
    });
});
