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
import './MinimumSizeSubarraySum.css';

const MinimumSizeSubarraySum = ({ problem }) => {
    // Inputs
    const [arrayInput, setArrayInput] = useState("[2,3,1,2,4,3]");
    const [targetInput, setTargetInput] = useState("7");

    // State
    const [nums, setNums] = useState([2, 3, 1, 2, 4, 3]);
    const [target, setTarget] = useState(7);

    // Playback
    const [currentStep, setCurrentStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(1);
    const timerRef = useRef(null);

    // Refs
    const arrayRef = useRef(null);
    const targetRef = useRef(null);

    const handleUpdate = () => {
        try {
            const arr = JSON.parse(arrayRef.current.value);
            const t = parseInt(targetRef.current.value);

            if (Array.isArray(arr) && !isNaN(t)) {
                setNums(arr);
                setTarget(t);
                setArrayInput(arrayRef.current.value);
                setTargetInput(targetRef.current.value);
                setCurrentStep(0);
                setIsPlaying(false);
            }
        } catch (e) {
            console.error("Invalid input");
        }
    };

    // Algorithm Trace
    const steps = useMemo(() => {
        const trace = [];
        const record = (type, data) => trace.push({ type, left, right, sum, minLen, ...data });

        let left = 0;
        let right = 0;
        let sum = 0;
        let minLen = Infinity;
        const n = nums.length;

        record('start', {
            description: `Starting Sliding Window. Target: ${target}.`,
            sum: 0,
            left: 0,
            right: -1,
            minLen: Infinity
        });

        for (right = 0; right < n; right++) {
            sum += nums[right];
            record('expand', {
                description: `Expand Right to index ${right} (Value: ${nums[right]}). New Sum: ${sum}.`,
                sum,
                left,
                right,
                minLen
            });

            while (sum >= target) {
                const currentLen = right - left + 1;
                const newMin = Math.min(minLen, currentLen);
                const updated = newMin < minLen;
                minLen = newMin;

                record('valid', {
                    description: `Sum ${sum} >= Target ${target}. Window [${left}, ${right}] is valid (Length: ${currentLen}). ${updated ? "New Minimum Found!" : ""}`,
                    sum,
                    left,
                    right,
                    minLen,
                    isValid: true
                });

                sum -= nums[left];
                left++;

                record('shrink', {
                    description: `Shrink Left to index ${left} to try finding smaller window. New Sum: ${sum}.`,
                    sum,
                    left,
                    right,
                    minLen
                });
            }
        }

        record('finish', {
            description: `Finished. Minimum Length is ${minLen === Infinity ? 0 : minLen}.`,
            sum,
            left,
            right: n - 1,
            minLen: minLen === Infinity ? 0 : minLen
        });

        return trace;
    }, [nums, target]);

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

    const currentData = steps[currentStep] || {};

    return (
        <div className="flex h-full w-full">
            <ResizablePanelGroup direction="horizontal" className="h-full w-full">
                {/* Sidebar */}
                <ResizablePanel defaultSize={25} minSize={20} maxSize={50} className="bg-background">
                    <Card className="viz-sidebar flex flex-col h-full rounded-none border-0 border-r-0 bg-background">
                        <CardHeader className="border-b border-border pb-4">
                            <CardTitle className="text-lg">Min Size Subarray Sum</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto space-y-6 pt-6">
                            <ProblemInfo problem={problem} />

                            {/* Controls */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground">Array (Positive Integers)</label>
                                    <Input ref={arrayRef} defaultValue={arrayInput} className="font-mono text-xs" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground">Target Sum</label>
                                    <Input ref={targetRef} defaultValue={targetInput} className="font-mono text-xs" />
                                </div>
                                <Button onClick={handleUpdate} className="w-full" variant="outline">
                                    <RefreshCw className="h-4 w-4 mr-2" /> Update
                                </Button>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-2">
                                <div className="p-3 bg-muted/50 rounded-lg border border-border">
                                    <div className="text-xs text-muted-foreground uppercase mb-1">Current Sum</div>
                                    <div className={cn("text-2xl font-mono font-bold", currentData.isValid ? "text-green-500" : "text-foreground")}>
                                        {currentData.sum ?? 0}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground">Target: {target}</div>
                                </div>
                                <div className="p-3 bg-muted/50 rounded-lg border border-border">
                                    <div className="text-xs text-muted-foreground uppercase mb-1">Min Length</div>
                                    <div className="text-2xl font-mono font-bold text-primary">
                                        {currentData.minLen === Infinity ? '∞' : currentData.minLen}
                                    </div>
                                </div>
                            </div>

                            {/* Status */}
                            <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-4">
                                <h3 className="text-xs font-semibold uppercase text-blue-500 mb-2">Algorithm Step</h3>
                                <div className="text-sm text-foreground">
                                    {currentData.description || "Ready"}
                                </div>
                            </div>

                        </CardContent>
                    </Card>
                </ResizablePanel>

                <ResizableHandle withHandle />

                {/* Main Visualization */}
                <ResizablePanel defaultSize={75}>
                    <div className="flex-1 flex flex-col h-full">
                        <div className="flex-1 flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950/50 relative overflow-hidden">

                            <div className="array-container">
                                {nums.map((val, idx) => {
                                    // Logic for highlighting
                                    // Window is [left, right] (inclusive IF right >= left)
                                    // However, in our steps logic:
                                    // 'expand': right is the new index included.
                                    // 'shrink': left has been incremented (excluded).
                                    // Standard window: [currentData.left, currentData.right]

                                    const inWindow = idx >= (currentData.left ?? 0) && idx <= (currentData.right ?? -1);

                                    return (
                                        <div
                                            key={idx}
                                            className={cn(
                                                "array-box",
                                                inWindow && "in-window",
                                                inWindow && currentData.isValid && "valid-window"
                                            )}
                                        >
                                            <span className="box-index">{idx}</span>
                                            {val}

                                            {/* Pointers */}
                                            {currentData.left === idx && (
                                                <div className="pointer-container pointer-left">
                                                    <div className="pointer-arrow" />
                                                    <span className="pointer-label">L</span>
                                                </div>
                                            )}
                                            {currentData.right === idx && (
                                                <div className="pointer-container pointer-right">
                                                    <div className="pointer-arrow" />
                                                    <span className="pointer-label">R</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
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

export default MinimumSizeSubarraySum;
