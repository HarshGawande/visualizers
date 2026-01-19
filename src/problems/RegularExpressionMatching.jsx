import React, { useState, useEffect, useMemo, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import ReplayControl from '../components/ReplayControl';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { cn } from '../lib/utils';
import './RegularExpressionMatching.css';
import ProblemInfo from '../components/ProblemInfo';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '../components/ui/resizable';

const RegularExpressionMatching = ({ problem }) => {
    const [sInput, setSInput] = useState("aa");
    const [pInput, setPInput] = useState("a*");
    const [s, setS] = useState("aa");
    const [p, setP] = useState("a*");

    // Playback state
    const [currentStep, setCurrentStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(1);
    const timerRef = useRef(null);

    // Inputs
    const sRef = useRef(null);
    const pRef = useRef(null);

    const parseInput = () => {
        setSInput(sRef.current.value);
        setPInput(pRef.current.value);
        setS(sRef.current.value);
        setP(pRef.current.value);
        setCurrentStep(0);
        setIsPlaying(false);
    };

    const steps = useMemo(() => {
        const recordedSteps = [];
        const m = s.length;
        const n = p.length;

        // Initialize DP table
        // dp[i][j] stores boolean
        const dp = Array(m + 1).fill().map(() => Array(n + 1).fill(false));

        const record = (type, i, j, val, desc, highlights = []) => {
            recordedSteps.push({
                type,
                dp: dp.map(row => [...row]),
                activeCell: { i, j },
                val,
                description: desc,
                highlights
            });
        };

        // Base case: empty string matches empty pattern
        dp[0][0] = true;
        record('init', 0, 0, true, "Empty string matches empty pattern. dp[0][0] = T");

        // Handle patterns like a*, a*b*, etc. matching empty string
        for (let j = 1; j <= n; j++) {
            if (p[j - 1] === '*') {
                dp[0][j] = dp[0][j - 2];
                record('init_row', 0, j, dp[0][j],
                    `Pattern '${p[j - 2]}*' can match empty string if '${p.substring(0, j - 2)}' (dp[0][${j - 2}]) matches. dp[0][${j}] = ${dp[0][j] ? 'T' : 'F'}`,
                    [{ i: 0, j: j - 2 }]
                );
            } else {
                record('init_row', 0, j, false, `Pattern '${p.substring(0, j)}' cannot match empty string (unless it ends in *). dp[0][${j}] = F`);
            }
        }

        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                const charS = s[i - 1];
                const charP = p[j - 1];

                if (charP === '.' || charP === charS) {
                    dp[i][j] = dp[i - 1][j - 1];
                    record('match_char', i, j, dp[i][j],
                        `'${charS}' matches '${charP}'. Take value from diagonal dp[${i - 1}][${j - 1}].`,
                        [{ i: i - 1, j: j - 1 }]
                    );
                } else if (charP === '*') {
                    // Check zero occurrences
                    const zeroOcccur = dp[i][j - 2];

                    // Check one or more occurrences
                    const prevCharP = p[j - 2];
                    const matchChar = (prevCharP === s[i - 1] || prevCharP === '.');
                    const oneOrMore = matchChar && dp[i - 1][j];

                    dp[i][j] = zeroOcccur || oneOrMore;

                    let desc = `Pattern char is '*'. `;
                    if (zeroOcccur) {
                        desc += `Matches 0 occurrences of '${prevCharP}' (checked dp[${i}][${j - 2}] = T).`;
                    } else if (oneOrMore) {
                        desc += `Matches 1+ occurrences of '${prevCharP}' (char match & dp[${i - 1}][${j}] = T).`;
                    } else {
                        desc += `Matches neither 0 occurrences (dp[${i}][${j - 2}] is F) nor 1+ occurrences.`;
                    }

                    record('match_star', i, j, dp[i][j], desc,
                        [{ i: i, j: j - 2 }, { i: i - 1, j: j }]
                    );
                } else {
                    dp[i][j] = false;
                    record('no_match', i, j, false, `'${charS}' does not match '${charP}'.`);
                }
            }
        }

        // Final step
        record('finish', m, n, dp[m][n], `Finished. Result: ${dp[m][n] ? 'Match' : 'No Match'}`);

        return recordedSteps;
    }, [s, p]);

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

    // Safety check if steps input changed fast
    const currentData = steps[currentStep] || (steps.length > 0 ? steps[0] : null);

    if (!currentData) return <div>Loading...</div>;

    // Grid rendering helper
    const m = s.length;
    const n = p.length;

    return (
        <div className="flex h-full w-full">
            <ResizablePanelGroup direction="horizontal" className="h-full w-full">
                <ResizablePanel defaultSize={25} minSize={20} maxSize={50} className="bg-background">
                    <Card className="viz-sidebar flex flex-col h-full rounded-none border-0 border-r-0 bg-background">
                        <CardHeader className="border-b border-border pb-4">
                            <CardTitle className="text-lg">Regular Expression Matching (10)</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto space-y-6 pt-6">
                            <ProblemInfo problem={problem} />
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-muted-foreground block">
                                    String (s)
                                </label>
                                <Input
                                    ref={sRef}
                                    defaultValue={sInput}
                                    placeholder="aa"
                                    className="font-mono text-xs"
                                />
                                <label className="text-sm font-medium text-muted-foreground block">
                                    Pattern (p)
                                </label>
                                <div className="flex gap-2">
                                    <Input
                                        ref={pRef}
                                        defaultValue={pInput}
                                        placeholder="a*"
                                        className="font-mono text-xs"
                                    />
                                    <Button onClick={parseInput} size="icon" variant="outline">
                                        <RefreshCw className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="p-4 rounded-lg bg-secondary border border-border">
                                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                                    Is Match?
                                </div>
                                <div className={cn(
                                    "text-3xl font-bold font-mono transition-colors",
                                    currentData.val ? "text-green-500" : "text-red-500"
                                )}>
                                    {currentData.val ? "TRUE" : "FALSE"}
                                </div>
                            </div>

                            <div className="text-sm text-balance text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border">
                                {currentData.description}
                            </div>
                        </CardContent>
                    </Card>
                </ResizablePanel>

                <ResizableHandle withHandle />

                <ResizablePanel defaultSize={75}>
                    <div className="flex-1 flex flex-col relative h-full">
                        <div className="flex-1 p-8 overflow-auto regex-matching-container">

                            <div className="dp-table-container">
                                {/* Grid container with dynamic columns: 1 for row header + n+1 for p (start empty + chars) */}
                                <div className="dp-grid-regex" style={{
                                    gridTemplateColumns: `repeat(${n + 2}, auto)`
                                }}>
                                    {/* Header Row: Empty, Empty (for s empty), p chars */}
                                    <div className="dp-cell-regex header"></div>
                                    <div className="dp-cell-regex header">""</div>
                                    {p.split('').map((char, idx) => (
                                        <div key={`col-${idx}`} className="dp-cell-regex header">{char}</div>
                                    ))}

                                    {/* Rows */}
                                    {/* Row for Empty s */}
                                    <div className="dp-cell-regex header">""</div>
                                    {currentData.dp[0].map((val, colIdx) => {
                                        const isActive = currentData.activeCell.i === 0 && currentData.activeCell.j === colIdx;
                                        const isHighlight = currentData.highlights.some(h => h.i === 0 && h.j === colIdx);
                                        return (
                                            <div key={`cell-0-${colIdx}`} className={cn(
                                                "dp-cell-regex",
                                                val ? "true" : "false",
                                                isActive && "active",
                                                isHighlight && "highlight"
                                            )}>
                                                {val === true ? "T" : (val === false ? "F" : "")}
                                            </div>
                                        );
                                    })}

                                    {/* Rows for s chars */}
                                    {s.split('').map((char, rowIdx) => (
                                        <React.Fragment key={`row-${rowIdx}`}>
                                            <div className="dp-cell-regex header">{char}</div>
                                            {currentData.dp[rowIdx + 1].map((val, colIdx) => {
                                                const isActive = currentData.activeCell.i === rowIdx + 1 && currentData.activeCell.j === colIdx;
                                                const isHighlight = currentData.highlights.some(h => h.i === rowIdx + 1 && h.j === colIdx);
                                                return (
                                                    <div key={`cell-${rowIdx + 1}-${colIdx}`} className={cn(
                                                        "dp-cell-regex",
                                                        val ? "true" : "false",
                                                        isActive && "active",
                                                        isHighlight && "highlight"
                                                    )}>
                                                        {val === true ? "T" : (val === false ? "F" : "")}
                                                    </div>
                                                );
                                            })}
                                        </React.Fragment>
                                    ))}
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

export default RegularExpressionMatching;
