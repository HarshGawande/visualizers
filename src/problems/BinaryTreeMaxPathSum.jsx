import React, { useState, useEffect, useMemo, useRef } from 'react';
import { RefreshCw, Copy, Check } from 'lucide-react';
import ReplayControl from '../components/ReplayControl';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { cn } from '../lib/utils';
import ProblemInfo from '../components/ProblemInfo';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '../components/ui/resizable';

// Layout Configuration
const CANVAS_WIDTH = 800;
const INITIAL_DX = 200;
const DY = 80;

// Helper: Parse LeetCode style array string to Tree Object
const parseTreeArray = (inputStr) => {
    try {
        // Clean input: remove brackets, whitespace
        const cleaned = inputStr.replace(/[\[\]\s]/g, '');
        if (!cleaned) return null;

        const values = cleaned.split(',').map(v =>
            v === 'null' || v === '' ? null : parseInt(v, 10)
        );

        if (values.length === 0 || values[0] === null) return null;

        const root = { id: 0, val: values[0], children: [] };
        const queue = [root];
        let i = 1;

        while (queue.length > 0 && i < values.length) {
            const current = queue.shift();

            // Left Child
            if (i < values.length) {
                if (values[i] !== null) {
                    const leftNode = { id: i, val: values[i], children: [] };
                    current.children[0] = leftNode;
                    queue.push(leftNode);
                } else {
                    // ensure visualizer knows it's null/empty slot if needed, but for drawing we skip it
                }
                i++;
            }

            // Right Child
            if (i < values.length) {
                if (values[i] !== null) {
                    const rightNode = { id: i, val: values[i], children: [] };
                    current.children[1] = rightNode;
                    queue.push(rightNode);
                }
                i++;
            }
        }

        return root;
    } catch (e) {
        console.error("Invalid tree input", e);
        return null;
    }
};

// Helper: Get Tree Depth
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

// Helper: Assign Coordinates with dynamic width to prevent overlap
const assignCoordinates = (node, x, y, level, maxDepth) => {
    if (!node) return;
    node.x = x;
    node.y = y;

    if (!node.children) node.children = [];

    // Dynamic horizontal spacing based on tree height
    // Offset = 2^(maxDepth - level - 2) * UNIT
    const X_UNIT = 60;
    const exponent = Math.max(0, maxDepth - level - 2);
    const offset = Math.pow(2, exponent) * X_UNIT;

    // Left Child
    if (node.children[0]) {
        assignCoordinates(node.children[0], x - offset, y + DY, level + 1, maxDepth);
    }

    // Right Child
    if (node.children[1]) {
        assignCoordinates(node.children[1], x + offset, y + DY, level + 1, maxDepth);
    }
};

// Helper to flatten tree for rendering lines
const getLinks = (node, links = []) => {
    if (!node || !node.children) return links;
    node.children.forEach(child => {
        if (child) {
            links.push({
                source: { x: node.x, y: node.y },
                target: { x: child.x, y: child.y },
                id: `${node.id}-${child.id}`, // Unique ID for the edge
                sourceId: node.id,
                targetId: child.id
            });
            getLinks(child, links);
        }
    });
    return links;
};

// Helper to get nodes list
const getNodes = (node, nodes = []) => {
    if (!node) return nodes;
    nodes.push({ id: node.id, val: node.val, x: node.x, y: node.y });
    if (node.children) {
        node.children.forEach(child => {
            if (child) getNodes(child, nodes);
        });
    }
    return nodes;
};

