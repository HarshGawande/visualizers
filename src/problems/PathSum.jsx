import React, { useState, useEffect, useMemo, useRef } from 'react';
import { RefreshCw, Play, RotateCcw } from 'lucide-react';
import ReplayControl from '../components/ReplayControl';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { cn } from '../lib/utils';
import ProblemInfo from '../components/ProblemInfo';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '../components/ui/resizable';
import './PathSum.css';

// Layout Configuration
const CANVAS_WIDTH = 800;
const DY = 80;

// Helper: Parse LeetCode style array string to Tree Object
const parseTreeArray = (inputStr) => {
    try {
        const cleaned = inputStr.replace(/[\[\]\s]/g, '');
        if (!cleaned) return null;

        const values = cleaned.split(',').map(v =>
            v === 'null' || v === '' ? null : parseInt(v, 10)
        );

        if (values.length === 0 || values[0] === null) return null;

        const root = { id: 0, val: values[0], children: [] };
        const queue = [root];
        let i = 1;
        let idCounter = 1;

        while (queue.length > 0 && i < values.length) {
            const current = queue.shift();

            // Left Child
            if (i < values.length) {
                if (values[i] !== null) {
                    const leftNode = { id: idCounter++, val: values[i], children: [] };
                    current.children[0] = leftNode;
                    queue.push(leftNode);
                }
                i++;
            }

            // Right Child
            if (i < values.length) {
                if (values[i] !== null) {
                    const rightNode = { id: idCounter++, val: values[i], children: [] };
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

// Helper: Assign Coordinates
const assignCoordinates = (node, x, y, level, maxDepth) => {
    if (!node) return;
    node.x = x;
    node.y = y;

    if (!node.children) node.children = [];

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

// Helper: Get Links
const getLinks = (node, links = []) => {
    if (!node || !node.children) return links;
    node.children.forEach(child => {
        if (child) {
            links.push({
                source: { x: node.x, y: node.y },
                target: { x: child.x, y: child.y },
                id: `${node.id}-${child.id}`,
                sourceId: node.id,
                targetId: child.id
            });
            getLinks(child, links);
        }
    });
    return links;
};

// Helper: Get Nodes
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

const PathSum = ({ problem, isDarkMode }) => {
    const [treeInput, setTreeInput] = useState("[5,4,8,11,null,13,4,7,2,null,null,null,1]");
    const [targetSum, setTargetSum] = useState(22);
    const [treeRoot, setTreeRoot] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [speed, setSpeed] = useState(1);
    const timerRef = useRef(null);
    const inputSumRef = useRef(null);
    const inputTreeRef = useRef(null);

    // Initialize Tree
    useEffect(() => {
        const root = parseTreeArray(treeInput);
        if (root) {
            const depth = getTreeDepth(root);
            assignCoordinates(root, 0, 50, 0, depth);
            setTreeRoot(root);
            setCurrentStep(0);
            setIsPlaying(false);
        }
    }, [treeInput]);

    const submitConfig = () => {
        if (inputTreeRef.current) setTreeInput(inputTreeRef.current.value);
        if (inputSumRef.current) setTargetSum(parseInt(inputSumRef.current.value, 10) || 0);
    };

    // Canvas State
    const [viewState, setViewState] = useState({ x: CANVAS_WIDTH / 2, y: 0, scale: 1 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const handleMouseDown = (e) => {
        setIsDragging(true);
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

    const handleMouseUp = () => setIsDragging(false);

    const handleWheel = (e) => {
        const scaleIntensity = 0.001;
        const newScale = Math.min(Math.max(0.5, viewState.scale + e.deltaY * -scaleIntensity), 3);
        setViewState(prev => ({ ...prev, scale: newScale }));
    };

    // Algorithm
    const steps = useMemo(() => {
        if (!treeRoot) return [];
        const recordedSteps = [];
        let foundPath = null;

        const record = (data) => {
            recordedSteps.push(JSON.parse(JSON.stringify(data)));
        };

        const dfs = (node, currentSum, path) => {
            if (!node) return false;
            if (foundPath) return true; // Stop if already found

            // 1. Visit
            const newSum = currentSum + node.val;
            const newPath = [...path, node.id];

            record({
                nodeId: node.id,
                currentSum: newSum,
                path: newPath,
                type: 'visit',
                description: `Visiting ${node.val}. Current Path Sum: ${newSum}`
            });

            // 2. Check Leaf
            if (!node.children[0] && !node.children[1]) {
                if (newSum === targetSum) {
                    foundPath = newPath;
                    record({
                        nodeId: node.id,
                        currentSum: newSum,
                        path: newPath,
                        type: 'found',
                        description: `Leaf node reached! Sum = ${newSum}. Target match!`
                    });
                    return true;
                } else {
                    record({
                        nodeId: node.id,
                        currentSum: newSum,
                        path: newPath,
                        type: 'backtrack',
                        description: `Leaf node reached! Sum = ${newSum}. Not target.`
                    });
                    return false;
                }
            }

            // 3. Recurse Left
            if (node.children[0]) {
                record({
                    nodeId: node.id,
                    activeEdge: `${node.id}-${node.children[0].id}`,
                    currentSum: newSum,
                    path: newPath,
                    type: 'traverse',
                    description: `Going left to ${node.children[0].val}`
                });
                if (dfs(node.children[0], newSum, newPath)) return true;

                // Return to node visual
                record({
                    nodeId: node.id,
                    activeEdge: `${node.id}-${node.children[0].id}`,
                    currentSum: newSum,
                    path: newPath,
                    type: 'return',
                    description: `Backtracked to ${node.val}`
                });
            }

            // 4. Recurse Right
            if (node.children[1]) {
                record({
                    nodeId: node.id,
                    activeEdge: `${node.id}-${node.children[1].id}`,
                    currentSum: newSum,
                    path: newPath,
                    type: 'traverse',
                    description: `Going right to ${node.children[1].val}`
                });
                if (dfs(node.children[1], newSum, newPath)) return true;

                // Return to node visual
                record({
                    nodeId: node.id,
                    activeEdge: `${node.id}-${node.children[1].id}`,
                    currentSum: newSum,
                    path: newPath,
                    type: 'return',
                    description: `Backtracked to ${node.val}`
                });
            }

            return false;
        };

        record({ type: 'start', description: `Starting DFS to find path with sum ${targetSum}...` });
        const found = dfs(treeRoot, 0, []);
        record({
            type: 'finish',
            description: found ? `Path Found!` : `No path with sum ${targetSum} exists.`,
            found
        });

        return recordedSteps;
    }, [treeRoot, targetSum]);

    // Timer
    useEffect(() => {
        if (isPlaying) {
            timerRef.current = setInterval(() => {
                setCurrentStep((prev) => {
                    if (prev < steps.length - 1) return prev + 1;
                    setIsPlaying(false);
                    return prev;
                });
            }, 1000 / speed);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [isPlaying, steps.length, speed]);

    const currentData = steps[currentStep] || (steps.length > 0 ? steps[0] : {});
    const allNodes = useMemo(() => getNodes(treeRoot), [treeRoot]);
    const allLinks = useMemo(() => getLinks(treeRoot), [treeRoot]);

    const getNodeState = (id) => {
        if (!currentData || !currentData.path) return 'default';

        // If found, highlight the successful path
        if (currentData.found && currentData.path) {
            // We can maybe pass the found path in the finish step, or just assume the last path in state is good?
            // Actually, the last step 'finish' might not have the path array if I didn't pass it.
            // Let's rely on the fact that if Found, the last 'found' step had the path.
            // For simplicity, let's just use the current path if type is found.
            // OR, if the algorithm finished and found is true, we should highlight the path.
        }

        const isPathNode = currentData.path.includes(id);
        const isCurrent = currentData.nodeId === id;

        if (currentData.type === 'found' && isPathNode) return 'success';
        if (currentData.type === 'finish' && currentData.found) {
            // Ideally we want to keep the success state visible
            // But 'finish' step might not have 'path'
            // We'll fix this by adding path to finish step or looking back
            return 'default';
        }

        if (isCurrent) return 'visiting';
        if (isPathNode) return 'path';

        return 'default';
    };

    const getLinkState = (link) => {
        if (!currentData || !currentData.path) return 'default';

        // Check if link connects two nodes in the current path
        const { sourceId, targetId } = link;
        const sourceIndex = currentData.path.indexOf(sourceId);
        const targetIndex = currentData.path.indexOf(targetId);

        const isPathEdge = sourceIndex !== -1 && targetIndex !== -1 && Math.abs(sourceIndex - targetIndex) === 1;

        if (currentData.type === 'found' && isPathEdge) return 'success';
        if (currentData.activeEdge === link.id) return 'active';
        if (isPathEdge) return 'path';

        return 'default';
    };

    return (
        <div className="viz-container flex h-full w-full">
            <ResizablePanelGroup direction="horizontal" className="h-full w-full">
                <ResizablePanel defaultSize={25} minSize={20} maxSize={50} className="bg-background">
                    <Card className="viz-sidebar flex flex-col h-full rounded-none border-0 border-r-0 bg-background">
                        <CardHeader className="border-b border-border pb-4">
                            <CardTitle className="text-lg">Path Sum</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto space-y-6 pt-6">
                            <ProblemInfo problem={problem} />

                            {/* Controls */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase">Tree (BFS)</label>
                                    <div className="flex gap-2">
                                        <Input
                                            ref={inputTreeRef}
                                            defaultValue={treeInput}
                                            className="font-mono text-xs"
                                            placeholder="[5,4,8,11,null,13,4,7,2,null,null,null,1]"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase">Target Sum</label>
                                    <div className="flex gap-2">
                                        <Input
                                            ref={inputSumRef}
                                            defaultValue={targetSum}
                                            type="number"
                                            className="font-mono text-xs"
                                        />
                                        <Button onClick={submitConfig} size="icon" variant="outline">
                                            <RefreshCw className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Trace */}
                            <div className="rounded-lg bg-muted/50 border border-border p-4">
                                <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Algorithm Trace</h3>
                                <div className="text-sm font-mono text-balance text-foreground">
                                    {currentData?.description || "Ready to start"}
                                </div>
                            </div>

                            {/* Current Sum Display */}
                            <motion.div
                                className="p-4 rounded-lg bg-secondary border border-border"
                                animate={{ scale: currentData?.type === 'visit' ? 1.05 : 1 }}
                            >
                                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                                    Current Path Sum
                                </div>
                                <div className={cn(
                                    "text-3xl font-bold font-mono transition-colors",
                                    currentData?.currentSum === targetSum ? "text-green-500" : (currentData?.currentSum > targetSum ? "text-red-400" : "text-primary")
                                )}>
                                    {currentData?.currentSum ?? 0} <span className="text-base text-muted-foreground">/ {targetSum}</span>
                                </div>
                            </motion.div>

                        </CardContent>
                    </Card>
                </ResizablePanel>

                <ResizableHandle withHandle />

                <ResizablePanel defaultSize={75}>
                    <div className="viz-main flex-1 flex flex-col relative h-full">
                        <div className="viz-canvas-area bg-zinc-50 dark:bg-zinc-950/50">
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
                                    <pattern id="grid-pattern" width={24 * viewState.scale} height={24 * viewState.scale} patternUnits="userSpaceOnUse" patternTransform={`translate(${viewState.x}, ${viewState.y})`}>
                                        <circle cx={1 * viewState.scale} cy={1 * viewState.scale} r={1 * viewState.scale} className="fill-neutral-400/30 dark:fill-neutral-600/30" />
                                    </pattern>
                                </defs>
                                <rect width="100%" height="100%" fill="url(#grid-pattern)" />

                                <g transform={`translate(${viewState.x}, ${viewState.y}) scale(${viewState.scale})`}>
                                    {allLinks.map((link) => (
                                        <line
                                            key={link.id}
                                            x1={link.source.x} y1={link.source.y}
                                            x2={link.target.x} y2={link.target.y}
                                            className={cn(
                                                "transition-all duration-500",
                                                getLinkState(link) === 'active' && "stroke-yellow-500 stroke-[4px] tree-link-dash",
                                                getLinkState(link) === 'success' && "stroke-green-500 stroke-[5px]",
                                                getLinkState(link) === 'path' && "stroke-blue-500 stroke-[3px]",
                                                getLinkState(link) === 'default' && "stroke-border stroke-2"
                                            )}
                                        />
                                    ))}
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
                                                            (state === 'visiting' ? '#f59e0b' :
                                                                (state === 'path' ? '#3b82f6' :
                                                                    (isDarkMode ? '#0a0a0a' : '#ffffff'))),
                                                        stroke: state === 'success' ? '#22c55e' :
                                                            (state === 'visiting' ? '#f59e0b' :
                                                                (state === 'path' ? '#3b82f6' :
                                                                    (isDarkMode ? '#ffffff' : '#000000'))),
                                                        strokeWidth: state === 'default' ? 2 : 3
                                                    }}
                                                />
                                                <motion.text
                                                    className={cn("text-sm pointer-events-none select-none font-bold")}
                                                    dy="1" textAnchor="middle" dominantBaseline="middle"
                                                    animate={{ fill: (state === 'visiting' || state === 'path' || state === 'success') ? '#ffffff' : (isDarkMode ? '#ffffff' : '#000000') }}
                                                >
                                                    {node.val}
                                                </motion.text>
                                            </g>
                                        );
                                    })}
                                </g>
                            </svg>
                        </div>
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

export default PathSum;
