import React, { useState, useEffect, useMemo, useRef } from 'react';
import { RefreshCw, ArrowRight, ArrowDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '../components/ui/resizable';
import ProblemInfo from '../components/ProblemInfo';
import ReplayControl from '../components/ReplayControl';
import { cn } from '../lib/utils';
import './UniquePaths.css';

const MAX_ROWS = 10;
const MAX_COLS = 10;

const UniquePaths = ({ problem, isDarkMode }) => {
    const [m, setM] = useState(3);
    const [n, setN] = useState(7);

    // Inputs refs
    const mRef = useRef(null);
    const nRef = useRef(null);

    const [speed, setSpeed] = useState(1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const timerRef = useRef(null);

    const handleUpdateParams = () => {
        if (mRef.current && nRef.current) {
            let newM = parseInt(mRef.current.value, 10);
            let newN = parseInt(nRef.current.value, 10);

            // Constrain
            newM = Math.max(1, Math.min(newM, MAX_ROWS));
            newN = Math.max(1, Math.min(newN, MAX_COLS));

            setM(newM);
            setN(newN);
            setCurrentStep(0);
            setIsPlaying(false);
        }
    };

    // Algorithm & Steps
    const steps = useMemo(() => {
        const recorded = [];
        const record = (type, data) => recorded.push({ type, ...data });

        const dp = Array(m).fill().map(() => Array(n).fill(0));

        record('init', {
            grid: JSON.parse(JSON.stringify(dp)),
            description: `Initialize ${m}x${n} grid.`
        });

        // Base cases
        for (let i = 0; i < m; i++) dp[i][0] = 1;
        for (let j = 0; j < n; j++) dp[0][j] = 1;

        record('base-cases', {
            grid: JSON.parse(JSON.stringify(dp)),
            description: "Set first row and first column to 1 (only 1 way to reach them)"
        });

        for (let i = 1; i < m; i++) {
            for (let j = 1; j < n; j++) {
                // Focus Step
                record('calculate-focus', {
                    activeCell: [i, j],
                    parents: [[i - 1, j], [i, j - 1]],
                    grid: JSON.parse(JSON.stringify(dp)),
                    description: `Calculate paths for cell (${i}, ${j}): From Top (${dp[i - 1][j]}) + From Left (${dp[i][j - 1]})`
                });

                // Update Step
                dp[i][j] = dp[i - 1][j] + dp[i][j - 1];

                record('calculate-update', {
                    activeCell: [i, j],
                    parents: [[i - 1, j], [i, j - 1]],
                    grid: JSON.parse(JSON.stringify(dp)),
                    val: dp[i][j],
                    description: `Result for (${i}, ${j}) is ${dp[i][j]}`
                });
            }
        }

        record('finish', {
            grid: JSON.parse(JSON.stringify(dp)),
            result: dp[m - 1][n - 1],
            description: `Finished! Total unique paths: ${dp[m - 1][n - 1]}`
        });

        return recorded;
    }, [m, n]);

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
    const grid = currentData.grid || Array(m).fill().map(() => Array(n).fill(0));

    // Dynamic Cell Size
    // Max width ~ 700px, max height ~ 500px
    const cellWidth = Math.min(60, 700 / n);
    const cellHeight = Math.min(60, 500 / m);
    const cellSize = Math.min(cellWidth, cellHeight);

    const getCellState = (r, c) => {
        if (currentData.type === 'calculate-focus' || currentData.type === 'calculate-update') {
            if (currentData.activeCell[0] === r && currentData.activeCell[1] === c) return 'active';
            if (currentData.parents.some(p => p[0] === r && p[1] === c)) return 'parent';
        }
        if (currentData.type === 'finish' && r === m - 1 && c === n - 1) return 'result';
        return 'default';
    };

    return (
        <div className="viz-container flex h-full w-full">
            <ResizablePanelGroup direction="horizontal" className="h-full w-full">
                <ResizablePanel defaultSize={25} minSize={20} maxSize={50} className="bg-background">
                    <Card className="viz-sidebar flex flex-col h-full rounded-none border-0 border-r-0 bg-background">
                        <CardHeader className="border-b border-border pb-4">
                            <CardTitle className="text-lg">Unique Paths</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto space-y-6 pt-6">
                            <ProblemInfo problem={problem} />

                            <div className="rounded-lg bg-muted/50 border border-border p-4">
                                <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Algorithm Trace</h3>
                                <div className="text-sm font-mono text-balance text-foreground min-h-[40px]">
                                    {currentData.description || "Ready"}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-muted-foreground">Rows (m)</label>
                                        <Input ref={mRef} defaultValue={m} type="number" min="1" max={MAX_ROWS} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-muted-foreground">Cols (n)</label>
                                        <Input ref={nRef} defaultValue={n} type="number" min="1" max={MAX_COLS} />
                                    </div>
                                </div>
                                <Button onClick={handleUpdateParams} className="w-full" variant="outline">
                                    <RefreshCw className="h-4 w-4 mr-2" /> Update Grid
                                </Button>
                            </div>

                            {currentData.type && currentData.type.includes('calculate') && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs font-mono space-y-2"
                                >
                                    <div className="font-bold text-blue-500">Calculation:</div>
                                    <div className="flex items-center gap-2">
                                        <div className="p-1 px-2 rounded bg-background border flex flex-col items-center">
                                            <span className="text-[10px] text-muted-foreground">TOP</span>
                                            <span>{grid[currentData.activeCell[0] - 1]?.[currentData.activeCell[1]]}</span>
                                        </div>
                                        <span>+</span>
                                        <div className="p-1 px-2 rounded bg-background border flex flex-col items-center">
                                            <span className="text-[10px] text-muted-foreground">LEFT</span>
                                            <span>{grid[currentData.activeCell[0]]?.[currentData.activeCell[1] - 1]}</span>
                                        </div>
                                        <span>=</span>
                                        <div className="p-1 px-2 rounded bg-blue-500 text-white font-bold">
                                            {currentData.val !== undefined ? currentData.val : '?'}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </CardContent>
                    </Card>
                </ResizablePanel>

                <ResizableHandle withHandle />

                <ResizablePanel defaultSize={75}>
                    <div className="viz-main flex-1 flex flex-col relative h-full">
                        <div className="viz-canvas-area flex-1 relative overflow-auto flex items-center justify-center bg-zinc-50 dark:bg-zinc-950/50 p-8">
                            {/* GRID */}
                            <div
                                className="grid gap-1 relative"
                                style={{
                                    gridTemplateColumns: `repeat(${n}, ${cellSize}px)`
                                }}
                            >
                                {grid.map((row, r) => (
                                    row.map((val, c) => {
                                        const state = getCellState(r, c);
                                        return (
                                            <motion.div
                                                key={`${r}-${c}`}
                                                layout
                                                className={cn(
                                                    "rounded-md border flex items-center justify-center font-mono font-bold text-lg relative select-none shadow-sm",
                                                    state === 'active' ? "bg-blue-500 text-white border-blue-600 z-10 scale-110 shadow-lg" :
                                                        state === 'parent' ? "bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800" :
                                                            state === 'result' ? "bg-green-500 text-white border-green-600 scale-110 shadow-lg" :
                                                                "bg-card text-card-foreground"
                                                )}
                                                style={{ width: cellSize, height: cellSize }}
                                                animate={{
                                                    scale: state === 'active' || state === 'result' ? 1.1 : 1,
                                                    backgroundColor: state === 'active' ? '#3b82f6' :
                                                        state === 'parent' ? (isDarkMode ? '#1e3a8a' : '#dbeafe') :
                                                            state === 'result' ? '#22c55e' :
                                                                (isDarkMode ? '#18181b' : '#ffffff')
                                                }}
                                            >
                                                {val > 0 ? val : ''}

                                                {/* Robot Start Icon */}
                                                {r === 0 && c === 0 && (
                                                    <div className="absolute -top-1 -left-1 w-3 h-3 bg-primary rounded-full animate-pulse" />
                                                )}
                                                {/* Star End Icon */}
                                                {r === m - 1 && c === n - 1 && (
                                                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-yellow-500 rotate-45" />
                                                )}
                                            </motion.div>
                                        );
                                    })
                                ))}
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

export default UniquePaths;
