import React, { useState, useEffect, useMemo, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import ReplayControl from '../components/ReplayControl';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { cn } from '../lib/utils';
import './ThreeSum.css';
import ProblemInfo from '../components/ProblemInfo';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '../components/ui/resizable';

const ThreeSum = ({ problem }) => {
    const [inputStr, setInputStr] = useState("[-1, 0, 1, 2, -1, -4]");
    const [nums, setNums] = useState([-1, 0, 1, 2, -1, -4]);

    // Playback state
    const [currentStep, setCurrentStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(1);
    const timerRef = useRef(null);
    const inputRef = useRef(null);

    const parseInput = () => {
        try {
            const arr = JSON.parse(inputRef.current.value);
            if (!Array.isArray(arr)) {
                alert("Input must be a valid JSON array.");
                return;
            }
            setNums(arr);
            setInputStr(inputRef.current.value);
            setCurrentStep(0);
            setIsPlaying(false);
        } catch (e) {
            alert("Invalid JSON format. Please use [-1, 0, 1] format.");
        }
    };

    const steps = useMemo(() => {
        const recordedSteps = [];
        // Work on a sorted copy
        const sortedNums = [...nums].sort((a, b) => a - b);
        const triplets = [];

        const record = (type, data) => {
            recordedSteps.push({
                type,
                nums: [...sortedNums],
                triplets: [...triplets],
                ...data
            });
        };

        record('start', {
            description: "First, sort the array in ascending order.",
            i: null, left: null, right: null
        });

        for (let i = 0; i < sortedNums.length - 2; i++) {
            // Skip duplicates for i
            if (i > 0 && sortedNums[i] === sortedNums[i - 1]) {
                record('skip_i', {
                    description: `Skipping duplicate value ${sortedNums[i]} for index i.`,
                    i, left: null, right: null
                });
                continue;
            }

            let l = i + 1;
            let r = sortedNums.length - 1;

            record('new_i', {
                description: `Fixing i at index ${i} (val: ${sortedNums[i]}). Setting left = ${l}, right = ${r}. Target sum: ${-sortedNums[i]}`,
                i, left: l, right: r
            });

            while (l < r) {
                const sum = sortedNums[i] + sortedNums[l] + sortedNums[r];

                record('check', {
                    description: `Checking sum: ${sortedNums[i]} (i) + ${sortedNums[l]} (L) + ${sortedNums[r]} (R) = ${sum}`,
                    i, left: l, right: r, sum
                });

                if (sum < 0) {
                    record('move_left', {
                        description: `Sum ${sum} is too low. Move left pointer to the right to increase sum.`,
                        i, left: l, right: r, sum
                    });
                    l++;
                } else if (sum > 0) {
                    record('move_right', {
                        description: `Sum ${sum} is too high. Move right pointer to the left to decrease sum.`,
                        i, left: l, right: r, sum
                    });
                    r--;
                } else {
                    // Found a triplet
                    const triplet = [sortedNums[i], sortedNums[l], sortedNums[r]];
                    triplets.push(triplet);

                    record('found', {
                        description: `Found triplet: [${sortedNums[i]}, ${sortedNums[l]}, ${sortedNums[r]}]!`,
                        i, left: l, right: r, sum,
                        foundTriplet: triplet
                    });

                    // Skip duplicates for left and right
                    while (l < r && sortedNums[l] === sortedNums[l + 1]) l++;
                    while (l < r && sortedNums[r] === sortedNums[r - 1]) r--;

                    l++;
                    r--;

                    record('next_pair', {
                        description: "Moved pointers inward, skipping any duplicates to find next potential pair.",
                        i, left: l, right: r
                    });
                }
            }
        }

        record('finish', {
            description: "Analysis complete.",
            i: null, left: null, right: null
        });

        return recordedSteps;
    }, [nums]);

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
                            <CardTitle className="text-lg">3Sum</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto space-y-6 pt-6">
                            <ProblemInfo problem={problem} />

                            <div className="space-y-4">
                                <label className="text-sm font-medium text-muted-foreground block mb-2">Input Array</label>
                                <div className="flex gap-2">
                                    <Input
                                        ref={inputRef}
                                        defaultValue={inputStr}
                                        className="font-mono text-xs"
                                        placeholder="[-1, 0, 1, 2, -1, -4]"
                                    />
                                    <Button onClick={parseInput} size="icon" variant="outline">
                                        <RefreshCw className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="text-sm text-balance text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border">
                                {currentData?.description || "Ready to start"}
                            </div>

                            {currentData.sum !== undefined && (
                                <div className="p-4 rounded-lg bg-secondary border border-border space-y-2">
                                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Current Calculation</div>
                                    <div className="font-mono text-sm">
                                        nums[i] + nums[L] + nums[R] = sum
                                    </div>
                                    <div className="font-mono text-lg font-bold text-center">
                                        {currentData.nums[currentData.i]} + {currentData.nums[currentData.left]} + {currentData.nums[currentData.right]} =
                                        <span className={cn(
                                            "ml-2",
                                            currentData.sum === 0 ? "text-green-500" : (currentData.sum < 0 ? "text-blue-400" : "text-red-400")
                                        )}>
                                            {currentData.sum}
                                        </span>
                                    </div>
                                </div>
                            )}

                        </CardContent>
                    </Card>
                </ResizablePanel>

                <ResizableHandle withHandle />

                <ResizablePanel defaultSize={75}>
                    <div className="flex-1 flex flex-col relative h-full">
                        <div className="flex-1 flex flex-col items-center justify-start p-8 overflow-y-auto three-sum-container h-full">

                            {/* Array Visualization */}
                            <div className="array-container">
                                {currentData.nums && currentData.nums.map((val, idx) => {
                                    const isI = idx === currentData.i;
                                    const isLeft = idx === currentData.left;
                                    const isRight = idx === currentData.right;
                                    const isFound = isI || isLeft || isRight; // Rough highlight for found state

                                    return (
                                        <div key={idx} className={cn(
                                            "array-item",
                                            isI && "current-i",
                                            isLeft && "pointer-left",
                                            isRight && "pointer-right",
                                            currentData.type === 'found' && isFound && "found-part"
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

                            <div className="w-full max-w-2xl">
                                <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Found Triplets</h3>
                                <div className="found-triplets">
                                    {(currentData.triplets || []).map((t, idx) => (
                                        <div key={idx} className="triplet-badge">
                                            [{t.join(', ')}]
                                        </div>
                                    ))}
                                    {currentData.triplets?.length === 0 && (
                                        <div className="text-muted-foreground text-sm italic">No triplets found yet</div>
                                    )}
                                </div>
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

export default ThreeSum;
