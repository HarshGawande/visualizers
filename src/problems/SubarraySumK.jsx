
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import ReplayControl from '../components/ReplayControl';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { cn } from '../lib/utils';

const SubarraySumK = () => {
    const [arrayInput, setArrayInput] = useState("[1,1,1]");
    const [kInput, setKInput] = useState(2);

    const [nums, setNums] = useState([1, 1, 1]);
    const [k, setK] = useState(2);

    const [currentStep, setCurrentStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(1);
    const timerRef = useRef(null);
    const inputRef = useRef(null);
    const kRef = useRef(null);

    const parseInput = (str) => {
        try {
            const arr = JSON.parse(str);
            if (Array.isArray(arr) && arr.every(n => typeof n === 'number')) return arr;
        } catch (e) { }
        return null;
    };

    const submitInput = () => {
        if (inputRef.current && kRef.current) {
            const arr = parseInput(inputRef.current.value);
            const kVal = parseInt(kRef.current.value);
            if (arr && !isNaN(kVal)) {
                setArrayInput(inputRef.current.value);
                setKInput(kVal);
                setNums(arr);
                setK(kVal);
                setCurrentStep(0);
                setIsPlaying(false);
            }
        }
    };

    // Algorithm: Prefix Sum + Hash Map
    const steps = useMemo(() => {
        const recorded = [];
        const map = new Map();
        map.set(0, 1);
        let sum = 0;
        let count = 0;

        recorded.push({
            type: 'start',
            description: `Find subarrays summing to K=${k}. Init: Sum=0, Count=0, Map={0:1}`,
            activeIdx: -1,
            currentSum: 0,
            mapState: new Map(map),
            count: 0
        });

        for (let i = 0; i < nums.length; i++) {
            sum += nums[i];
            const diff = sum - k;

            recorded.push({
                type: 'calc',
                activeIdx: i,
                currentSum: sum,
                mapState: new Map(map),
                count: count,
                description: `Index ${i}: Add ${nums[i]}. Current Sum = ${sum}. Need (Sum - K) = ${sum} - ${k} = ${diff}.`
            });

            if (map.has(diff)) {
                const found = map.get(diff);
                count += found;
                recorded.push({
                    type: 'found',
                    activeIdx: i,
                    currentSum: sum,
                    mapState: new Map(map),
                    count: count,
                    description: `Found ${diff} in map ${found} times! Subarray found. Total Count: ${count}.`,
                    highlightMapKey: diff
                });
            } else {
                recorded.push({
                    type: 'dne',
                    activeIdx: i,
                    currentSum: sum,
                    mapState: new Map(map),
                    count: count,
                    description: `${diff} not in map. No new subarray ending here yet.`
                });
            }

            map.set(sum, (map.get(sum) || 0) + 1);
            recorded.push({
                type: 'update',
                activeIdx: i,
                currentSum: sum,
                mapState: new Map(map),
                count: count,
                description: `Update Map: set(Sum ${sum}) -> Count ${map.get(sum)}`,
                highlightMapKey: sum
            });
        }

        recorded.push({
            type: 'finish',
            activeIdx: -1,
            currentSum: sum,
            mapState: new Map(map),
            count: count,
            description: `Finished! Total subarrays found: ${count}`
        });

        return recorded;
    }, [nums, k]);

    // Playback
    useEffect(() => {
        if (isPlaying) {
            timerRef.current = setInterval(() => {
                setCurrentStep(prev => {
                    if (prev < steps.length - 1) return prev + 1;
                    setIsPlaying(false);
                    return prev;
                });
            }, 1500 / speed);
        } else { clearInterval(timerRef.current); }
        return () => clearInterval(timerRef.current);
    }, [isPlaying, steps.length, speed]);

    const currentData = steps[currentStep] || steps[0];

    return (
        <div className="flex h-full w-full">
            <Card className="w-[350px] flex flex-col h-full rounded-none border-r border-border bg-background">
                <CardHeader className="border-b border-border pb-4">
                    <CardTitle className="text-lg">Subarray Sum Equals K</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto space-y-6 pt-6">
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-muted-foreground block">Array & K</label>
                        <Input ref={inputRef} defaultValue={arrayInput} className="font-mono text-xs mb-2" placeholder="[1,1,1]" />
                        <div className="flex gap-2">
                            <div className="flex items-center gap-2 flex-1">
                                <span className="text-sm font-mono text-muted-foreground">k=</span>
                                <Input ref={kRef} defaultValue={kInput} type="number" className="w-20 font-mono" />
                            </div>
                            <Button onClick={submitInput} size="icon" variant="outline"><RefreshCw className="h-4 w-4" /></Button>
                        </div>
                    </div>

                    <div className="p-4 rounded-lg bg-secondary border border-border">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Total Found</div>
                        <div className="text-3xl font-bold font-mono text-primary">{currentData.count}</div>
                    </div>
                    <div className="text-sm text-balance text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border">
                        {currentData?.description}
                    </div>
                </CardContent>
            </Card>

            <div className="flex-1 flex flex-col relative p-8 items-center justify-center overflow-hidden">
                {/* Array Visualization */}
                <div className="flex gap-2 mb-12 flex-wrap justify-center">
                    {nums.map((n, idx) => (
                        <div key={idx} className={cn(
                            "w-12 h-12 flex items-center justify-center rounded-lg border-2 text-lg font-bold transition-all duration-300",
                            currentData.activeIdx === idx ? "bg-primary text-primary-foreground border-primary scale-110 shadow-lg" : "bg-card text-card-foreground border-border"
                        )}>
                            {n}
                            <div className="absolute -bottom-6 text-[10px] text-muted-foreground font-mono font-normal">idx:{idx}</div>
                        </div>
                    ))}
                </div>

                {/* State Variables */}
                <div className="flex gap-8 mb-12">
                    <div className="flex flex-col items-center p-4 bg-card rounded-xl border border-border shadow-sm w-32">
                        <span className="text-xs text-muted-foreground uppercase mb-1">Current Sum</span>
                        <span className="text-2xl font-mono font-bold">{currentData.currentSum}</span>
                    </div>
                    <div className="flex flex-col items-center p-4 bg-card rounded-xl border border-border shadow-sm w-32">
                        <span className="text-xs text-muted-foreground uppercase mb-1">Target (Sum-K)</span>
                        <span className="text-2xl font-mono font-bold text-orange-500">
                            {currentData.currentSum - k}
                        </span>
                    </div>
                </div>

                {/* Hash Map Visualization */}
                <div className="w-full max-w-xl bg-card rounded-xl border border-border overflow-hidden shadow-sm">
                    <div className="bg-secondary/50 px-4 py-2 border-b border-border text-xs font-semibold uppercase text-muted-foreground flex justify-between">
                        <span>Prefix Sum Map (Key → Val)</span>
                    </div>
                    <div className="p-4 flex flex-wrap gap-3 max-h-[200px] overflow-y-auto content-start">
                        {currentData.mapState && Array.from(currentData.mapState.entries()).map(([key, val]) => (
                            <div key={key} className={cn(
                                "flex flex-col items-center justify-center px-3 py-2 rounded-md border min-w-[60px] transition-colors duration-300",
                                currentData.highlightMapKey === key ? "bg-green-100 border-green-500 dark:bg-green-900/30 dark:border-green-500" : "bg-secondary/30 border-border"
                            )}>
                                <span className="text-sm font-bold">{key}</span>
                                <div className="h-[1px] w-full bg-border my-1" />
                                <span className="text-xs text-muted-foreground">{val}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Controls */}
                <ReplayControl
                    currentStep={currentStep}
                    totalSteps={steps.length}
                    isPlaying={isPlaying}
                    onPlayPause={() => setIsPlaying(!isPlaying)}
                    onStepChange={setCurrentStep}
                    className="absolute bottom-0 left-0 right-0"
                />
            </div>
        </div>
    );
};

export default SubarraySumK;
