import React, { useState, useEffect, useMemo, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import ReplayControl from '../components/ReplayControl';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { cn } from '../lib/utils';
import './HouseRobber.css';
import ProblemInfo from '../components/ProblemInfo';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '../components/ui/resizable';

const HouseRobberII = ({ problem }) => {
    const [arrayInput, setArrayInput] = useState("[2,3,2]");
    const [houses, setHouses] = useState([2, 3, 2]);
    const [currentStep, setCurrentStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(1);
    const timerRef = useRef(null);
    const inputRef = useRef(null);

    // Parse input
    const parseInput = (str) => {
        try {
            const arr = JSON.parse(str);
            if (Array.isArray(arr) && arr.every(n => typeof n === 'number')) {
                return arr;
            }
        } catch (e) { }
        return null;
    };

    const submitInput = () => {
        if (inputRef.current) {
            const val = inputRef.current.value;
            const arr = parseInput(val);
            if (arr) {
                setArrayInput(val);
                setHouses(arr);
                setCurrentStep(0);
                setIsPlaying(false);
            }
        }
    };

    // Helper to solve linear House Robber 1 logic
    const solveLinear = (nums, startIdx, offsetDesc) => {
        const recorded = [];
        const n = nums.length;
        if (n === 0) return { dp: [], steps: [] };

        const dp = new Array(n).fill(0);

        // Step 0 initialization relative to this subarray
        recorded.push({
            type: 'sub-start',
            description: `Analyzing Case: ${offsetDesc}`,
            active: -1,
            dpState: [...dp],
            range: { start: startIdx, end: startIdx + n - 1 }
        });

        if (n > 0) {
            dp[0] = nums[0];
            recorded.push({
                type: 'calc',
                index: 0,
                active: startIdx, // Absolute index in original array
                dpState: [...dp],
                description: `House ${startIdx}: Only choice in this range. Rob $${nums[0]}.`,
                range: { start: startIdx, end: startIdx + n - 1 }
            });
        }

        if (n > 1) {
            dp[1] = Math.max(nums[0], nums[1]);
            recorded.push({
                type: 'calc',
                index: 1,
                active: startIdx + 1,
                dpState: [...dp],
                description: `House ${startIdx + 1}: Rob ($${nums[1]}) vs Prev ($${nums[0]}). Max is $${dp[1]}.`,
                range: { start: startIdx, end: startIdx + n - 1 }
            });
        }

        for (let i = 2; i < n; i++) {
            const robCurrent = nums[i] + dp[i - 2];
            const robPrev = dp[i - 1];
            dp[i] = Math.max(robCurrent, robPrev);

            recorded.push({
                type: 'decision',
                active: startIdx + i,
                index: i,
                dpState: [...dp],
                description: dp[i] === robCurrent
                    ? `Robbing House ${startIdx + i} is better ($${robCurrent}).`
                    : `Skipping House ${startIdx + i} is better ($${robPrev}).`,
                range: { start: startIdx, end: startIdx + n - 1 },
                robbed: dp[i] === robCurrent
            });
        }

        recorded.push({
            type: 'sub-finish',
            active: -1,
            dpState: [...dp],
            description: `Max for this range: $${dp[n - 1]}`,
            range: { start: startIdx, end: startIdx + n - 1 },
            result: dp[n - 1]
        });

        return { val: dp[n - 1], steps: recorded };
    };

    // Generate Simulation Steps
    const steps = useMemo(() => {
        if (!houses.length) return [];
        if (houses.length === 1) {
            return [{
                type: 'finish',
                active: 0,
                description: `Only one house. Rob it for $${houses[0]}.`,
                globalMax: houses[0],
                range: { start: 0, end: 0 }
            }];
        }

        const allSteps = [];

        allSteps.push({
            type: 'intro',
            description: "Circular Arrangement: Cannot rob both First and Last house.",
            active: -1,
            range: null
        });

        // Case 1: Rob 0 to n-2 (Skip Last)
        const case1Nums = houses.slice(0, houses.length - 1);
        const case1 = solveLinear(case1Nums, 0, "Rob First, Skip Last");
        allSteps.push(...case1.steps);

        // Case 2: Rob 1 to n-1 (Skip First)
        const case2Nums = houses.slice(1, houses.length);
        const case2 = solveLinear(case2Nums, 1, "Skip First, Rob Last");
        allSteps.push(...case2.steps);

        const globalMax = Math.max(case1.val, case2.val);

        allSteps.push({
            type: 'finish',
            description: `Final Result: Max(Case 1: $${case1.val}, Case 2: $${case2.val}) = $${globalMax}`,
            active: -1,
            globalMax,
            range: null
        });

        return allSteps;
    }, [houses]);


    useEffect(() => {
        if (isPlaying) {
            timerRef.current = setInterval(() => {
                setCurrentStep((prev) => {
                    if (prev < steps.length - 1) return prev + 1;
                    setIsPlaying(false);
                    return prev;
                });
            }, 1000 / speed); // Faster default speed as there are 2x steps
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [isPlaying, steps.length, speed]);

    const currentData = steps[currentStep] || {};
    const isFinished = currentData.type === 'finish';


    return (
        <div className="flex h-full w-full">
            <ResizablePanelGroup direction="horizontal" className="h-full w-full">
                <ResizablePanel defaultSize={20} minSize={20} maxSize={50} className="bg-background">
                    {/* Sidebar */}
                    <Card className="viz-sidebar flex flex-col h-full rounded-none border-0 border-r-0 bg-background">
                        <CardHeader className="border-b border-border pb-4">
                            <CardTitle className="text-lg">House Robber II (Circular)</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto space-y-6 pt-6">
                            <ProblemInfo problem={problem} />
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-muted-foreground block">
                                    House Values (Array)
                                </label>
                                <div className="flex gap-2">
                                    <Input
                                        ref={inputRef}
                                        defaultValue={arrayInput}
                                        placeholder="e.g. [2,3,2]"
                                        className="font-mono text-xs"
                                    />
                                    <Button onClick={submitInput} size="icon" variant="outline">
                                        <RefreshCw className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="p-4 rounded-lg bg-secondary border border-border">
                                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                                    Current Max
                                </div>
                                <div className={cn(
                                    "text-3xl font-bold font-mono transition-colors",
                                    isFinished ? "text-green-500" : "text-primary"
                                )}>
                                    {isFinished ? currentData.globalMax : (currentData.dpState ? Math.max(...currentData.dpState) : 0)}
                                </div>
                            </div>

                            <div className="text-sm text-balance text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border">
                                {currentData?.description || "Ready to start"}
                            </div>
                        </CardContent>
                    </Card>


                </ResizablePanel>

                <ResizableHandle withHandle />

                <ResizablePanel defaultSize={80}>
                    {/* Main Area */}
                    <div className="flex-1 flex flex-col relative">
                        <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto">

                            {/* Visualizer Container */}
                            <div className="house-container relative">
                                {/* Circular Hint Lines if needed, but linear is clearer for logic breakdown */}

                                {houses.map((val, idx) => {
                                    const isActive = currentData.active === idx;
                                    const isInRange = currentData.range && idx >= currentData.range.start && idx <= currentData.range.end;
                                    // Dim nodes not in current evaluation range
                                    const isDimmed = currentData.range && !isInRange;

                                    return (
                                        <div key={idx} className={cn(
                                            "house transition-all duration-500",
                                            isActive && "active",
                                            isDimmed && "opacity-20 blur-[1px] grayscale"
                                        )}>
                                            <div className={cn(
                                                "house-roof",
                                                "border-b-foreground transition-colors duration-300",
                                                isActive && "border-b-primary"
                                            )} />
                                            <div className={cn(
                                                "house-base transition-colors duration-300",
                                                isActive ? "bg-primary text-primary-foreground border-primary" : "bg-card text-card-foreground"
                                            )}>
                                                ${val}
                                            </div>

                                            <AnimatePresence>
                                                {isActive && (
                                                    <motion.div
                                                        layoutId="ninja2"
                                                        initial={{ opacity: 0, scale: 0.5, y: -20 }}
                                                        animate={{
                                                            opacity: 1,
                                                            scale: 1,
                                                            y: 0,
                                                        }}
                                                        exit={{ opacity: 0, scale: 0.5 }}
                                                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                                        className="absolute -top-12 z-20 flex flex-col items-center filter drop-shadow-lg"
                                                    >
                                                        <div className="text-3xl">🥷</div>
                                                        {currentData.type === 'decision' && (
                                                            <motion.div
                                                                initial={{ scale: 0, opacity: 0 }}
                                                                animate={{ scale: 1, opacity: 1 }}
                                                                className="text-lg bg-background/80 rounded-full px-1 -mt-1 backdrop-blur-sm border border-border shadow-sm"
                                                            >
                                                                {currentData.description.includes("Robbing") ? "✅" : "❌"}
                                                            </motion.div>
                                                        )}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                            <div className="text-xs text-muted-foreground mt-2 font-mono">
                                                idx: {idx}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
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
        </div >
    );
};

export default HouseRobberII;
