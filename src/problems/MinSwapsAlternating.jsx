import React, { useState, useEffect, useMemo, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import ReplayControl from '../components/ReplayControl';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { cn } from '../lib/utils';
import './MinSwapsAlternating.css';

const MinSwapsAlternating = ({ problem }) => {
    const [inputStr, setInputStr] = useState("111000");
    const [s, setS] = useState("111000");

    // Playback
    const [currentStep, setCurrentStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(1);
    const timerRef = useRef(null);
    const inputRef = useRef(null);

    const updateInput = () => {
        if (inputRef.current) {
            const val = inputRef.current.value;
            // Validate binary string
            if (/^[01]+$/.test(val)) {
                setInputStr(val);
                setS(val);
                setCurrentStep(0);
                setIsPlaying(false);
            }
        }
    };

    const steps = useMemo(() => {
        const recordedSteps = [];
        const n = s.length;

        let zeros = 0;
        let ones = 0;
        for (let char of s) {
            if (char === '0') zeros++;
            else ones++;
        }

        const record = (type, data) => {
            recordedSteps.push({
                type,
                zeros,
                ones,
                ...data
            });
        };

        record('count', {
            description: `Count Zeros: ${zeros}, Count Ones: ${ones}. Difference: ${Math.abs(zeros - ones)}.`,
            valid: Math.abs(zeros - ones) <= 1
        });

        if (Math.abs(zeros - ones) > 1) {
            record('finish', {
                description: "Difference > 1. Impossible to make alternating string. Result: -1.",
                result: -1
            });
            return recordedSteps;
        }

        // Possible patterns
        let patterns = [];
        if (ones > zeros) patterns = ["10"]; // Must start with 1
        else if (zeros > ones) patterns = ["01"]; // Must start with 0
        else patterns = ["01", "10"]; // Can start with either

        let minSwaps = Infinity;
        let bestPattern = "";

        for (const startStr of patterns) {
            let mismatches = 0;
            let patternStr = "";
            let mismatchIndices = [];

            for (let i = 0; i < n; i++) {
                const expected = i % 2 === 0 ? startStr[0] : startStr[1];
                patternStr += expected;
                if (s[i] !== expected) {
                    mismatches++;
                    mismatchIndices.push(i);
                }
            }

            const curSwaps = mismatches / 2;
            record('check_pattern', {
                description: `Checking pattern starting with '${startStr[0]}'. Mismatches: ${mismatches}. Swaps needed: ${mismatches} / 2 = ${curSwaps}.`,
                pattern: patternStr,
                mismatchIndices: mismatchIndices,
                swaps: curSwaps
            });

            if (curSwaps < minSwaps) {
                minSwaps = curSwaps;
                bestPattern = patternStr;
            }
        }

        record('finish', {
            description: `Minimum swaps needed: ${minSwaps}.`,
            result: minSwaps,
            pattern: bestPattern,
            mismatchIndices: [] // Clearing highlight for final state or maybe keep valid one?
        });

        return recordedSteps;
    }, [s]);

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
            <Card className="w-[350px] flex flex-col h-full rounded-none border-r border-border bg-background">
                <CardHeader className="border-b border-border pb-4">
                    <CardTitle className="text-lg">Min Swaps to Alternating (1864)</CardTitle>
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
                            Binary String
                        </label>
                        <div className="flex gap-2">
                            <Input
                                ref={inputRef}
                                defaultValue={inputStr}
                                placeholder="111000"
                                className="font-mono text-xs"
                            />
                            <Button onClick={updateInput} size="icon" variant="outline">
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="p-4 rounded-lg bg-secondary border border-border">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                            Result
                        </div>
                        <div className={cn(
                            "text-3xl font-bold font-mono transition-colors",
                            currentData.type === 'finish' ? "text-green-500" : "text-primary"
                        )}>
                            {currentData.result !== undefined ? currentData.result : '-'}
                        </div>
                    </div>

                    <div className="text-sm text-balance text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border">
                        {currentData?.description || "Ready to start"}
                    </div>
                </CardContent>
            </Card>

            <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto bg-muted/5 relative">
                {/* Visualizer */}
                <div className="flex flex-col items-center gap-8 w-full max-w-4xl">

                    <div className="text-center">
                        <h3 className="text-xl font-bold mb-4">Input String</h3>
                        <div className="string-container">
                            {s.split('').map((char, idx) => (
                                <div key={idx} className={cn(
                                    "char-box",
                                    currentData.mismatchIndices?.includes(idx) ? "mismatch" : "bg-card"
                                )}>
                                    {char}
                                    <span className="text-[10px] text-muted-foreground mt-1 text-inherit opacity-50">{idx}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {currentData.pattern && (
                        <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h3 className="text-sm font-bold mb-2 text-muted-foreground uppercase tracking-wider">Comparing With Target</h3>
                            <div className="string-container">
                                {currentData.pattern.split('').map((char, idx) => (
                                    <div key={idx} className="char-box bg-secondary border-dashed">
                                        {char}
                                    </div>
                                ))}
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
                    className="absolute bottom-8"
                />
            </div>
        </div>
    );
};

export default MinSwapsAlternating;
