import React, { useState, useEffect, useMemo, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import ReplayControl from '../components/ReplayControl';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { cn } from '../lib/utils';
import './ThreeSumClosest.css';
import ProblemInfo from '../components/ProblemInfo';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '../components/ui/resizable';

const ThreeSumClosest = ({ problem }) => {
    const [inputStr, setInputStr] = useState("[-1, 2, 1, -4]");
    const [targetStr, setTargetStr] = useState("1");
    const [nums, setNums] = useState([-1, 2, 1, -4]);
    const [target, setTarget] = useState(1);

    // Playback state
    const [currentStep, setCurrentStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(1);
    const timerRef = useRef(null);

    const inputRef = useRef(null);
    const targetRef = useRef(null);

    const parseInput = () => {
        try {
            const arr = JSON.parse(inputRef.current.value);
            const tgt = parseInt(targetRef.current.value);

            if (!Array.isArray(arr)) {
                alert("Nums must be a valid JSON array.");
                return;
            }
            if (isNaN(tgt)) {
                alert("Target must be a valid integer.");
                return;
            }

            setNums(arr);
            setTarget(tgt);
            setInputStr(inputRef.current.value);
            setTargetStr(targetRef.current.value);
            setCurrentStep(0);
            setIsPlaying(false);
        } catch (e) {
            alert("Invalid input format.");
        }
    };

    const steps = useMemo(() => {
        const recordedSteps = [];
        const sortedNums = [...nums].sort((a, b) => a - b);
        let closestSum = Infinity;

        // Initial closest sum initialization
        if (sortedNums.length >= 3) {
            closestSum = sortedNums[0] + sortedNums[1] + sortedNums[2];
        }

        const record = (type, data) => {
            recordedSteps.push({
                type,
                nums: [...sortedNums],
                closestSum,
                target,
                ...data
            });
        };

        record('start', {
            description: "Sort the array and initialize closestSum.",
            i: null, left: null, right: null
        });

        for (let i = 0; i < sortedNums.length - 2; i++) {
            // Optional optimization: skip duplicate i
            if (i > 0 && sortedNums[i] === sortedNums[i - 1]) continue;

            let l = i + 1;
            let r = sortedNums.length - 1;

            record('new_i', {
                description: `Fixing i at index ${i} (val: ${sortedNums[i]}). Setting pointers L=${l}, R=${r}.`,
                i, left: l, right: r,
                currentSum: null
            });

            while (l < r) {
                const sum = sortedNums[i] + sortedNums[l] + sortedNums[r];
                const absDiff = Math.abs(sum - target);
                const currentClosestDiff = Math.abs(closestSum - target);

                let isNewClosest = false;
                if (absDiff < currentClosestDiff) {
                    closestSum = sum;
                    isNewClosest = true;
                }

                record('check', {
                    description: `Sum: ${sortedNums[i]} + ${sortedNums[l]} + ${sortedNums[r]} = ${sum}. Target: ${target}. Diff: ${absDiff}. ${isNewClosest ? 'New closest sum found!' : 'Not closer than current best.'}`,
                    i, left: l, right: r,
                    currentSum: sum,
                    isNewClosest
                });

                if (sum === target) {
                    record('found_exact', {
                        description: `Sum ${sum} equals target exactly! Returning ${sum}.`,
                        i, left: l, right: r,
                        currentSum: sum,
                        isNewClosest
                    });
                    // In a real function we'd return here, but for viz we can either break or continue. 
                    // Let's break to simulate return.
                    return recordedSteps;
                }

                if (sum < target) {
                    record('move_left', {
                        description: `Sum ${sum} < target ${target}. Increment Left pointer to increase sum.`,
                        i, left: l, right: r, // Show old pos
                        currentSum: sum
                    });
                    l++;
                } else {
                    record('move_right', {
                        description: `Sum ${sum} > target ${target}. Decrement Right pointer to decrease sum.`,
                        i, left: l, right: r, // Show old pos
                        currentSum: sum
                    });
                    r--;
                }
            }
        }

        record('finish', {
            description: `Finished scanning. Closest sum is ${closestSum}.`,
            i: null, left: null, right: null,
            currentSum: null
        });

        return recordedSteps;
    }, [nums, target]);

    useEffect(() => {
        if (isPlaying) {
            timerRef.current = setInterval(() => {
                setCurrentStep((prev) => {
                    if (prev < steps.length - 1) return prev + 1;
                    setIsPlaying(false);
                    return prev;
                });
            }, 1000 / speed);
        }
        return () => clearInterval(timerRef.current);
    }, [isPlaying, steps.length, speed]);

    const currentData = steps[currentStep] || (steps.length > 0 ? steps[0] : {});

    return (
        <div className="flex h-full w-full">
            <ResizablePanelGroup direction="horizontal" className="h-full w-full">
                <ResizablePanel defaultSize={25} minSize={20} maxSize={50} className="bg-background">
                    <Card className="viz-sidebar flex flex-col h-full rounded-none border-0 border-r-0 bg-background">
                        <CardHeader className="border-b border-border pb-4">
                            <CardTitle className="text-lg">3Sum Closest</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto space-y-6 pt-6">
                            <ProblemInfo problem={problem} />

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground block mb-2">Nums Array</label>
                                    <Input
                                        ref={inputRef}
                                        defaultValue={inputStr}
                                        className="font-mono text-xs"
                                        placeholder="[-1, 2, 1, -4]"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground block mb-2">Target</label>
                                    <div className="flex gap-2">
                                        <Input
                                            ref={targetRef}
                                            defaultValue={targetStr}
                                            className="font-mono text-xs"
                                            placeholder="1"
                                            type="number"
                                        />
                                        <Button onClick={parseInput} size="icon" variant="outline">
                                            <RefreshCw className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="text-sm text-balance text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border">
                                {currentData?.description || "Ready to start"}
                            </div>

                        </CardContent>
                    </Card>
                </ResizablePanel>

                <ResizableHandle withHandle />

                <ResizablePanel defaultSize={75}>
                    <div className="flex-1 flex flex-col relative h-full">
                        <div className="flex-1 flex flex-col items-center justify-start p-8 overflow-y-auto three-sum-closest-container h-full">

                            {/* Stats Display */}
                            <div className="stats-grid mb-8">
                                <div className="stat-box">
                                    <span className="stat-label">Target</span>
                                    <span className="stat-value">{target}</span>
                                </div>
                                <div className="stat-box">
                                    <span className="stat-label">Closest Sum</span>
                                    <span className={cn(
                                        "stat-value",
                                        currentData.isNewClosest && "highlight",
                                        Math.abs(currentData.closestSum - target) === 0 && "text-green-500"
                                    )}>
                                        {currentData.closestSum === Infinity ? '-' : currentData.closestSum}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        Diff: {currentData.closestSum === Infinity ? '-' : Math.abs(currentData.closestSum - target)}
                                    </span>
                                </div>
                            </div>

                            {/* Current Sum Display */}
                            {currentData.currentSum !== undefined && currentData.currentSum !== null && (
                                <div className="mb-8 p-4 rounded-lg bg-secondary/50 border border-border min-w-[300px] text-center">
                                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Current Iteration Sum</div>
                                    <div className="font-mono text-2xl font-bold">
                                        {currentData.currentSum}
                                    </div>
                                    <div className="text-sm text-muted-foreground mt-1">
                                        Diff: {Math.abs(currentData.currentSum - target)}
                                    </div>
                                </div>
                            )}

                            {/* Array Visualization */}
                            <div className="array-container">
                                {currentData.nums && currentData.nums.map((val, idx) => {
                                    const isI = idx === currentData.i;
                                    const isLeft = idx === currentData.left;
                                    const isRight = idx === currentData.right;

                                    // Highlight if it's the new closest combo, or just part of current calculation
                                    const isActive = isI || isLeft || isRight;

                                    return (
                                        <div key={idx} className={cn(
                                            "array-item",
                                            isI && "current-i",
                                            isLeft && "pointer-left",
                                            isRight && "pointer-right",
                                            isActive && currentData.isNewClosest && "closest-combo"
                                        )}>
                                            {val}
                                            <span className="array-index">{idx}</span>
                                            {isI && <span className="pointer-label text-primary">i</span>}
                                            {isLeft && <span className="pointer-label">L</span>}
                                            {isRight && <span className="pointer-label">R</span>}
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
                        />

                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
};

export default ThreeSumClosest;