const BinaryTreeMaxPathSum = ({ problem, isDarkMode }) => {
    const [treeInput, setTreeInput] = useState("[-10,9,20,null,null,15,7]");
    const [treeRoot, setTreeRoot] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [speed, setSpeed] = useState(1);
    const timerRef = useRef(null);
    const inputRef = useRef(null);

    // Initialize tree on first load or input change
    useEffect(() => {
        const root = parseTreeArray(treeInput);
        if (root) {
            const depth = getTreeDepth(root);
            assignCoordinates(root, 0, 50, 0, depth); // Start at x=0
            setTreeRoot(root);
            setCurrentStep(0);
            setIsPlaying(false);
        }
    }, [treeInput]); // Only rebuild when input string changes via explicit submit? simpler to do on effect

    const handleInputChange = (e) => {
        // Only update state on manual submit or blur to avoid flashing
        // For now, let's use a local ref and button
    };

    const submitTree = () => {
        if (inputRef.current) {
            setTreeInput(inputRef.current.value);
        }
    };

    // Canvas State
    const [viewState, setViewState] = useState({ x: CANVAS_WIDTH / 2, y: 0, scale: 1 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const handleMouseDown = (e) => {
        setIsDragging(true);
        // Store click pos relative to current viewState.x/y to maintain offset
        setDragStart({ x: e.clientX - viewState.x, y: e.clientY - viewState.y });
    };

    const handleMouseMove = (e) => {
        if (isDragging) {
            setViewState(prev => ({
                ...prev,
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            }));
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleWheel = (e) => {
        const scaleIntensity = 0.001;
        // Limit scale between 0.5x and 3x
        const newScale = Math.min(Math.max(0.5, viewState.scale + e.deltaY * -scaleIntensity), 3);
        setViewState(prev => ({ ...prev, scale: newScale }));
    };

    // Algorithm Simulation
    const steps = useMemo(() => {
        if (!treeRoot) return [];

        const recordedSteps = [];
        let globalMax = -Infinity;
        let globalMaxPathNodes = []; // store IDs

        const record = (data) => {
            recordedSteps.push({
                ...JSON.parse(JSON.stringify(data)),
                maxPathNodes: [...globalMaxPathNodes] // snapshot current best path
            });
        };

        // Returns { maxGain, pathNodes }
        // pathNodes is an array of nodeIDs starting from the node itself down to the leaf of the max chain
        const solve = (node) => {
            if (!node) return { maxGain: 0, pathNodes: [] };

            // START VISIT
            record({
                nodeId: node.id,
                activeEdge: null,
                type: 'visit',
                description: `DFS: Visiting node ${node.val}`
            });

            let leftResult = { maxGain: 0, pathNodes: [] };
            let rightResult = { maxGain: 0, pathNodes: [] };

            // Process children
            if (node.children[0]) {
                // Traversing down-left
                record({
                    nodeId: node.id,
                    activeEdge: `${node.id}-${node.children[0].id}`,
                    type: 'traverse',
                    description: `Going left to ${node.children[0].val}`
                });
                const res = solve(node.children[0]);
                if (res.maxGain > 0) leftResult = res;

                // Returning up
                record({
                    nodeId: node.id,
                    activeEdge: `${node.id}-${node.children[0].id}`,
                    type: 'return',
                    description: `Returned from left child ${node.children[0].val}. Gain: ${leftResult.maxGain}`
                });
            }

            if (node.children[1]) {
                // Traversing down-right
                record({
                    nodeId: node.id,
                    activeEdge: `${node.id}-${node.children[1].id}`,
                    type: 'traverse',
                    description: `Going right to ${node.children[1].val}`
                });
                const res = solve(node.children[1]);
                if (res.maxGain > 0) rightResult = res;

                // Returning up
                record({
                    nodeId: node.id,
                    activeEdge: `${node.id}-${node.children[1].id}`,
                    type: 'return',
                    description: `Returned from right child ${node.children[1].val}. Gain: ${rightResult.maxGain}`
                });
            }

            const currentPathSum = node.val + leftResult.maxGain + rightResult.maxGain;

            // Construct the path for this local max
            // It includes: leftPath (reversed) -> node -> rightPath
            const currentPathNodes = [
                ...leftResult.pathNodes, // these are children IDs
                node.id,
                ...rightResult.pathNodes
            ];

            if (currentPathSum > globalMax) {
                globalMax = currentPathSum;
                globalMaxPathNodes = currentPathNodes;
            }

            record({
                nodeId: node.id,
                type: 'calculate',
                vals: { left: leftResult.maxGain, right: rightResult.maxGain, self: node.val, total: currentPathSum },
                globalMax,
                description: `Max path through node ${node.val}: ${currentPathSum}. Global Max: ${globalMax}`
            });

            // Return max gain up to parent
            // Choose larger of left or right
            if (leftResult.maxGain > rightResult.maxGain) {
                return {
                    maxGain: node.val + leftResult.maxGain,
                    pathNodes: [node.id, ...leftResult.pathNodes]
                };
            } else {
                return {
                    maxGain: node.val + rightResult.maxGain,
                    pathNodes: [node.id, ...rightResult.pathNodes]
                };
            }
        };

        record({ type: 'start', description: 'Starting DFS traversal...', globalMax: -Infinity });
        solve(treeRoot);
        record({ type: 'finish', description: `Finished! Maximum Path Sum is ${globalMax}`, globalMax });

        return recordedSteps;
    }, [treeRoot]);

    // Playback Control
    useEffect(() => {
        if (isPlaying) {
            timerRef.current = setInterval(() => {
                setCurrentStep((prev) => {
                    if (prev < steps.length - 1) return prev + 1;
                    setIsPlaying(false);
                    return prev;
                });
            }, 1500 / speed);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [isPlaying, steps.length, speed]);

    const currentData = steps[currentStep] || (steps.length > 0 ? steps[0] : {});
    const allNodes = useMemo(() => getNodes(treeRoot), [treeRoot]);
    const allLinks = useMemo(() => getLinks(treeRoot), [treeRoot]);

    // Derived state helper
    const isFinished = currentData?.type === 'finish';

    const getNodeState = (id) => {
        if (!currentData || !currentData.nodeId) return 'default';

        // Success State
        if (isFinished && currentData.maxPathNodes?.includes(id)) {
            return 'success';
        }

        if (currentData.nodeId === id) {
            if (currentData.type === 'visit' || currentData.type === 'traverse' || currentData.type === 'return') return 'visiting';
            if (currentData.type === 'calculate') return 'calculating';
        }
        return 'default';
    };

    const getLinkState = (link) => {
        // Success State checking
        if (isFinished && currentData.maxPathNodes) {
            const { sourceId, targetId } = link;
            if (currentData.maxPathNodes.includes(sourceId) && currentData.maxPathNodes.includes(targetId)) {
                return 'success';
            }
        }

        if (currentData.activeEdge === link.id) return 'active';
        return 'default';
    };

    return (
        <div className="viz-container flex h-full w-full">
            <ResizablePanelGroup direction="horizontal" className="h-full w-full">
                <ResizablePanel defaultSize={25} minSize={20} maxSize={50} className="bg-background">
                    {/* Sidebar Info */}
                    <Card className="viz-sidebar flex flex-col h-full rounded-none border-0 border-r-0 bg-background">
                        <CardHeader className="border-b border-border pb-4">
                            <CardTitle className="text-lg">Binary Tree Max Path Sum</CardTitle>
                        </CardHeader>

                        <CardContent className="flex-1 overflow-y-auto space-y-6 pt-6">
                            <ProblemInfo problem={problem} />

                            <div className="rounded-lg bg-muted/50 border border-border p-4">
                                <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Algorithm Trace</h3>
                                <div className="text-sm font-mono text-balance text-foreground">
                                    {currentData?.description || "Ready to start"}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-medium text-muted-foreground block">
                                    Tree Input (BFS Array)
                                </label>
                                <div className="flex gap-2">
                                    <Input
                                        ref={inputRef}
                                        defaultValue={treeInput}
                                        placeholder="e.g. [-10,9,20,null,null,15,7]"
                                        className="font-mono text-xs"
                                    />
                                    <Button onClick={submitTree} size="icon" variant="outline">
                                        <RefreshCw className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 rounded-lg bg-secondary border border-border">
                                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                                        Global Max Sum
                                    </div>
                                    <div className={cn(
                                        "text-3xl font-bold font-mono transition-colors",
                                        isFinished ? "text-green-500" : "text-primary"
                                    )}>
                                        {currentData?.globalMax === undefined || currentData?.globalMax === -Infinity ? '—' : currentData.globalMax}
                                    </div>
                                </div>

                                {currentData?.type === 'calculate' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-4 rounded-lg bg-secondary/50 border border-border space-y-2"
                                    >
                                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            Calculating Node: <span className="text-foreground">{currentData.vals.self}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                                            <div className="flex justify-between"><span>Left Gain:</span> <span>{currentData.vals.left}</span></div>
                                            <div className="flex justify-between"><span>Right Gain:</span> <span>{currentData.vals.right}</span></div>
                                            <div className="col-span-2 border-t border-border pt-2 mt-1 flex justify-between font-bold text-primary">
                                                <span>Path Sum:</span>
                                                <span>{currentData.vals.total}</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
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
                                    <pattern
                                        id="grid-pattern"
                                        width={24 * viewState.scale}
                                        height={24 * viewState.scale}
                                        patternUnits="userSpaceOnUse"
                                        patternTransform={`translate(${viewState.x}, ${viewState.y})`}
                                    >
                                        <circle cx={1 * viewState.scale} cy={1 * viewState.scale} r={1 * viewState.scale} className="fill-neutral-400/30 dark:fill-neutral-600/30" />
                                    </pattern>
                                </defs>

                                {/* Infinite Grid Background */}
                                <rect width="100%" height="100%" fill="url(#grid-pattern)" />

                                {/* Content Group with Transform */}
                                <g transform={`translate(${viewState.x}, ${viewState.y}) scale(${viewState.scale})`}>
                                    {/* Links */}
                                    {allLinks.map((link) => (
                                        <line
                                            key={link.id}
                                            x1={link.source.x}
                                            y1={link.source.y}
                                            x2={link.target.x}
                                            y2={link.target.y}
                                            className={cn(
                                                "transition-all duration-500",
                                                getLinkState(link) === 'active' && "stroke-yellow-500 stroke-[4px] tree-link-dash",
                                                getLinkState(link) === 'success' && "stroke-green-500 stroke-[5px]",
                                                getLinkState(link) === 'default' && "stroke-border stroke-2"
                                            )}
                                        />
                                    ))}

                                    {/* Nodes */}
                                    {allNodes.map((node) => {
                                        const state = getNodeState(node.id);
                                        return (
                                            <g key={node.id} transform={`translate(${node.x},${node.y})`}>
                                                <motion.circle
                                                    r="24"
                                                    initial={false}
                                                    animate={{
                                                        scale: state !== 'default' ? 1.15 : 1,
                                                        fill: state === 'success' ? '#22c55e' :
                                                            ((state === 'visiting' || state === 'calculating') ? (isDarkMode ? '#ffffff' : (state === 'visiting' ? '#f59e0b' : '#3b82f6')) :
                                                                (isDarkMode ? '#0a0a0a' : '#ffffff')),
                                                        fillOpacity: 1,
                                                        stroke: state === 'success' ? '#22c55e' :
                                                            (state === 'visiting' ? '#f59e0b' :
                                                                (state === 'calculating' ? '#3b82f6' : (isDarkMode ? '#ffffff' : '#000000'))),
                                                        strokeWidth: state === 'default' ? 2 : 3
                                                    }}
                                                />
                                                <motion.text
                                                    className={cn(
                                                        "text-sm pointer-events-none select-none",
                                                        state === 'default' ? "font-semibold" : "font-bold"
                                                    )}
                                                    dy="1"
                                                    textAnchor="middle"
                                                    dominantBaseline="middle"
                                                    initial={false}
                                                    animate={{
                                                        fill: state === 'default'
                                                            ? (isDarkMode ? '#ffffff' : '#000000')
                                                            : (isDarkMode ? '#000000' : (state === 'visiting' ? '#000000' : '#ffffff'))
                                                    }}
                                                >
                                                    {node.val}
                                                </motion.text>

                                                {state === 'calculating' && currentData.nodeId === node.id && (
                                                    <motion.text
                                                        initial={{ opacity: 0, y: -30 }}
                                                        animate={{ opacity: 1, y: -45 }}
                                                        exit={{ opacity: 0 }}
                                                        className={cn(
                                                            "text-[10px] font-bold",
                                                            isDarkMode ? "fill-white" : "fill-black"
                                                        )}
                                                        textAnchor="middle"
                                                        style={{ textShadow: '0px 0px 4px rgba(0,0,0,0.5)' }}
                                                    >
                                                        {currentData.vals.total}
                                                    </motion.text>
                                                )}
                                            </g>
                                        );
                                    })}
                                </g>
                            </svg>
                        </div>

                        {/* Controls */}
                        <ReplayControl
                            currentStep={currentStep}
                            totalSteps={steps.length}
                            isPlaying={isPlaying}
                            onPlayPause={() => setIsPlaying(!isPlaying)}
                            onStepChange={setCurrentStep}
                        />
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
};

export default BinaryTreeMaxPathSum;
