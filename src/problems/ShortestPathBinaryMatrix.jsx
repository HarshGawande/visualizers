import React, { useState, useEffect, useMemo, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import ReplayControl from '../components/ReplayControl';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { cn } from '../lib/utils';
import './ShortestPathBinaryMatrix.css';

const ShortestPathBinaryMatrix = ({ problem }) => {
    // Default grid: 0 = empty, 1 = blocked
    const defaultGrid = [
        [0, 0, 0],
        [1, 1, 0],
        [1, 1, 0]
    ];
    const [gridInput, setGridInput] = useState(JSON.stringify(defaultGrid));
    const [grid, setGrid] = useState(defaultGrid);

    // Playback
    const [currentStep, setCurrentStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(1);
    const timerRef = useRef(null);
    const inputRef = useRef(null);

    const parseInput = () => {
        try {
            const g = JSON.parse(inputRef.current.value);
            if (Array.isArray(g) && g.every(row => Array.isArray(row))) {
                setGridInput(inputRef.current.value);
                setGrid(g);
                setCurrentStep(0);
                setIsPlaying(false);
            }
        } catch (e) {
            console.error("Invalid input");
        }
    };

    const steps = useMemo(() => {
        const recordedSteps = [];
        const n = grid.length;
        if (n === 0) return [];
        const m = grid[0].length;

        const dist = Array.from({ length: n }, () => Array(m).fill(Infinity));
        const parent = Array.from({ length: n }, () => Array(m).fill(null));

        // Directions: 8-way
        const dirs = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1], [0, 1],
            [1, -1], [1, 0], [1, 1]
        ];

        const record = (type, data) => {
            // Flatten dist for easier state saving if needed, but here we just pass current snapshot
            // We need a deep copy of dist to visualize state at that time
            const distCopy = dist.map(row => [...row]);
            recordedSteps.push({
                type,
                dist: distCopy,
                ...data
            });
        };

        record('start', {
            description: "Initialize BFS. Check if start (0,0) or end (n-1,n-1) is blocked.",
            queue: [],
            active: null
        });

        if (grid[0][0] === 1 || grid[n - 1][m - 1] === 1) {
            record('finish', {
                description: "Start or End is blocked. path = -1.",
                pathFound: false
            });
            return recordedSteps;
        }

        const queue = [[0, 0]];
        dist[0][0] = 1;

        record('enqueue', {
            description: "Start at (0,0). Distance = 1.",
            queue: [...queue],
            active: [0, 0]
        });

        while (queue.length > 0) {
            const [r, c] = queue.shift();

            if (r === n - 1 && c === m - 1) {
                // Found path
                const path = [];
                let curr = [r, c];
                while (curr) {
                    path.push(curr);
                    curr = parent[curr[0]][curr[1]];
                }
                record('finish', {
                    description: `Reached target! Path length: ${dist[r][c]}.`,
                    path: path,
                    pathFound: true,
                    active: null,
                    queue: []
                });
                return recordedSteps;
            }

            record('process', {
                description: `Processing (${r}, ${c}). Checking neighbors...`,
                active: [r, c],
                queue: [...queue]
            });

            for (const [dr, dc] of dirs) {
                const nr = r + dr;
                const nc = c + dc;

                if (nr >= 0 && nr < n && nc >= 0 && nc < m && grid[nr][nc] === 0 && dist[nr][nc] === Infinity) {
                    dist[nr][nc] = dist[r][c] + 1;
                    parent[nr][nc] = [r, c];
                    queue.push([nr, nc]);
                    record('visit', {
                        description: `Visiting neighbor (${nr}, ${nc}). New dist: ${dist[nr][nc]}.`,
                        active: [r, c],
                        visiting: [nr, nc],
                        queue: [...queue]
                    });
                }
            }
        }

        record('finish', {
            description: "Queue empty. Target unreachable.",
            pathFound: false,
            active: null
        });

        return recordedSteps;
    }, [grid]);

    useEffect(() => {
        if (isPlaying) {
            timerRef.current = setInterval(() => {
                setCurrentStep((prev) => {
                    if (prev < steps.length - 1) return prev + 1;
                    setIsPlaying(false);
                    return prev;
                });
            }, 500 / speed); // Faster default speed for BFS
        }
        return () => clearInterval(timerRef.current);
    }, [isPlaying, steps.length, speed]);

    const currentData = steps[currentStep] || (steps.length > 0 ? steps[0] : {});

    // Helper to check if cell is in path
    const isPath = (r, c) => {
        if (!currentData.path) return false;
        return currentData.path.some(([pr, pc]) => pr === r && pc === c);
    };

    return (
        <div className="flex h-full w-full">
            <Card className="w-[350px] flex flex-col h-full rounded-none border-r border-border bg-background">
                <CardHeader className="border-b border-border pb-4">
                    <CardTitle className="text-lg">Shortest Path in Binary Matrix (1091)</CardTitle>
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
                            Grid (0=Empty, 1=Blocked)
                        </label>
                        <textarea
                            ref={inputRef}
                            defaultValue={gridInput}
                            className="w-full h-32 p-2 font-mono text-xs bg-muted border border-border rounded-md resize-none"
                        />
                        <Button onClick={parseInput} size="sm" variant="outline" className="w-full">
                            <RefreshCw className="mr-2 h-4 w-4" /> Update Grid
                        </Button>
                    </div>

                    <div className="p-4 rounded-lg bg-secondary border border-border">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                            Status
                        </div>
                        <div className="text-sm font-mono">
                            Queue Size: {currentData.queue?.length || 0}
                        </div>
                    </div>

                    <div className="text-sm text-balance text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border">
                        {currentData?.description || "Ready to start"}
                    </div>
                </CardContent>
            </Card>

            <div className="flex-1 flex flex-col relative">
                <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto">
                    {/* Grid Visualization */}
                    <div
                        className="grid-container"
                        style={{
                            gridTemplateColumns: `repeat(${grid[0]?.length || 1}, 40px)`
                        }}
                    >
                        {grid.map((row, r) => (
                            row.map((val, c) => {
                                const isStart = r === 0 && c === 0;
                                const isEnd = r === grid.length - 1 && c === grid[0].length - 1;
                                const distVal = currentData.dist ? currentData.dist[r][c] : Infinity;
                                const isVisited = distVal !== Infinity;
                                const isActive = currentData.active && currentData.active[0] === r && currentData.active[1] === c;
                                const isVisiting = currentData.visiting && currentData.visiting[0] === r && currentData.visiting[1] === c;
                                const isPathCell = isPath(r, c);

                                return (
                                    <div key={`${r}-${c}`} className={cn(
                                        "grid-cell",
                                        val === 1 && "blocked",
                                        isStart && "start",
                                        isEnd && "end",
                                        isVisited && !isStart && "visited",
                                        isPathCell && "path",
                                        (isActive || isVisiting) && "active"
                                    )}>
                                        {val === 1 ? '1' : (distVal !== Infinity ? distVal : '0')}
                                    </div>
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
        </div>
    );
};

export default ShortestPathBinaryMatrix;
