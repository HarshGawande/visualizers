import React, { useState, useEffect, useMemo, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import ReplayControl from '../components/ReplayControl';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { cn } from '../lib/utils';
import './WildcardMatching.css';
import ProblemInfo from '../components/ProblemInfo';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '../components/ui/resizable';

const WildcardMatching = ({ problem }) => {
    const [sInput, setSInput] = useState("aa");
    const [pInput, setPInput] = useState("*");
    const [s, setS] = useState("aa");
    const [p, setP] = useState("*");

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

        // Handle patterns like *, *? matching empty string (only * matches empty string in wildcard if we consider * matches empty seq)
        // Wait, * matches any sequence (including empty). ? matches any single char (cannot match empty).
        // So for dp[0][j], only if p[j-1] == '*' and dp[0][j-1] is true.

        for (let j = 1; j <= n; j++) {
            if (p[j - 1] === '*') {
                dp[0][j] = dp[0][j - 1]; // * matches empty sequence, so if prev matched empty, this one does too.
                record('init_row', 0, j, dp[0][j],
                    `Pattern character '*' can match empty sequence. If dp[0][${j - 1}] is T, then dp[0][${j}] is T.`,
                    [{ i: 0, j: j - 1 }]
                );
            } else {
                dp[0][j] = false;
                record('init_row', 0, j, false, `Pattern character '${p[j - 1]}' cannot match empty string. dp[0][${j}] = F`);
            }
        }

        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                const charS = s[i - 1];
                const charP = p[j - 1];

                if (charP === '?' || charP === charS) {
                    dp[i][j] = dp[i - 1][j - 1];
                    let desc = "";
                    if (charP === '?') desc = `'?' matches '${charS}'. Result from diagonal dp[${i - 1}][${j - 1}].`;
                    else desc = `'${charS}' matches '${charP}'. Result from diagonal dp[${i - 1}][${j - 1}].`;

                    record('match_char', i, j, dp[i][j], desc,
                        [{ i: i - 1, j: j - 1 }]
                    );
                } else if (charP === '*') {
                    // '*' matches empty sequence (dp[i][j-1]) OR '*' matches one more char (dp[i-1][j])
                    dp[i][j] = dp[i][j - 1] || dp[i - 1][j];

                    let desc = `Pattern is '*'. Matches empty sequence (check left, dp[${i}][${j - 1}]) OR matches sequence containing '${charS}' (check top, dp[${i - 1}][${j}]).`;

                    record('match_star', i, j, dp[i][j], desc,
                        [{ i: i, j: j - 1 }, { i: i - 1, j: j }]
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

    const currentData = steps[currentStep] || (steps.length > 0 ? steps[0] : null);

    if (!currentData) return <div>Loading...</div>;

    const m = s.length;
    const n = p.length;

    return (
        <div className="flex h-full w-full">
            <ResizablePanelGroup direction="horizontal" className="h-full w-full">
                <ResizablePanel defaultSize={25} minSize={20} maxSize={50} className="bg-background">
                    <Card className="viz-sidebar flex flex-col h-full rounded-none border-0 border-r-0 bg-background">
                        <CardHeader className="border-b border-border pb-4">
                            <CardTitle className="text-lg">Wildcard Matching (44)</CardTitle>
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
                                        placeholder="*"
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
                        <div className="flex-1 p-8 overflow-auto wildcard-matching-container">

                            <div className="dp-table-container">
                                <div className="dp-grid-wildcard" style={{
                                    gridTemplateColumns: `repeat(${n + 2}, auto)`
                                }}>
                                    {/* Header Row: Empty, Empty (for s empty), p chars */}
                                    <div className="dp-cell-wildcard header"></div>
                                    <div className="dp-cell-wildcard header">""</div>
                                    {p.split('').map((char, idx) => (
                                        <div key={`col-${idx}`} className="dp-cell-wildcard header">{char}</div>
                                    ))}

                                    {/* Row for Empty s */}
                                    <div className="dp-cell-wildcard header">""</div>
                                    {currentData.dp[0].map((val, colIdx) => {
                                        const isActive = currentData.activeCell.i === 0 && currentData.activeCell.j === colIdx;
                                        const isHighlight = currentData.highlights.some(h => h.i === 0 && h.j === colIdx);
                                        return (
                                            <div key={`cell-0-${colIdx}`} className={cn(
                                                "dp-cell-wildcard",
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
                                            <div className="dp-cell-wildcard header">{char}</div>
                                            {currentData.dp[rowIdx + 1].map((val, colIdx) => {
                                                const isActive = currentData.activeCell.i === rowIdx + 1 && currentData.activeCell.j === colIdx;
                                                const isHighlight = currentData.highlights.some(h => h.i === rowIdx + 1 && h.j === colIdx);
                                                return (
                                                    <div key={`cell-${rowIdx + 1}-${colIdx}`} className={cn(
                                                        "dp-cell-wildcard",
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

export default WildcardMatching;
