import React, { useState, useEffect, useMemo, useRef } from 'react';
import { RefreshCw, Play, Pause, RotateCcw, ChevronRight, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '../components/ui/resizable';
import ProblemInfo from '../components/ProblemInfo';
import ReplayControl from '../components/ReplayControl';
import { cn } from '../lib/utils';
import './ConvertSortedListToBST.css';

// Layout Constants
const CANVAS_WIDTH = 800;
const NODE_RADIUS = 24;
const Y_GAP = 80;

const parseArrayInput = (str) => {
    try {
        const cleaned = str.replace(/[\[\]\s]/g, '');
        if (!cleaned) return [];
        return cleaned.split(',').map(Number).sort((a, b) => a - b);
    } catch {
        return [];
    }
};

// Tree Helper to pre-calculate layout
const calculateTreeLayout = (nums, x, y, level, w) => {
    if (!nums.length) return null;

    const mid = Math.floor(nums.length / 2);
    const node = {
        id: `node-${nums[mid]}-${level}-${x}`, // Unique ID
        val: nums[mid],
        x,
        y,
        children: []
    };

    const nextWidth = w / 2;

    // Left
    if (mid > 0) {
        const leftNums = nums.slice(0, mid);
        node.children[0] = calculateTreeLayout(leftNums, x - nextWidth, y + Y_GAP, level + 1, nextWidth);
        if (node.children[0]) node.children[0].parentId = node.id;
    }

    // Right
    if (mid < nums.length - 1) {
        const rightNums = nums.slice(mid + 1);
        node.children[1] = calculateTreeLayout(rightNums, x + nextWidth, y + Y_GAP, level + 1, nextWidth);
        if (node.children[1]) node.children[1].parentId = node.id;
    }

    return node;
};

// Flatten for rendering
const getAllNodes = (root, nodes = []) => {
    if (!root) return nodes;
    nodes.push(root);
    if (root.children[0]) getAllNodes(root.children[0], nodes);
    if (root.children[1]) getAllNodes(root.children[1], nodes);
    return nodes;
};

const getAllLinks = (root, links = []) => {
    if (!root) return links;
    if (root.children[0]) {
        links.push({
            id: `${root.id}-${root.children[0].id}`,
            source: root,
            target: root.children[0]
        });
        getAllLinks(root.children[0], links);
    }
    if (root.children[1]) {
        links.push({
            id: `${root.id}-${root.children[1].id}`,
            source: root,
            target: root.children[1]
        });
        getAllLinks(root.children[1], links);
    }
    return links;
};

const ConvertSortedListToBST = ({ problem, isDarkMode }) => {
    const [arrayInput, setArrayInput] = useState("[-10,-3,0,5,9]");
    const [nums, setNums] = useState([-10, -3, 0, 5, 9]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [speed, setSpeed] = useState(1);
    const inputRef = useRef(null);
    const timerRef = useRef(null);

    // Canvas panning/zooming
    const [viewState, setViewState] = useState({ x: CANVAS_WIDTH / 2, y: 50, scale: 1 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleInputSubmit();
        }
    };

    const handleInputSubmit = () => {
        if (inputRef.current) {
            const val = inputRef.current.value;
            setArrayInput(val);
            const parsed = parseArrayInput(val);
            setNums(parsed);
            setCurrentStep(0);
            setIsPlaying(false);
        }
    };

    // Generate Steps
    const steps = useMemo(() => {
        const recordedSteps = [];

        // Helper to record step
        const record = (type, info) => {
            recordedSteps.push({
                type,
                ...info
            });
        };

        // Recursive Algo
        const solve = (arr, left, right, parentId = null, isLeft = false) => {
            if (left > right) return null;

            const mid = Math.floor((left + right) / 2);
            const val = arr[mid];

            // Step: Focus on range
            record('focus', {
                range: [left, right],
                midIndex: mid,
                description: `Processing range [${left}, ${right}]. Middle element at index ${mid} is ${val}.`
            });

            // Create Node (we need to know what the node ID *will* be to match the pre-calculated layout)
            // But getting the exact ID is tricky without re-running the layout logic.
            // A simpler way: The 'val' is unique? No, duplicates possible.
            // We can match by value and level/position if we reconstruct the tree logic here?
            // BETTER: We can just store the 'created' nodes in the step. 
            // Let's use the 'nums' array as the source of truth for indices.

            const nodeId = `node-${val}`; // Simplified ID for logic, but we need to match the visual tree. 
            // Making IDs deterministic based on recursion path is safer.

            record('create', {
                range: [left, right],
                midIndex: mid,
                val: val,
                parentId: parentId,
                description: `Create new TreeNode(${val}).`
            });

            // Recurse Left
            // record('traverse', { description: `Recursively process left sub-list [${left}, ${mid-1}]` });
            solve(arr, left, mid - 1, mid, true);

            // Recurse Right
            // record('traverse', { description: `Recursively process right sub-list [${mid+1}, ${right}]` });
            solve(arr, mid + 1, right, mid, false);
        };

        record('start', { description: 'Starting conversion...' });
        solve(nums, 0, nums.length - 1);
        record('finish', { description: 'Tree construction complete!' });

        return recordedSteps;
    }, [nums]);

    // To link steps to visual nodes, we need the "Complete" tree first, 
    // and then we 'reveal' parts of it based on steps.
    // The recursive structure of 'solve' matches exactly the 'calculateTreeLayout'.
    // Let's correlate them by traversal order or value. 
    // Actually, 'calculateTreeLayout' is static. 
    // We can just iterate the static tree to find the node corresponding to the 'solve' step.

    // Let's attach a 'stepIndex' to the static tree nodes to know when they appear? 
    // Or just store the 'visible nodes' in the step state.

    // Refined Strategy:
    // The 'steps' array will contain a list of "Visible Node IDs".
    // When solve visits a node, we add that node's ID to the visible set.

    // We need to run the layout AND the solve simultaneously or correlate them.

    const { fullTreeNodes, fullTreeLinks, stepsWithVisibility } = useMemo(() => {
        // 1. Build full layout
        const root = calculateTreeLayout(nums, 0, 0, 0, 300);
        const allNodes = getAllNodes(root);
        const allLinks = getAllLinks(root);

        // 2. Map nodes by recursion path logic to identify them during solve
        // We can re-implement 'solve' to traverse the 'root' structure we just built.

        const finalSteps = [];
        const visibleNodeIds = new Set();
        const visibleLinkIds = new Set();

        const traverse = (node, left, right) => {
            if (!node) return;

            const mid = Math.floor((left + right) / 2);

            // Step 1: Higlight Range
            finalSteps.push({
                range: [left, right],
                midIndex: mid,
                visibleNodes: new Set(visibleNodeIds),
                visibleLinks: new Set(visibleLinkIds),
                activeNodeId: null,
                description: `Range [${left}, ${right}]. Middle: ${nums[mid]}.`
            });

            // Step 2: Create/Show Node
            visibleNodeIds.add(node.id);
            if (node.parentId) {
                // Find link
                // The link source is parent, target is node.
                const linkId = `${node.parentId}-${node.id}`;
                visibleLinkIds.add(linkId);
            }

            finalSteps.push({
                range: [left, right],
                midIndex: mid,
                visibleNodes: new Set(visibleNodeIds),
                visibleLinks: new Set(visibleLinkIds),
                activeNodeId: node.id,
                description: `Created node ${node.val}.`
            });

            // Recurse
            if (node.children[0]) traverse(node.children[0], left, mid - 1);
            if (node.children[1]) traverse(node.children[1], mid + 1, right);
        };

        if (root) {
            traverse(root, 0, nums.length - 1);
        }

        finalSteps.push({
            range: [-1, -1],
            midIndex: -1,
            visibleNodes: new Set(visibleNodeIds),
            visibleLinks: new Set(visibleLinkIds),
            activeNodeId: null,
            description: "Conversion Complete."
        });

        return { fullTreeNodes: allNodes, fullTreeLinks: allLinks, stepsWithVisibility: finalSteps };
    }, [nums]);

    const currentData = stepsWithVisibility[currentStep] || {};

    // Playback Effect
    useEffect(() => {
        if (isPlaying) {
            timerRef.current = setInterval(() => {
                setCurrentStep(prev => {
                    if (prev < stepsWithVisibility.length - 1) return prev + 1;
                    setIsPlaying(false);
                    return prev;
                });
            }, 1000 / speed);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [isPlaying, stepsWithVisibility.length, speed]);

    // Canvas interaction
    const handleMouseDown = (e) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - viewState.x, y: e.clientY - viewState.y });
    };
    const handleMouseMove = (e) => {
        if (isDragging) {
            setViewState(prev => ({ ...prev, x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }));
        }
    };
    const handleMouseUp = () => setIsDragging(false);
    const handleWheel = (e) => {
        const newScale = Math.min(Math.max(0.5, viewState.scale - e.deltaY * 0.001), 3);
        setViewState(prev => ({ ...prev, scale: newScale }));
    };

    return (
        <div className="viz-container flex h-full w-full">
            <ResizablePanelGroup direction="horizontal" className="h-full w-full">
                <ResizablePanel defaultSize={25} minSize={20} maxSize={50} className="bg-background">
                    <Card className="viz-sidebar flex flex-col h-full rounded-none border-0 border-r-0 bg-background">
                        <CardHeader className="border-b border-border pb-4">
                            <CardTitle className="text-lg">Sorted List to BST</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto space-y-6 pt-6">
                            <ProblemInfo problem={problem} />

                            {/* Controls */}
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-muted-foreground block">
                                    Input Array (Sorted)
                                </label>
                                <div className="flex gap-2">
                                    <Input
                                        ref={inputRef}
                                        defaultValue={arrayInput}
                                        onKeyDown={handleKeyDown}
                                        className="font-mono text-xs"
                                    />
                                    <Button onClick={handleInputSubmit} size="icon" variant="outline">
                                        <RefreshCw className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Trace */}
                            <div className="rounded-lg bg-muted/50 border border-border p-4">
                                <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Current Step</h3>
                                <div className="text-sm font-mono text-balance text-foreground min-h-[40px]">
                                    {currentData.description || "Ready"}
                                </div>
                            </div>

                            {/* List View */}
                            <div className="space-y-2">
                                <h3 className="text-xs font-semibold uppercase text-muted-foreground">List State</h3>
                                <div className="flex flex-wrap gap-1 p-2 bg-secondary/30 rounded border border-border">
                                    {nums.map((n, idx) => {
                                        const isInRange = currentData.range && idx >= currentData.range[0] && idx <= currentData.range[1];
                                        const isMid = idx === currentData.midIndex;
                                        return (
                                            <div key={idx} className={cn(
                                                "w-8 h-8 flex items-center justify-center text-xs font-bold rounded border transition-colors",
                                                isMid ? "bg-primary text-primary-foreground border-primary" :
                                                    isInRange ? "bg-blue-500/20 border-blue-500/50 text-foreground" :
                                                        "bg-background border-border text-muted-foreground opacity-50"
                                            )}>
                                                {n}
                                            </div>
                                        );
                                    })}
                                </div>
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
                                    <pattern id="grid-pattern" width={20 * viewState.scale} height={20 * viewState.scale} patternUnits="userSpaceOnUse" patternTransform={`translate(${viewState.x}, ${viewState.y})`}>
                                        <circle cx={1} cy={1} r={1} className="fill-neutral-400/30 dark:fill-neutral-600/30" />
                                    </pattern>
                                </defs>
                                <rect width="100%" height="100%" fill="url(#grid-pattern)" />

                                <g transform={`translate(${viewState.x}, ${viewState.y}) scale(${viewState.scale})`}>
                                    {/* Links */}
                                    {fullTreeLinks.map(link => {
                                        const isVisible = currentData.visibleLinks?.has(link.id);
                                        return (
                                            <line
                                                key={link.id}
                                                x1={link.source.x} y1={link.source.y}
                                                x2={link.target.x} y2={link.target.y}
                                                className={cn(
                                                    "transition-all duration-500",
                                                    isVisible ? "stroke-border stroke-2 opacity-100" : "stroke-border stroke-2 opacity-0"
                                                )}
                                            />
                                        );
                                    })}

                                    {/* Nodes */}
                                    {fullTreeNodes.map(node => {
                                        const isVisible = currentData.visibleNodes?.has(node.id);
                                        const isActive = currentData.activeNodeId === node.id;
                                        return (
                                            <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                                                <motion.circle
                                                    r={NODE_RADIUS}
                                                    initial={{ transform: "scale(0)" }}
                                                    animate={{
                                                        transform: isVisible ? "scale(1)" : "scale(0)",
                                                        fill: isActive ? "#3b82f6" : (isDarkMode ? "#000" : "#fff"),
                                                        stroke: isActive ? "#2563eb" : (isDarkMode ? "#fff" : "#000")
                                                    }}
                                                    className="fill-background stroke-foreground stroke-2"
                                                />
                                                <motion.text
                                                    dy="1"
                                                    textAnchor="middle"
                                                    dominantBaseline="middle"
                                                    className={cn(
                                                        "text-sm font-bold pointer-events-none select-none",
                                                        isActive ? "fill-white" : "fill-foreground"
                                                    )}
                                                    animate={{ opacity: isVisible ? 1 : 0 }}
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
                            totalSteps={stepsWithVisibility.length}
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

export default ConvertSortedListToBST;
