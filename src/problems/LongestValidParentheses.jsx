
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Play, Pause, RotateCcw, ChevronRight, ChevronLeft, Layers } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '../components/ui/resizable';
import ProblemInfo from '../components/ProblemInfo';
import ReplayControl from '../components/ReplayControl';
import { cn } from '../lib/utils';
import './LongestValidParentheses.css';

const LongestValidParentheses = ({ problem }) => {
    const [inputStr, setInputStr] = useState("(()))())(");
    const [s, setS] = useState("(()))())(");
    const [currentStep, setCurrentStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [steps, setSteps] = useState([]);

    const timerRef = useRef(null);

    // Generate steps
    useEffect(() => {
        const trace = [];
        const stack = [-1];
        let maxLen = 0;

        // Initial state
        trace.push({
            i: -1,
            stack: [...stack],
            maxLen: 0,
            desc: "Initialize stack with -1 (base index). Max length = 0.",
            highlight: [],
            validRange: null
        });

        for (let i = 0; i < s.length; i++) {
            const char = s[i];

            trace.push({
                i: i,
                stack: [...stack],
                maxLen: maxLen,
                desc: `Scan index ${i}: Character '${char}'`,
                highlight: [i],
                validRange: null
            });

            if (char === '(') {
                stack.push(i);
                trace.push({
                    i: i,
                    stack: [...stack],
                    maxLen: maxLen,
                    desc: `Found '('. Push index ${i} to stack.`,
                    highlight: [i],
                    validRange: null,
                    action: 'push'
                });
            } else {
                stack.pop();
                trace.push({
                    i: i,
                    stack: [...stack],
                    maxLen: maxLen,
                    desc: `Found ')'. Pop top from stack.`,
                    highlight: [i],
                    validRange: null,
                    action: 'pop'
                });

                if (stack.length === 0) {
                    stack.push(i);
                    trace.push({
                        i: i,
                        stack: [...stack],
                        maxLen: maxLen,
                        desc: `Stack empty after pop. Push current index ${i} as new base for next valid string.`,
                        highlight: [i],
                        validRange: null,
                        action: 'push-base'
                    });
                } else {
                    const currentLen = i - stack[stack.length - 1];
                    const startIdx = stack[stack.length - 1] + 1;
                    const prevMax = maxLen;
                    maxLen = Math.max(maxLen, currentLen);

                    trace.push({
                        i: i,
                        stack: [...stack],
                        maxLen: maxLen,
                        desc: `Valid substring found from index ${startIdx} to ${i}. Length: ${i} - ${stack[stack.length - 1]} = ${currentLen}. ${currentLen > prevMax ? 'New Max!' : ''}`,
                        highlight: [i, stack[stack.length - 1]],
                        validRange: [startIdx, i],
                        action: 'calc'
                    });
                }
            }
        }

        trace.push({
            i: s.length,
            stack: [...stack],
            maxLen: maxLen,
            desc: `Traversal complete. Longest valid parentheses length: ${maxLen}.`,
            highlight: [],
            validRange: null,
            done: true
        });

        setSteps(trace);
        setCurrentStep(0);
        setIsPlaying(false);
    }, [s]);

    // Handle Input Update
    const handleUpdate = () => {
        // Validation: only ( and ) allowed
        const clean = inputStr.replace(/[^()]/g, '');
        if (clean !== inputStr) {
            setInputStr(clean);
        }
        setS(clean || "(()))())(");
    };

    // Playback Logic
    useEffect(() => {
        if (isPlaying) {
            timerRef.current = setInterval(() => {
                setCurrentStep(prev => {
                    if (prev < steps.length - 1) return prev + 1;
                    setIsPlaying(false);
                    return prev;
                });
            }, 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [isPlaying, steps.length]);

    const currentData = steps[currentStep] || { i: -1, stack: [], maxLen: 0, desc: '' };

    return (
        <div className="flex h-full w-full">
            <ResizablePanelGroup direction="horizontal" className="h-full w-full">
                <ResizablePanel defaultSize={25} minSize={20} maxSize={50} className="bg-background">
                    <Card className="viz-sidebar flex flex-col h-full rounded-none border-0 border-r-0 bg-background">
                        <CardHeader className="border-b border-border pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Layers className="w-5 h-5" />
                                Longest Valid Parentheses
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto space-y-6 pt-6">
                            <ProblemInfo problem={problem} />

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Input String (only '(' and ')')</label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={inputStr}
                                            onChange={(e) => setInputStr(e.target.value)}
                                            className="font-mono"
                                            placeholder="(()))())("
                                        />
                                        <Button onClick={handleUpdate} size="icon" variant="outline">
                                            <RefreshCw className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 rounded-lg bg-secondary border border-border mt-4">
                                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                    Current Max Length
                                </div>
                                <div className="text-3xl font-bold font-mono text-primary">
                                    {currentData.maxLen}
                                </div>
                            </div>

                            <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border leading-relaxed">
                                {currentData.desc}
                            </div>
                        </CardContent>
                    </Card>
                </ResizablePanel>

                <ResizableHandle withHandle />

                <ResizablePanel defaultSize={75}>
                    <div className="flex-1 flex flex-col relative h-full">
                        <div className="flex-1 flex flex-col items-center justify-start p-8 overflow-y-auto bg-dot-pattern">

                            {/* Main Viz Container */}
                            <div className="flex flex-col items-center gap-12 w-full max-w-4xl mt-8">

                                {/* String Strip */}
                                <div className="flex flex-wrap gap-2 justify-center relative p-8 rounded-xl bg-card border shadow-sm">
                                    <h3 className="absolute -top-3 left-4 bg-card px-2 text-xs font-semibold text-muted-foreground uppercase">String Indices</h3>
                                    {s.split('').map((char, idx) => {
                                        const isActive = currentData.i === idx;
                                        const isInValidRange = currentData.validRange && idx >= currentData.validRange[0] && idx <= currentData.validRange[1];
                                        const isStackTop = currentData.stack.length > 0 && currentData.stack[currentData.stack.length - 1] === idx;

                                        return (
                                            <motion.div
                                                key={idx}
                                                className={cn(
                                                    "lvp-char-box",
                                                    isActive && "active",
                                                    isInValidRange && "valid",
                                                    isActive && currentData.action === 'push-base' && "base-index"
                                                )}
                                                animate={{
                                                    scale: isActive ? 1.15 : 1,
                                                    borderColor: isInValidRange ? "hsl(142.1 76.2% 36.3%)" : isActive ? "hsl(var(--primary))" : "hsl(var(--border))"
                                                }}
                                            >
                                                {char}
                                                <span className="lvp-index-label">{idx}</span>

                                                {/* Stack Indicator */}
                                                {/* {isStackTop && (
                                                    <motion.div 
                                                        layoutId="stack-top"
                                                        className="absolute -top-2 -right-2 w-3 h-3 bg-red-500 rounded-full"
                                                    />
                                                )} */}
                                            </motion.div>
                                        );
                                    })}
                                </div>

                                {/* Stack Visualization */}
                                <div className="flex flex-col items-center gap-4 w-full max-w-md">
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Stack State (Indices)</h3>
                                    <div className="w-full min-h-[200px] bg-secondary/30 rounded-lg border-2 border-dashed border-border p-4 flex flex-col-reverse justify-start items-center gap-2">
                                        <AnimatePresence mode='popLayout'>
                                            {currentData.stack.map((idx, stackPos) => (
                                                <motion.div
                                                    key={`${idx}-${stackPos}`}
                                                    layout
                                                    initial={{ opacity: 0, y: -20, scale: 0.8 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                                                    className={cn(
                                                        "w-full max-w-[120px] py-2 px-4 rounded-md font-mono font-bold text-center border shadow-sm text-sm flex justify-between items-center",
                                                        idx === -1 ? "bg-muted text-muted-foreground border-dashed" : "bg-primary text-primary-foreground border-primary"
                                                    )}
                                                >
                                                    <span>{idx}</span>
                                                    {idx === -1 && <span className="text-[10px] opacity-60 ml-2">(Base)</span>}
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                        {currentData.stack.length === 0 && (
                                            <div className="text-muted-foreground text-sm italic py-4">Stack is empty</div>
                                        )}
                                    </div>
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

export default LongestValidParentheses;
