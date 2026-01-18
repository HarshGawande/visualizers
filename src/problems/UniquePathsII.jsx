import React, { useState, useEffect, useMemo, useRef } from 'react';
import { RefreshCw, Play, Pause, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '../components/ui/resizable';
import ProblemInfo from '../components/ProblemInfo';
import ReplayControl from '../components/ReplayControl';
import { cn } from '../lib/utils';
import './UniquePathsII.css';

const MAX_ROWS = 8;
const MAX_COLS = 8;

const UniquePathsII = ({ problem, isDarkMode }) => {
    // Grid Setup State
    const [rows, setRows] = useState(3);
    const [cols, setCols] = useState(3);
    const [obstacleGrid, setObstacleGrid] = useState([
        [0, 0, 0],
        [0, 1, 0],
        [0, 0, 0]
    ]);
    const [isSetupMode, setIsSetupMode] = useState(true);

    // Playback State
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [speed, setSpeed] = useState(1);
    const timerRef = useRef(null);

    // Refs for inputs
    const rowsRef = useRef(null);
    const colsRef = useRef(null);

    // Initialize/Resize Grid
    useEffect(() => {
        // When rows/cols change, preserve existing obstacles if possible
        const newGrid = Array(rows).fill().map((_, r) =>
            Array(cols).fill().map((_, c) =>
                (obstacleGrid[r] && obstacleGrid[r][c] !== undefined) ? obstacleGrid[r][c] : 0
            )
        );
        setObstacleGrid(newGrid);
        setIsSetupMode(true);
        setCurrentStep(0);
        setIsPlaying(false);
    }, [rows, cols]);

    const handleResize = () => {
        if (rowsRef.current && colsRef.current) {
            let r = parseInt(rowsRef.current.value, 10);
            let c = parseInt(colsRef.current.value, 10);
            r = Math.max(1, Math.min(r, MAX_ROWS));
            c = Math.max(1, Math.min(c, MAX_COLS));
            setRows(r);
            setCols(c);
        }
    };

    const toggleObstacle = (r, c) => {
        if (!isSetupMode) return;
        // Don't allow blocking start or end ideally, but LeetCode allows it (result 0)
        const newGrid = [...obstacleGrid];
        newGrid[r] = [...newGrid[r]];
        newGrid[r][c] = newGrid[r][c] === 1 ? 0 : 1;
        setObstacleGrid(newGrid);
    };

    const handleRun = () => {
        setIsSetupMode(false);
        setCurrentStep(0);
        setIsPlaying(true);
    };

    const handleReset = () => {
        setIsSetupMode(true);
        setCurrentStep(0);
        setIsPlaying(false);
    };

    // Algorithm Trace
    const steps = useMemo(() => {
        if (isSetupMode) return []; // Only generate steps when running

        const recorded = [];
        const record = (type, data) => recorded.push({ type, ...data });

        const m = rows;
        const n = cols;
        const dp = Array(m).fill().map(() => Array(n).fill(null)); // Use null for uncomputed

        record('init', {
            grid: JSON.parse(JSON.stringify(dp)),
            description: "Initialized DP grid. Checking start position..."
        });

        // Start
        if (obstacleGrid[0][0] === 1) {
            dp[0][0] = 0;
            record('start-blocked', {
                grid: JSON.parse(JSON.stringify(dp)),
                activeCell: [0, 0],
                description: "Start position has an obstacle! Paths: 0."
            });
        } else {
            dp[0][0] = 1;
            record('start', {
                grid: JSON.parse(JSON.stringify(dp)),
                activeCell: [0, 0],
                description: "Start position free. Paths: 1."
            });
        }

        for (let i = 0; i < m; i++) {
            for (let j = 0; j < n; j++) {
                if (i === 0 && j === 0) continue;

                // Steps for each cell
                if (obstacleGrid[i][j] === 1) {
                    dp[i][j] = 0;
                    record('obstacle', {
                        grid: JSON.parse(JSON.stringify(dp)),
                        activeCell: [i, j],
                        description: `Cell (${i}, ${j}) is an obstacle. Paths: 0.`
                    });
                } else {
                    const top = i > 0 ? dp[i - 1][j] : 0;
                    const left = j > 0 ? dp[i][j - 1] : 0;

                    // Highlight dependencies
                    record('calc-focus', {
                        grid: JSON.parse(JSON.stringify(dp)),
                        activeCell: [i, j],
                        parents: [[i - 1, j], [i, j - 1]].filter(([r, c]) => r >= 0 && c >= 0),
                        vals: { top, left },
                        description: `Calculating (${i}, ${j}): Top(${top}) + Left(${left})`
                    });

                    dp[i][j] = top + left;

                    record('calc-update', {
                        grid: JSON.parse(JSON.stringify(dp)),
                        activeCell: [i, j],
                        val: dp[i][j],
                        description: `Cell (${i}, ${j}) paths: ${dp[i][j]}`
                    });
                }
            }
        }

        record('finish', {
            grid: JSON.parse(JSON.stringify(dp)),
            result: dp[m - 1][n - 1],
            description: `Finished! Total unique paths with obstacles: ${dp[m - 1][n - 1]}`
        });

        return recorded;
    }, [obstacleGrid, rows, cols, isSetupMode]);

    // Playback Loop
    useEffect(() => {
        if (isPlaying && !isSetupMode) {
            timerRef.current = setInterval(() => {
                setCurrentStep(prev => {
                    if (prev < steps.length - 1) return prev + 1;
                    setIsPlaying(false);
                    return prev;
                });
            }, 1000 / speed);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [isPlaying, steps.length, speed, isSetupMode]);

    const currentData = steps[currentStep] || {};
    // Use DP grid from steps if running, else use obstacle grid for setup
    const displayGrid = isSetupMode
        ? obstacleGrid
        : (currentData.grid || Array(rows).fill().map(() => Array(cols).fill(null)));

    // Stylers
    const getCellClass = (r, c) => {
        if (isSetupMode) {
            return obstacleGrid[r][c] === 1 ? 'bg-destructive/80' : 'bg-card hover:bg-accent cursor-pointer';
        }

        // Running Mode
        if (obstacleGrid[r][c] === 1) return 'bg-destructive/80'; // Always show obstacle

        const isNull = displayGrid[r][c] === null;
        if (isNull) return 'bg-muted/30';

        if (currentData.activeCell && currentData.activeCell[0] === r && currentData.activeCell[1] === c) {
            return 'bg-primary text-primary-foreground scale-110 shadow-lg z-10';
        }

        if (currentData.parents && currentData.parents.some(([pr, pc]) => pr === r && pc === c)) {
            return 'bg-blue-100 dark:bg-blue-900/40 border-blue-500';
        }

        if (currentData.type === 'finish' && r === rows - 1 && c === cols - 1) {
            return 'bg-green-500 text-white shadow-lg scale-110';
        }

        return 'bg-card';
    };

    return (
        <div className="viz-container flex h-full w-full">
            <ResizablePanelGroup direction="horizontal" className="h-full w-full">
                <ResizablePanel defaultSize={25} minSize={20} maxSize={50} className="bg-background">
                    <Card className="viz-sidebar flex flex-col h-full rounded-none border-0 border-r-0 bg-background">
                        <CardHeader className="border-b border-border pb-4">
                            <CardTitle className="text-lg">Unique Paths II</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto space-y-6 pt-6">
                            <ProblemInfo problem={problem} />

                            {/* Setup Controls */}
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-muted-foreground">Rows</label>
                                        <Input ref={rowsRef} defaultValue={rows} type="number" min="1" max={MAX_ROWS} disabled={!isSetupMode} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-muted-foreground">Cols</label>
                                        <Input ref={colsRef} defaultValue={cols} type="number" min="1" max={MAX_COLS} disabled={!isSetupMode} />
                                    </div>
                                </div>

                                {isSetupMode ? (
                                    <div className="flex gap-2">
                                        <Button onClick={handleResize} variant="outline" className="flex-1">
                                            Resize
                                        </Button>
                                        <Button onClick={handleRun} className="flex-1">
                                            <Play className="h-4 w-4 mr-2" /> Start
                                        </Button>
                                    </div>
                                ) : (
                                    <Button onClick={handleReset} variant="destructive" className="w-full">
                                        <RotateCcw className="h-4 w-4 mr-2" /> Edit Grid
                                    </Button>
                                )}
                            </div>

                            {/* Info Box */}
                            <div className="rounded-lg bg-muted/50 border border-border p-4">
                                <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                                    {isSetupMode ? "Setup Mode" : "Simulation"}
                                </h3>
                                <div className="text-sm font-mono text-balance text-foreground min-h-[40px]">
                                    {isSetupMode
                                        ? "Click on grid cells to toggle obstacles (red blocks). Click Start when ready."
                                        : (currentData.description || "Running...")}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </ResizablePanel>

                <ResizableHandle withHandle />

                <ResizablePanel defaultSize={75}>
                    <div className="viz-main flex-1 flex flex-col relative h-full">
                        <div className="viz-canvas-area flex-1 relative overflow-auto flex items-center justify-center bg-zinc-50 dark:bg-zinc-950/50 p-8">
                            <div
                                className="grid gap-2"
                                style={{
                                    gridTemplateColumns: `repeat(${cols}, minmax(50px, 80px))`,
                                    gridTemplateRows: `repeat(${rows}, minmax(50px, 80px))`
                                }}
                            >
                                {Array(rows).fill().map((_, r) => (
                                    Array(cols).fill().map((_, c) => {
                                        const cellVal = isSetupMode
                                            ? (obstacleGrid[r][c] === 1 ? "X" : "")
                                            : (displayGrid[r][c] === null ? "" : displayGrid[r][c]);

                                        return (
                                            <motion.div
                                                key={`${r}-${c}`}
                                                layout
                                                onClick={() => toggleObstacle(r, c)}
                                                className={cn(
                                                    "rounded-md border-2 flex items-center justify-center font-bold text-xl select-none transition-colors duration-300",
                                                    getCellClass(r, c)
                                                )}
                                                whileHover={isSetupMode ? { scale: 0.95 } : {}}
                                            >
                                                {/* Start/End Markers */}
                                                {r === 0 && c === 0 && (
                                                    <span className="absolute text-[10px] top-1 left-1 opacity-50">START</span>
                                                )}
                                                {r === rows - 1 && c === cols - 1 && (
                                                    <span className="absolute text-[10px] bottom-1 right-1 opacity-50">END</span>
                                                )}

                                                {obstacleGrid[r][c] === 1 ? (
                                                    <div className="w-8 h-8 rounded bg-black/20 dark:bg-black/40" />
                                                ) : (
                                                    <span>{cellVal}</span>
                                                )}
                                            </motion.div>
                                        );
                                    })
                                ))}
                            </div>
                        </div>

                        {!isSetupMode && (
                            <ReplayControl
                                currentStep={currentStep}
                                totalSteps={steps.length}
                                isPlaying={isPlaying}
                                onPlayPause={() => setIsPlaying(!isPlaying)}
                                onStepChange={setCurrentStep}
                            />
                        )}
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
};

export default UniquePathsII;
