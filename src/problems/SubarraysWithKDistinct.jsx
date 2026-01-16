import React, { useState, useEffect, useMemo, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import ReplayControl from '../components/ReplayControl';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { cn } from '../lib/utils';
import './SubarraysWithKDistinct.css';

const SubarraysWithKDistinct = ({ problem }) => {
    const [arrayInput, setArrayInput] = useState("[1,2,1,2,3]");
    const [kInput, setKInput] = useState("2");
    const [nums, setNums] = useState([1, 2, 1, 2, 3]);
    const [k, setK] = useState(2);

    const [currentStep, setCurrentStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(1);
    const timerRef = useRef(null);

    const inputRef = useRef(null);
    const kRef = useRef(null);

    const parseInput = () => {
        try {
            const arr = JSON.parse(inputRef.current.value);
            const kVal = parseInt(kRef.current.value);
            if (Array.isArray(arr) && arr.every(n => typeof n === 'number') && !isNaN(kVal)) {
                setArrayInput(inputRef.current.value);
                setKInput(kRef.current.value);
                setNums(arr);
                setK(kVal);
                setCurrentStep(0);
                setIsPlaying(false);
            }
        } catch (e) {
            console.error("Invalid input");
        }
    };

    const steps = useMemo(() => {
        // Implementation of "At Most K" logic twice is standard, but finding "Example K" via 3 pointers is better for viz.
        // Let's use the helper method `atMostK` logic but visualize ONLY `atMost(K) - atMost(K-1)` is hard.
        // Let's implement the specific "Exactly K" sliding window:
        // Window [left1, right] keeps elements with at most K distinct.
        // Window [left2, right] keeps elements with at most K-1 distinct.
        // Count for 'right' = left2 - left1.

        const recordedSteps = [];

        const n = nums.length;
        const count1 = new Map();
        const count2 = new Map();
        let left1 = 0, left2 = 0;
        let total = 0;

        const record = (type, data) => {
            recordedSteps.push({
                type,
                left1,
                left2,
                currentTotal: total,
                count1: new Map(count1),
                count2: new Map(count2),
                ...data
            });
        };

        record('start', {
            description: `We use two sliding windows. Window 1 (Left1..Right) allows 'at most K' (${k}) distinct. Window 2 (Left2..Right) allows 'at most K-1' (${k - 1}) distinct. The number of subarrays with EXACTLY K distinct ending at Right is (Left2 - Left1).`,
            right: -1
        });

        for (let right = 0; right < n; right++) {
            const x = nums[right];

            // Update Window 1
            count1.set(x, (count1.get(x) || 0) + 1);
            record('expand_1', {
                description: `Right expands to ${right} (Value: ${x}). Add to Window 1 count.`,
                right,
                highlight: [right]
            });

            while (count1.size > k) {
                const y = nums[left1];
                count1.set(y, count1.get(y) - 1);
                if (count1.get(y) === 0) count1.delete(y);
                left1++;
                record('shrink_1', {
                    description: `Window 1 has > ${k} distinct. Shrink Left1 to ${left1}.`,
                    right,
                    highlight: [left1 - 1]
                });
            }

            // Update Window 2
            count2.set(x, (count2.get(x) || 0) + 1);

            while (count2.size > k - 1) {
                const y = nums[left2];
                count2.set(y, count2.get(y) - 1);
                if (count2.get(y) === 0) count2.delete(y);
                left2++;
                record('shrink_2', {
                    description: `Window 2 must have <= ${k - 1} distinct. Current Window 2 size > ${k - 1}. Shrink Left2 to ${left2}.`,
                    right,
                    highlight: [left2 - 1]
                });
            }

            const added = left2 - left1;
            total += added;

            record('count', {
                description: `Valid subarrays ending at ${right}: Range [${left1}, ${left2 - 1}]. Count = ${left2} - ${left1} = ${added}. Total: ${total}.`,
                right,
                addedCount: added,
                highlight: []
            });
        }

        record('finish', {
            description: `Finished! Total subarrays with exactly ${k} distinct integers: ${total}`,
            right: n - 1
        });

        return recordedSteps;
    }, [nums, k]);

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

    // render helpers
    const getMapString = (map) => {
        if (!map) return "{}";
        return "{ " + Array.from(map.entries()).map(([k, v]) => `${k}:${v}`).join(", ") + " }";
    };

    return (
        <div className="flex h-full w-full">
            <Card className="w-[350px] flex flex-col h-full rounded-none border-r border-border bg-background">
                <CardHeader className="border-b border-border pb-4">
                    <CardTitle className="text-lg">Subarrays with K Different Integers (992)</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto space-y-6 pt-6">
                    {problem && (
                        <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg border border-border">
                            <p className="font-semibold mb-1">Description</p>
                            {problem.description}
                        </div>
                    )}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-muted-foreground block">
                            Array
                        </label>
                        <Input
                            ref={inputRef}
                            defaultValue={arrayInput}
                            placeholder="[1,2,1,2,3]"
                            className="font-mono text-xs"
                        />
                        <label className="text-sm font-medium text-muted-foreground block">
                            K (Distinct Count)
                        </label>
                        <div className="flex gap-2">
                            <Input
                                ref={kRef}
                                defaultValue={kInput}
                                placeholder="2"
                                className="font-mono text-xs"
                            />
                            <Button onClick={parseInput} size="icon" variant="outline">
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="p-4 rounded-lg bg-secondary border border-border">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                            Total Count
                        </div>
                        <div className="text-3xl font-bold font-mono text-primary">
                            {currentData.currentTotal !== undefined ? currentData.currentTotal : 0}
                        </div>
                    </div>
                    <div className="space-y-2 text-xs font-mono text-muted-foreground bg-muted/30 p-2 rounded">
                        <div>Win1 Map: {getMapString(currentData.count1)} (Target &le; {k})</div>
                        <div>Win2 Map: {getMapString(currentData.count2)} (Target &le; {k - 1})</div>
                    </div>

                    <div className="text-sm text-balance text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border">
                        {currentData?.description || "Ready to start"}
                    </div>
                </CardContent>
            </Card>

            <div className="flex-1 flex flex-col relative">
                <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto gap-12">
                    {/* Array Visualization */}
                    <div className="array-window-container">
                        {nums.map((val, idx) => {
                            const inWindow1 = idx >= (currentData.left1 ?? -1) && idx <= (currentData.right ?? -1);
                            const inWindow2 = idx >= (currentData.left2 ?? -1) && idx <= (currentData.right ?? -1);

                            // Visualize the "Valid Zone" [left1 ... left2-1] for current right
                            const isValidStart = idx >= (currentData.left1 ?? -1) && idx < (currentData.left2 ?? -1) && idx <= (currentData.right ?? -1);

                            return (
                                <div key={idx} className={cn(
                                    "array-item",
                                    // inWindow1 && "border-primary",
                                    isValidStart ? "bg-green-500/20 border-green-500" : (inWindow1 ? "border-primary/50" : "")
                                )}>
                                    {val}

                                    {/* Pointers */}
                                    <div className="absolute -bottom-8 w-full flex justify-center gap-1">
                                        {currentData.left1 === idx && (
                                            <div className="flex flex-col items-center pointer-left1">
                                                <div className="pointer-marker" />
                                                <span className="text-[10px]">L1</span>
                                            </div>
                                        )}
                                        {currentData.left2 === idx && (
                                            <div className="flex flex-col items-center pointer-left2">
                                                <div className="pointer-marker" />
                                                <span className="text-[10px]">L2</span>
                                            </div>
                                        )}
                                        {currentData.right === idx && (
                                            <div className="flex flex-col items-center pointer-right">
                                                <div className="pointer-marker" />
                                                <span className="text-[10px]">R</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="max-w-xl text-center text-muted-foreground text-sm">
                        <p>Items highlighted in <span className="text-green-500 font-bold">Green</span> form valid starting points for subarrays ending at R with exactly K distinct integers.</p>
                        <p className="mt-2 text-xs opacity-75">Formula: Valid Count += (L2 - L1)</p>
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
        </div>
    );
};

export default SubarraysWithKDistinct;
