import React, { useState, useEffect, useMemo, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import ReplayControl from '../components/ReplayControl';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { cn } from '../lib/utils';
import './MedianOfTwoSortedArrays.css';
import ProblemInfo from '../components/ProblemInfo';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '../components/ui/resizable';

const MedianOfTwoSortedArrays = ({ problem }) => {
    const [array1Input, setArray1Input] = useState("[1, 3]");
    const [array2Input, setArray2Input] = useState("[2]");
    const [nums1, setNums1] = useState([1, 3]);
    const [nums2, setNums2] = useState([2]);

    // Playback state
    const [currentStep, setCurrentStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(1);
    const timerRef = useRef(null);

    // Inputs
    const array1Ref = useRef(null);
    const array2Ref = useRef(null);

    const parseInput = () => {
        try {
            const arr1 = JSON.parse(array1Ref.current.value);
            const arr2 = JSON.parse(array2Ref.current.value);
            if (!Array.isArray(arr1) || !Array.isArray(arr2)) {
                alert("Inputs must be valid JSON arrays.");
                return;
            }
            // Sort them to be safe as per problem statement usually inputs are sorted, 
            // but ensuring sorted helps visualization consistency if user messes up
            arr1.sort((a, b) => a - b);
            arr2.sort((a, b) => a - b);

            setArray1Input(array1Ref.current.value);
            setArray2Input(array2Ref.current.value);
            setNums1(arr1);
            setNums2(arr2);
            setCurrentStep(0);
            setIsPlaying(false);
        } catch (e) {
            alert("Invalid JSON format. Please use [1, 2, 3] format.");
        }
    };

    const steps = useMemo(() => {
        const recordedSteps = [];
        let A = [...nums1];
        let B = [...nums2];
        let wasSwapped = false;

        if (A.length > B.length) {
            [A, B] = [B, A];
            wasSwapped = true;
        }

        const m = A.length;
        const n = B.length;
        let low = 0;
        let high = m;

        const record = (type, data) => {
            recordedSteps.push({
                type,
                A: [...A],
                B: [...B],
                m, n,
                low, high,
                wasSwapped,
                ...data
            });
        };

        record('start', {
            description: `Start with two sorted arrays. Ensure Array 1 is smaller or equal length to Array 2. ${wasSwapped ? '(Swapped for algorithm)' : ''}`
        });

        while (low <= high) {
            const partitionX = Math.floor((low + high) / 2);
            const partitionY = Math.floor((m + n + 1) / 2) - partitionX;

            const maxLeftX = (partitionX === 0) ? Number.NEGATIVE_INFINITY : A[partitionX - 1];
            const minRightX = (partitionX === m) ? Number.POSITIVE_INFINITY : A[partitionX];

            const maxLeftY = (partitionY === 0) ? Number.NEGATIVE_INFINITY : B[partitionY - 1];
            const minRightY = (partitionY === n) ? Number.POSITIVE_INFINITY : B[partitionY];

            record('check', {
                description: `Partitioning at X=${partitionX}, Y=${partitionY}. Checking if valid partition...`,
                partitionX,
                partitionY,
                maxLeftX, minRightX,
                maxLeftY, minRightY
            });

            if (maxLeftX <= minRightY && maxLeftY <= minRightX) {
                // Found
                let median;
                if ((m + n) % 2 === 0) {
                    median = (Math.max(maxLeftX, maxLeftY) + Math.min(minRightX, minRightY)) / 2.0;
                    record('found', {
                        description: `Valid partition found! Total length is even. Median = avg(max(left), min(right)) = (${Math.max(maxLeftX, maxLeftY)} + ${Math.min(minRightX, minRightY)}) / 2 = ${median}`,
                        partitionX, partitionY,
                        maxLeftX, minRightX,
                        maxLeftY, minRightY,
                        median
                    });
                } else {
                    median = Math.max(maxLeftX, maxLeftY);
                    record('found', {
                        description: `Valid partition found! Total length is odd. Median = max(left) = ${median}`,
                        partitionX, partitionY,
                        maxLeftX, minRightX,
                        maxLeftY, minRightY,
                        median
                    });
                }
                break;
            } else if (maxLeftX > minRightY) {
                // Move left
                high = partitionX - 1;
                record('move_left', {
                    description: `maxLeftX (${maxLeftX}) > minRightY (${minRightY}). Move left in Array 1. New high = ${high}`,
                    partitionX, partitionY,
                    maxLeftX, minRightX,
                    maxLeftY, minRightY
                });
            } else {
                // Move right
                low = partitionX + 1;
                record('move_right', {
                    description: `maxLeftY (${maxLeftY}) > minRightX (${minRightX}). Move right in Array 1. New low = ${low}`,
                    partitionX, partitionY,
                    maxLeftX, minRightX,
                    maxLeftY, minRightY
                });
            }
        }

        return recordedSteps;
    }, [nums1, nums2]);

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
    const isFinished = currentData.type === 'found';

    // Helper to render array
    const renderArray = (arr, isArray1) => {
        // We need to determine where the partition is for this array
        // 'isArray1' is true if this is the first visual array (A if not swapped, or B if swapped?? Wait, steps use A and B)
        // Let's stick to A and B as defined in steps.

        // steps.A corresponds to currentData.A
        const partition = isArray1 ? currentData.partitionX : currentData.partitionY;
        const currentArr = isArray1 ? currentData.A : currentData.B;

        if (!currentArr) return null;

        return (
            <div className="array-row">
                <div className="absolute left-[-80px] top-4 font-bold text-muted-foreground w-[70px] text-right">
                    {isArray1 ? (currentData.wasSwapped ? "Array 2*" : "Array 1") : (currentData.wasSwapped ? "Array 1*" : "Array 2")}
                </div>
                {currentArr.map((val, idx) => {
                    // Check if this element is relevant to the comparison
                    // maxLeft is at partition-1, minRight is at partition
                    const isMaxLeft = idx === (partition - 1);
                    const isMinRight = idx === partition;

                    return (
                        <div key={idx} className={cn(
                            "array-box",
                            isMaxLeft && "partition-left",
                            isMinRight && "partition-right",
                            (isMaxLeft || isMinRight) && currentData.type !== 'start' && "active-comparison"
                        )}>
                            {val}
                            <span className="array-index">{idx}</span>
                        </div>
                    );
                })}
                {/* Partition Line */}
                {(partition !== undefined) && (
                    <div
                        className="partition-line"
                        style={{
                            left: `calc((${partition} * 68px) - 2px)` // 60px width + 8px gap = 68px approx offset per item
                        }}
                    />
                )}
            </div>
        );
    };

    return (
        <div className="flex h-full w-full">
            <ResizablePanelGroup direction="horizontal" className="h-full w-full">
                <ResizablePanel defaultSize={25} minSize={20} maxSize={50} className="bg-background">
                    <Card className="viz-sidebar flex flex-col h-full rounded-none border-0 border-r-0 bg-background">
                        <CardHeader className="border-b border-border pb-4">
                            <CardTitle className="text-lg">Median of Two Sorted Arrays</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto space-y-6 pt-6">
                            <ProblemInfo problem={problem} />

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground block mb-2">Array 1</label>
                                    <Input
                                        ref={array1Ref}
                                        defaultValue={array1Input}
                                        className="font-mono text-xs"
                                        placeholder="[1, 3]"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground block mb-2">Array 2</label>
                                    <div className="flex gap-2">
                                        <Input
                                            ref={array2Ref}
                                            defaultValue={array2Input}
                                            className="font-mono text-xs"
                                            placeholder="[2]"
                                        />
                                        <Button onClick={parseInput} size="icon" variant="outline">
                                            <RefreshCw className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {isFinished && (
                                <div className="p-4 rounded-lg bg-secondary border border-border">
                                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                                        Median Found
                                    </div>
                                    <div className="text-3xl font-bold font-mono text-green-500">
                                        {currentData.median}
                                    </div>
                                </div>
                            )}

                            <div className="text-sm text-balance text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border">
                                {currentData?.description || "Ready to start"}
                            </div>

                        </CardContent>
                    </Card>
                </ResizablePanel>

                <ResizableHandle withHandle />

                <ResizablePanel defaultSize={75}>
                    <div className="flex-1 flex flex-col relative h-full">
                        <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto median-arrays-container h-full">

                            {/* Visualization Area */}
                            <div className="relative pl-20">
                                {renderArray(currentData.A, true)}
                                <div className="h-4"></div>
                                {renderArray(currentData.B, false)}

                                {/* Search Range on Smaller Array (A) */}
                                {currentData.low !== undefined && currentData.high !== undefined && (
                                    <div
                                        className="search-range-indicator"
                                        style={{
                                            left: `calc((${currentData.low} * 68px) + 84px)`, // Offset for label and gaps
                                            width: `calc((${currentData.high - currentData.low} * 68px))`
                                        }}
                                    >
                                        <div className="search-range-label">Range L:{currentData.low} - H:{currentData.high}</div>
                                    </div>
                                )}
                            </div>

                            {/* Values Display */}
                            {currentData.maxLeftX !== undefined && (
                                <div className="mt-12 grid grid-cols-2 gap-8 text-sm max-w-2xl w-full">
                                    <div className="space-y-2 p-4 border rounded bg-muted/20">
                                        <div className="font-semibold mb-2">Partition Left (Max)</div>
                                        <div className="flex justify-between">
                                            <span>Array 1 (X):</span>
                                            <span className="font-mono font-bold">{currentData.maxLeftX === -Infinity ? '-∞' : currentData.maxLeftX}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Array 2 (Y):</span>
                                            <span className="font-mono font-bold">{currentData.maxLeftY === -Infinity ? '-∞' : currentData.maxLeftY}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2 p-4 border rounded bg-muted/20">
                                        <div className="font-semibold mb-2">Partition Right (Min)</div>
                                        <div className="flex justify-between">
                                            <span>Array 1 (X):</span>
                                            <span className="font-mono font-bold">{currentData.minRightX === Infinity ? '∞' : currentData.minRightX}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Array 2 (Y):</span>
                                            <span className="font-mono font-bold">{currentData.minRightY === Infinity ? '∞' : currentData.minRightY}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

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

export default MedianOfTwoSortedArrays;
