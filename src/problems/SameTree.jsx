import React, { useState, useEffect, useMemo, useRef } from 'react';
import { RefreshCw, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '../components/ui/resizable';
import ProblemInfo from '../components/ProblemInfo';
import ReplayControl from '../components/ReplayControl';
import { cn } from '../lib/utils';
import './SameTree.css';

// Constants
const CANVAS_WIDTH = 800;
const NODE_RADIUS = 20;
const Y_STRIDE = 70;

// Reusing Tree Helpers
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

// Assign coordinates with an X-offset
const assignCoordinates = (node, x, y, level, maxDepth, xOffset = 0, idPrefix = 'p') => {
    if (!node) return;

    // Create view-specific properties without mutating the raw structure too much, 
    // or just mutate it directly but add the prefix to ID to distinguish P and Q nodes.
    node.viewId = `${idPrefix}-${node.id}`;
    node.x = x + xOffset;
    node.y = y;

    if (!node.children) node.children = [];

    // Width logic
    const X_UNIT = 40;
    const exponent = Math.max(0, maxDepth - level - 2);
    const offset = Math.pow(2, exponent) * X_UNIT;

    if (node.children[0]) assignCoordinates(node.children[0], x - offset, y + Y_STRIDE, level + 1, maxDepth, xOffset, idPrefix);
    if (node.children[1]) assignCoordinates(node.children[1], x + offset, y + Y_STRIDE, level + 1, maxDepth, xOffset, idPrefix);
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

const SameTree = ({ problem, isDarkMode }) => {
    const [inputP, setInputP] = useState("[1,2,3]");
    const [inputQ, setInputQ] = useState("[1,2,3]");

    // Roots
    const [rootP, setRootP] = useState(null);
    const [rootQ, setRootQ] = useState(null);

    const [speed, setSpeed] = useState(1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const timerRef = useRef(null);

    // Canvas
    const [viewState, setViewState] = useState({ x: CANVAS_WIDTH / 2, y: 50, scale: 0.9 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // Inputs refs
    const pRef = useRef(null);
    const qRef = useRef(null);

    const handleUpdateTrees = () => {
        if (pRef.current) setInputP(pRef.current.value);
        if (qRef.current) setInputQ(qRef.current.value);
        setCurrentStep(0);
        setIsPlaying(false);
    };

    // Parse and Layout
    useEffect(() => {
        const rP = parseTreeArray(inputP);
        const rQ = parseTreeArray(inputQ);

        // Layout P on Top/Left, Q on Top/Right? Or Stacked?
        // Side-by-side seems best.
        // Let's put P at x = -200, Q at x = +200 relative to center.

        const depthP = getTreeDepth(rP);
        const depthQ = getTreeDepth(rQ);
        const maxDepth = Math.max(depthP, depthQ);

        // Dynamic Spacing based on depth? 
        // A deep tree gets wide. If depth is 5, width is ~ 2^3 * 40 * 2 ~ 640px.
        // Let's just use fixed offset for now, user can pan.
        const OFFSET = 250;

        assignCoordinates(rP, -OFFSET, 0, 0, maxDepth, 0, 'p');
        assignCoordinates(rQ, OFFSET, 0, 0, maxDepth, 0, 'q');

        setRootP(rP);
        setRootQ(rQ);
    }, [inputP, inputQ]);

    // Algo Trace
    const steps = useMemo(() => {
        if (!rootP && !rootQ) return [];

        const recorded = [];
        const record = (type, args) => recorded.push({ type, ...args });

        const check = (p, q) => {
            // Highlight current comparison
            record('compare', {
                pId: p ? p.viewId : null,
                qId: q ? q.viewId : null,
                pVal: p ? p.val : 'null',
                qVal: q ? q.val : 'null',
                description: `Comparing Node P (${p ? p.val : 'null'}) with Node Q (${q ? q.val : 'null'})`
            });

            if (!p && !q) {
                record('match-null', { description: "Both are null. Match." });
                return true;
            }
            if (!p || !q || p.val !== q.val) {
                record('mismatch', {
                    pId: p ? p.viewId : null,
                    qId: q ? q.viewId : null,
                    description: "Values do not match! Trees are not the same."
                });
                return false;
            }

            // If match, continue
            record('match', {
                pId: p.viewId,
                qId: q.viewId,
                description: "Values match. Checking children..."
            });

            const leftSame = check(p.children[0], q.children[0]);
            if (!leftSame) return false;

            const rightSame = check(p.children[1], q.children[1]);
            return rightSame;
        };

        record('start', { description: "Starting comparison..." });
        const result = check(rootP, rootQ);
        record('finish', {
            result,
            description: result ? "Success! Trees are identical." : "Finished. Trees are different."
        });

        return recorded;
    }, [rootP, rootQ]);

    // Playback
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

    // Derived Visuals
    const currentData = steps[currentStep] || {};
    const allNodesP = useMemo(() => flattenTree(rootP), [rootP]);
    const allNodesQ = useMemo(() => flattenTree(rootQ), [rootQ]);
    const allLinksP = useMemo(() => getLinks(rootP), [rootP]);
    const allLinksQ = useMemo(() => getLinks(rootQ), [rootQ]);

    // Canvas events
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

    const getNodeState = (nodeId) => {
        if (!currentData.type) return 'default';
        const { pId, qId } = currentData;

        if (nodeId === pId || nodeId === qId) {
            if (currentData.type === 'compare') return 'comparing';
            if (currentData.type === 'match') return 'match';
            if (currentData.type === 'mismatch') return 'mismatch';
        }
        return 'default';
    };

    return (
        <div className="viz-container flex h-full w-full">
            <ResizablePanelGroup direction="horizontal" className="h-full w-full">
                <ResizablePanel defaultSize={25} minSize={20} maxSize={50} className="bg-background">
                    <Card className="viz-sidebar flex flex-col h-full rounded-none border-0 border-r-0 bg-background">
                        <CardHeader className="border-b border-border pb-4">
                            <CardTitle className="text-lg">Same Tree</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto space-y-6 pt-6">
                            <ProblemInfo problem={problem} />

                            <div className="rounded-lg bg-muted/50 border border-border p-4">
                                <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Status</h3>
                                <div className={cn("text-sm font-mono",
                                    currentData.type === 'mismatch' ? "text-red-500 font-bold" :
                                        currentData.type === 'finish' && currentData.result ? "text-green-500 font-bold" :
                                            "text-foreground"
                                )}>
                                    {currentData.description || "Ready"}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground">Tree P (Array)</label>
                                    <Input ref={pRef} defaultValue={inputP} className="font-mono text-xs" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground">Tree Q (Array)</label>
                                    <Input ref={qRef} defaultValue={inputQ} className="font-mono text-xs" />
                                </div>
                                <Button onClick={handleUpdateTrees} className="w-full" variant="outline">
                                    <RefreshCw className="h-4 w-4 mr-2" /> Update Trees
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
                                    <pattern id="grid-pattern-st" width={24 * viewState.scale} height={24 * viewState.scale} patternUnits="userSpaceOnUse" patternTransform={`translate(${viewState.x}, ${viewState.y})`}>
                                        <circle cx={1} cy={1} r={1} className="fill-neutral-400/30 dark:fill-neutral-600/30" />
                                    </pattern>
                                </defs>
                                <rect width="100%" height="100%" fill="url(#grid-pattern-st)" />

                                <g transform={`translate(${viewState.x}, ${viewState.y}) scale(${viewState.scale})`}>

                                    {/* Labels for Trees */}
                                    <text x={-250} y={-50} textAnchor="middle" className="text-lg font-bold fill-muted-foreground opacity-50">Tree P</text>
                                    <text x={250} y={-50} textAnchor="middle" className="text-lg font-bold fill-muted-foreground opacity-50">Tree Q</text>

                                    {/* Links */}
                                    {[...allLinksP, ...allLinksQ].map(link => (
                                        <line
                                            key={link.id}
                                            x1={link.source.x} y1={link.source.y}
                                            x2={link.target.x} y2={link.target.y}
                                            className="stroke-border stroke-2"
                                        />
                                    ))}

                                    {/* Nodes */}
                                    {[...allNodesP, ...allNodesQ].map(node => {
                                        const state = getNodeState(node.viewId);
                                        return (
                                            <g key={node.viewId} transform={`translate(${node.x}, ${node.y})`}>
                                                <motion.circle
                                                    r={NODE_RADIUS}
                                                    animate={{
                                                        fill: state === 'comparing' ? '#f59e0b' : // yellow
                                                            state === 'match' ? '#22c55e' : // green
                                                                state === 'mismatch' ? '#ef4444' : // red
                                                                    (isDarkMode ? '#000' : '#fff'),
                                                        stroke: state !== 'default' ? 'transparent' : (isDarkMode ? '#fff' : '#000'),
                                                        scale: state !== 'default' ? 1.2 : 1
                                                    }}
                                                    className="stroke-2"
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

export default SameTree;
