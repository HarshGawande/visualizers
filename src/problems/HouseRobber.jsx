import React, { useState, useEffect, useMemo, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import ReplayControl from '../components/ReplayControl';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { cn } from '../lib/utils';
import './HouseRobber.css';

const HouseRobber = ({ problem }) => {
    const [arrayInput, setArrayInput] = useState("[1,2,3,1]");
    const [houses, setHouses] = useState([1, 2, 3, 1]);
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

    // Generate Simulation Steps
    const steps = useMemo(() => {
        if (!houses.length) return [];

        const recordedSteps = [];
        // classic dp array: dp[i] = max money at house i
        const dp = new Array(houses.length).fill(0);

        const record = (data) => recordedSteps.push(JSON.parse(JSON.stringify(data)));

        record({
            type: 'start',
            description: 'Goal: Maximize money without robbing adjacent houses.',
            active: -1,
            robbed: [],
            dpState: [...dp]
        });

        if (houses.length > 0) {
            dp[0] = houses[0];
            record({
                type: 'calc',
                index: 0,
                active: 0,
                robbed: [0],
                dpState: [...dp],
                description: `House 0: Only one choice. Rob it for $${houses[0]}.`,
                highlight: [0]
            });
        }

        if (houses.length > 1) {
            dp[1] = Math.max(houses[0], houses[1]);
            const robbed = houses[1] > houses[0] ? [1] : [0];
            record({
                type: 'calc',
                index: 1,
                active: 1,
                robbed: robbed, // this visualization is simpler, just showing current decision
                dpState: [...dp],
                description: `House 1: Rob ($${houses[1]}) vs Prev Max ($${houses[0]}). Max is $${dp[1]}.`,
                highlight: [0, 1]
            });
        }

        for (let i = 2; i < houses.length; i++) {
            const robCurrent = houses[i] + dp[i - 2];
            const robPrev = dp[i - 1];

            record({
                type: 'compare',
                active: i,
                index: i,
                dpState: [...dp],
                description: `House ${i}: Compare robbing ($${houses[i]} + $${dp[i - 2]} = $${robCurrent}) vs Skipping ($${robPrev}).`,
                highlight: [i, i - 2, i - 1]
            });

            dp[i] = Math.max(robCurrent, robPrev);

            record({
                type: 'decision',
                active: i,
                index: i,
                dpState: [...dp],
                description: dp[i] === robCurrent
                    ? `Robbing House ${i} is better! New Max: $${dp[i]}`
                    : `Skipping House ${i} is better. Keep Max: $${dp[i]}`,
                highlight: dp[i] === robCurrent ? [i, i - 2] : [i - 1]
            });
        }

        record({
            type: 'finish',
            active: -1,
            dpState: [...dp],
            description: `Finished! Maximum amount robbed: $${dp[houses.length - 1]}`,
            globalMax: dp[houses.length - 1]
        });

        return recordedSteps;
    }, [houses]);


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
    const isFinished = currentData.type === 'finish';

    // Helper to determine house state
    const getHouseState = (index) => {
        if (!currentData) return 'default';

        // If finished, we ideally want to show the BACKTRACKED solution path
        // But for this simple viz, let's just highlight involved nodes in current step

        if (currentData.active === index) return 'active';
        if (currentData.highlight?.includes(index)) return 'active-secondary';
        return 'default';
    };

    return (
        <div className="flex h-full w-full">
            {/* Sidebar */}
            <Card className="w-[350px] flex flex-col h-full rounded-none border-r border-border bg-background">
                <CardHeader className="border-b border-border pb-4">
                    <CardTitle className="text-lg">House Robber</CardTitle>
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
                            House Values (Array)
                        </label>
                        <div className="flex gap-2">
                            <Input
                                ref={inputRef}
                                defaultValue={arrayInput}
                                placeholder="e.g. [1,2,3,1]"
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
                            {currentData.dpState ? Math.max(...currentData.dpState) : 0}
                        </div>
                    </div>

                    <div className="text-sm text-balance text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border">
                        {currentData?.description || "Ready to start"}
                    </div>
                </CardContent>
            </Card>

            {/* Main Area */}
            <div className="flex-1 flex flex-col relative">
                <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto">
                    {/* Houses Visualization */}
                    <div className="house-container">
                        {houses.map((val, idx) => (
                            <div key={idx} className={cn(
                                "house",
                                getHouseState(idx) === 'active' && "active",
                                // Simple highlighting for comparison
                                currentData.highlight?.includes(idx) && "scale-110"
                            )}>
                                <div className={cn(
                                    "house-roof",
                                    "border-b-foreground transition-colors duration-300",
                                    currentData.highlight?.includes(idx) && "border-b-primary"
                                )} />
                                <div className={cn(
                                    "house-base transition-colors duration-300",
                                    currentData.highlight?.includes(idx) ? "bg-primary text-primary-foreground border-primary" : "bg-card text-card-foreground"
                                )}>
                                    ${val}
                                </div>


                                <AnimatePresence>
                                    {currentData.active === idx && (
                                        <motion.div
                                            layoutId="ninja"
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
                        ))}
                    </div>

                    {/* DP Table Visualization */}
                    <div className="mt-12 w-full max-w-3xl">
                        <h3 className="text-sm font-semibold text-muted-foreground mb-4 text-center">Dynamic Programming Table (Max Stolen So Far)</h3>
                        <div className="dp-table-container">
                            {currentData.dpState?.map((val, idx) => (
                                <div key={idx} className={cn(
                                    "dp-cell rounded-md transition-all duration-300",
                                    idx === currentData.index ? "border-primary bg-primary/10 text-primary scale-110" : "bg-card text-muted-foreground"
                                )}>
                                    {val}
                                </div>
                            ))}
                            {/* Fill rest if any */}
                            {Array.from({ length: Math.max(0, houses.length - (currentData.dpState?.length || 0)) }).map((_, i) => (
                                <div key={`empty-${i}`} className="dp-cell rounded-md bg-muted/20 text-muted-foreground/30">0</div>
                            ))}
                        </div>
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
        </div>
    );
};

export default HouseRobber;
