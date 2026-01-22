import React, { useState, useEffect, useMemo, useRef } from 'react';
import { RefreshCw, Play, Pause, RotateCcw, ChevronRight, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '../components/ui/resizable';
import ProblemInfo from '../components/ProblemInfo';
import ReplayControl from '../components/ReplayControl';
import { cn } from '../lib/utils';
import './CountCompleteTreeNodes.css';

// Constants
const CANVAS_WIDTH = 800;
const NODE_RADIUS = 20;
const Y_STRIDE = 70;

// --- Tree Helpers ---

const parseTreeArray = (inputStr) => {
    try {
        const cleaned = inputStr.replace(/[\[\]\s]/g, '');
        if (!cleaned) return null;
        const values = cleaned.split(',').map(v => v === 'null' || v === '' ? null : parseInt(v, 10));
        if (values.length === 0 || values[0] === null) return null;

        const root = { id: 0, val: values[0], children: [] };
        const queue = [root];
        let i = 1;

        while (queue.length > 0 && i < values.length) {
            const current = queue.shift();
            // Left
            if (i < values.length) {
                if (values[i] !== null) {
                    const left = { id: i, val: values[i], children: [] };
                    current.children[0] = left;
                    queue.push(left);
                }
                i++;
            }
            // Right
            if (i < values.length) {
                if (values[i] !== null) {
                    const right = { id: i, val: values[i], children: [] };
                    current.children[1] = right;
                    queue.push(right);
                }
                i++;
            }
        }
        return root;
    } catch {
        return null;
    }
};

const getTreeDepth = (node) => {
    if (!node) return 0;
    let max = 0;
    if (node.children) {
        node.children.forEach(c => {
            if (c) max = Math.max(max, getTreeDepth(c));
        });
    }
    return max + 1;
};

const assignCoordinates = (node, x, y, level, maxDepth) => {
    if (!node) return;

    node.viewId = `n-${node.id}`;
    node.x = x;
    node.y = y;

    if (!node.children) node.children = [];

    const X_UNIT = 30; // Slightly tighter
    // Calculate width of subtree at this level for spacing
    // standard binary tree spacing logic
    const exponent = Math.max(0, maxDepth - level - 2);
    const offset = Math.pow(2, exponent) * X_UNIT;

    // We only care about children 0 and 1
    if (node.children[0]) assignCoordinates(node.children[0], x - offset, y + Y_STRIDE, level + 1, maxDepth);
    if (node.children[1]) assignCoordinates(node.children[1], x + offset, y + Y_STRIDE, level + 1, maxDepth);
};

const flattenTree = (node, list = []) => {
    if (!node) return list;
    list.push(node);
    if (node.children) {
        node.children.forEach(c => flattenTree(c, list));
    }
    return list;
};

const getLinks = (node, links = []) => {
    if (!node || !node.children) return links;
    node.children.forEach(child => {
        if (child) {
            links.push({
                id: `${node.viewId}-${child.viewId}`,
                source: { x: node.x, y: node.y },
                target: { x: child.x, y: child.y }
            });
            getLinks(child, links);
        }
    });
    return links;
};

// Collect all node IDs in a subtree for highlighting
const getSubtreeIds = (node) => {
    if (!node) return [];
    let ids = [node.viewId];
    if (node.children) {
        node.children.forEach(c => {
            if (c) ids = ids.concat(getSubtreeIds(c));
        });
    }
    return ids;
};

const CountCompleteTreeNodes = ({ problem, isDarkMode }) => {
    const [input, setInput] = useState("[1,2,3,4,5,6]");
    const [root, setRoot] = useState(null);
    const [speed, setSpeed] = useState(1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const timerRef = useRef(null);

    // Canvas State
    const [viewState, setViewState] = useState({ x: CANVAS_WIDTH / 2, y: 50, scale: 1 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const inputRef = useRef(null);

    const handleUpdateTree = () => {
        if (inputRef.current) setInput(inputRef.current.value);
        setCurrentStep(0);
        setIsPlaying(false);
    };

    // Parse & Layout
    useEffect(() => {
        const r = parseTreeArray(input);
        if (r) {
            const depth = getTreeDepth(r);
            assignCoordinates(r, 0, 0, 0, depth);
        }
        setRoot(r);
    }, [input]);

    // Algorithm Logic
    const steps = useMemo(() => {
        if (!root) return [];
        const recorded = [];
        const record = (type, data) => recorded.push({ type, ...data });

        // Helper to compute left height and visualize the path
        // Returns { height, pathNodes }
        const getLeftHeightMeta = (node) => {
            let h = 0;
            let current = node;
            const pathIds = [];
            while (current) {
                h++;
                pathIds.push(current.viewId);
                current = current.children ? current.children[0] : null;
            }
            return { h, pathIds };
        };

        const solve = (node) => {
            if (!node) return 0;

            const nodeId = node.viewId;
            record('visit', {
                focusId: nodeId,
                description: `Visiting Node ${node.val}. Calculating Left and Right heights (along left edge).`
            });

            // Get Left Height of Left Child
            const leftMeta = getLeftHeightMeta(node.children ? node.children[0] : null);
            // Get Left Height of Right Child
            const rightMeta = getLeftHeightMeta(node.children ? node.children[1] : null);

            record('measure', {
                focusId: nodeId,
                leftPath: leftMeta.pathIds,
                rightPath: rightMeta.pathIds,
                lh: leftMeta.h,
                rh: rightMeta.h,
                description: `Left Child Height: ${leftMeta.h}, Right Child Height: ${rightMeta.h}`
            });

            // Comparison
            if (leftMeta.h === rightMeta.h) {
                // Left subtree is perfect
                // Number of nodes in perfect tree of height h: 2^h - 1. 
                // But wait, our 'h' is just the height. 
                // If height is 1 (just the node), count is 1 = 2^0? No.
                // Let's re-verify:
                // height of a single node is 1.
                // height of null is 0.
                // If leftMeta.h == rightMeta.h:
                // It means the left child has the same height as the right child -> Left subtree is full.
                // Nodes in left subtree = 2^h - 1. PLUS the root of left subtree?
                // Actually the formula: (1 << h) + count(right)
                // (1 << h) accounts for the left subtree (which is perfect, size 2^h - 1) PLUS the current node 'node'?
                // No. Let's trace carefully.
                // Standard algo:
                // h(root) = height of root.
                // if h(root.right) == h(root) - 1:
                //    Left subtree is perfect with height h(root)-1.
                //    Nodes = (2^(h(root)-1) - 1) [nodes in left] + 1 [root] + count(root.right)
                //          = 2^(h(root)-1) + count(root.right)
                // Here: leftMeta.h is height of left child.
                // If leftMeta.h == rightMeta.h, it means left subtree is perfect.
                // Size of left subtree = 2^(leftMeta.h) - 1 details?
                // Actually if height is h, perfect tree nodes = 2^h - 1.
                // The term `(1 << leftMeta.h)` equals 2^leftMeta.h.
                // So `(1 << leftMeta.h)` includes the left child and its descendants + the current node?
                // Wait. 2^h.
                // Example: height 1 (1 node). 2^1 = 2. Too many.
                // Example: height 2 (3 nodes). 2^2 = 4. Too many.
                // Example: height 0 (null). 1.

                // Let's use the property: count = 1 (current) + count(left) + count(right).
                // If left perfect (height H_L): count(left) = 2^H_L - 1.

                // Algo from LeetCode Solution:
                // int lh = height(root.left);
                // int rh = height(root.right);
                // if (lh == rh) {
                //    return (1 << lh) + countNodes(root.right);
                // }

                // If lh = 1 (node has 1 level). 1 << 1 = 2.
                // Perfect tree of height 1 has 1 node.
                // So (1 << lh) = 2.
                // Is it 2?
                // return 1 (root) + (2^lh - 1) (left subtree) + count(right).
                // 1 + 2^lh - 1 = 2^lh.
                // Yes, exactly.

                const added = (1 << leftMeta.h);
                // Highlight left subtree nodes
                const leftSubtreeIds = getSubtreeIds(node.children ? node.children[0] : null);

                record('add-left', {
                    focusId: nodeId,
                    highlightIds: leftSubtreeIds, // New field for permanent/semi-permanent highlight
                    added,
                    description: `Left Height == Right Height. Left subtree is perfect. Adding 2^${leftMeta.h} = ${added} (Root + Left Subtree). Recurse Right.`
                });

                return added + solve(node.children ? node.children[1] : null);
            } else {
                // Right subtree is perfect (height = rh)
                // We add 1 (root) + (2^rh - 1) (right subtree) + count(left)
                // = 2^rh + count(left)
                const added = (1 << rightMeta.h);
                const rightSubtreeIds = getSubtreeIds(node.children ? node.children[1] : null);

                record('add-right', {
                    focusId: nodeId,
                    highlightIds: rightSubtreeIds,
                    added,
                    description: `Left Height > Right Height. Right subtree is perfect. Adding 2^${rightMeta.h} = ${added} (Root + Right Subtree). Recurse Left.`
                });

                return added + solve(node.children ? node.children[0] : null);
            }
        };

        record('start', { description: "Starting Count Complete Tree Nodes..." });
        const total = solve(root);
        record('finish', { description: `Finished. Total Complete Tree Nodes: ${total}`, total });

        return recorded;
    }, [root]);

    // Timer
    useEffect(() => {
        if (isPlaying) {
            timerRef.current = setInterval(() => {
                setCurrentStep(prev => {
                    if (prev < steps.length - 1) return prev + 1;
                    setIsPlaying(false);
                    return prev;
                });
            }, 1000 / speed);
        } else clearInterval(timerRef.current);
        return () => clearInterval(timerRef.current);
    }, [isPlaying, steps.length, speed]);

    // Visual Helpers
    const currentData = steps[currentStep] || {};
    const allNodes = useMemo(() => flattenTree(root), [root]);
    const allLinks = useMemo(() => getLinks(root), [root]);

    // Accumulate Count
    const currentCount = useMemo(() => {
        let count = 0;
        for (let i = 0; i <= currentStep; i++) {
            if (steps[i]?.added) {
                count += steps[i].added;
            }
        }
        return count;
    }, [currentStep, steps]);

    // Determine Highlighted Nodes (accumulated)
    const highlightedNodes = useMemo(() => {
        // Collect all highlightIds from steps up to current
        // AND handle transient highlights like 'visit' or 'measure'
        const perm = new Set();
        for (let i = 0; i <= currentStep; i++) {
            if (steps[i]?.highlightIds) {
                steps[i].highlightIds.forEach(id => perm.add(id));
            }
            // Logic: if we visited a node, we sort of 'processed' it, but only if we added it?
            // "Adding" logic handles the subtree.
            // The 'focusId' is the current root being processed.
            if (steps[i]?.type === 'add-left' || steps[i]?.type === 'add-right') {
                perm.add(steps[i].focusId);
            }
        }
        return perm;
    }, [currentStep, steps]);

    const getNodeState = (nodeId) => {
        if (!currentData.type) return 'default';

        // Transient states
        if (currentData.focusId === nodeId) return 'focus';
        if (currentData.leftPath && currentData.leftPath.includes(nodeId)) return 'path-left';
        if (currentData.rightPath && currentData.rightPath.includes(nodeId)) return 'path-right';

        // Permanent states
        if (highlightedNodes.has(nodeId)) return 'counted';

        return 'default';
    };

    // Canvas Interaction
    const handleMouseDown = (e) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - viewState.x, y: e.clientY - viewState.y });
    };
    const handleMouseMove = (e) => {
        if (isDragging) setViewState(prev => ({ ...prev, x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }));
    };
    const handleMouseUp = () => setIsDragging(false);
    const handleWheel = (e) => {
        const newScale = Math.min(Math.max(0.4, viewState.scale - e.deltaY * 0.001), 3);
        setViewState(prev => ({ ...prev, scale: newScale }));
    };

    return (
        <div className="viz-container flex h-full w-full">
            <ResizablePanelGroup direction="horizontal" className="h-full w-full">
                <ResizablePanel defaultSize={25} minSize={20} maxSize={50} className="bg-background">
                    <Card className="viz-sidebar flex flex-col h-full rounded-none border-0 border-r-0 bg-background">
                        <CardHeader className="border-b border-border pb-4">
                            <CardTitle className="text-lg">Count Complete Nodes</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto space-y-6 pt-6">
                            <ProblemInfo problem={problem} />

                            <div className="rounded-lg bg-muted/50 border border-border p-4">
                                <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Status</h3>
                                <div className="text-sm font-mono text-foreground mb-2">
                                    {currentData.description || "Ready"}
                                </div>
                                <div className="text-xl font-bold text-primary">
                                    Count: {currentCount}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground">Tree (Array)</label>
                                    <Input ref={inputRef} defaultValue={input} className="font-mono text-xs" />
                                </div>
                                <Button onClick={handleUpdateTree} className="w-full" variant="outline">
                                    <RefreshCw className="h-4 w-4 mr-2" /> Update Tree
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </ResizablePanel>

                <ResizableHandle withHandle />

                <ResizablePanel defaultSize={75}>
                    <div className="viz-main flex-1 flex flex-col relative h-full">
                        <div className="viz-canvas-area flex-1 relative overflow-hidden flex items-center justify-center bg-zinc-50 dark:bg-zinc-950/50">
                            <svg
                                width="100%"
                                height="100%"
                                className="cursor-move touch-none block"
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={handleMouseUp}
                                onWheel={handleWheel}
                            >
                                <defs>
                                    <pattern id="grid-pattern-cnt" width={24 * viewState.scale} height={24 * viewState.scale} patternUnits="userSpaceOnUse" patternTransform={`translate(${viewState.x}, ${viewState.y})`}>
                                        <circle cx={1} cy={1} r={1} className="fill-neutral-400/30 dark:fill-neutral-600/30" />
                                    </pattern>
                                </defs>
                                <rect width="100%" height="100%" fill="url(#grid-pattern-cnt)" />

                                <g transform={`translate(${viewState.x}, ${viewState.y}) scale(${viewState.scale})`}>
                                    {/* Links */}
                                    {allLinks.map(link => (
                                        <line
                                            key={link.id}
                                            x1={link.source.x} y1={link.source.y}
                                            x2={link.target.x} y2={link.target.y}
                                            className="stroke-border stroke-2"
                                        />
                                    ))}

                                    {/* Nodes */}
                                    {allNodes.map(node => {
                                        const state = getNodeState(node.viewId);
                                        return (
                                            <g key={node.viewId} transform={`translate(${node.x}, ${node.y})`}>
                                                <motion.circle
                                                    r={NODE_RADIUS}
                                                    initial={false}
                                                    animate={{
                                                        fill: state === 'focus' ? '#3b82f6' : // blue
                                                            state === 'path-left' ? '#f59e0b' : // yellow
                                                                state === 'path-right' ? '#ec4899' : // pink  
                                                                    state === 'counted' ? '#22c55e' : // green
                                                                        (isDarkMode ? '#000' : '#fff'),
                                                        stroke: state !== 'default' ? 'transparent' : (isDarkMode ? '#fff' : '#000'),
                                                        scale: state !== 'default' ? 1.1 : 1
                                                    }}
                                                    className="stroke-2 transition-colors"
                                                />
                                                <text
                                                    dy="1"
                                                    textAnchor="middle"
                                                    dominantBaseline="middle"
                                                    className={cn(
                                                        "text-xs font-bold pointer-events-none select-none",
                                                        state !== 'default' ? "fill-white" : "fill-foreground"
                                                    )}
                                                >
                                                    {node.val}
                                                </text>
                                            </g>
                                        );
                                    })}
                                </g>
                            </svg>

                            {/* Legend Overlay */}
                            <div className="absolute top-4 right-4 bg-background/90 p-2 rounded border border-border text-xs space-y-1 shadow-sm backdrop-blur">
                                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500"></span> Current Node</div>
                                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-yellow-500"></span> Left Height Path</div>
                                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-pink-500"></span> Right Height Path</div>
                                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500"></span> Counted</div>
                            </div>
                        </div>

                        <ReplayControl
                            currentStep={currentStep}
                            totalSteps={steps.length}
                            isPlaying={isPlaying}
                            onPlayPause={() => setIsPlaying(!isPlaying)}
                            onStepChange={setCurrentStep}
                            speed={speed}
                            onSpeedChange={setSpeed}
                        />
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
};

export default CountCompleteTreeNodes;
