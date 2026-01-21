
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Calculator, X, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '../components/ui/resizable';
import ProblemInfo from '../components/ProblemInfo';
import ReplayControl from '../components/ReplayControl';
import { cn } from '../lib/utils';
import './PowXN.css';

const PowXN = ({ problem }) => {
    const [xInput, setXInput] = useState("2.1000");
    const [nInput, setNInput] = useState("10");
    const [x, setX] = useState(2.1);
    const [n, setN] = useState(10);
    const [currentStep, setCurrentStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [steps, setSteps] = useState([]);

    // Timer ref for playback
    const timerRef = useRef(null);

    // Generate steps
    useEffect(() => {
        const trace = [];
        let currX = x;
        let currN = n;
        let ans = 1;

        const format = (num) => typeof num === 'number' ? num.toFixed(5).replace(/\.?0+$/, '') : num;

        trace.push({
            type: 'init',
            x: currX,
            n: currN,
            ans: ans,
            desc: `Initial state: x = ${format(currX)}, n = ${currN}`,
            highlight: 'none'
        });

        if (currN < 0) {
            currX = 1 / currX;
            currN = -currN;
            trace.push({
                type: 'invert',
                x: currX,
                n: currN,
                ans: ans,
                desc: `Exponent is negative. Invert Base: x = 1/x = ${format(currX)}, n = ${currN}`,
                highlight: 'x'
            });
        }

        while (currN > 0) {
            // Check odd
            if (currN % 2 !== 0) {
                const prevAns = ans;
                ans = ans * currX;
                trace.push({
                    type: 'mult',
                    x: currX,
                    n: currN,
                    ans: ans,
                    prevAns: prevAns,
                    desc: `n (${currN}) is odd. Multiply result by x: ${format(prevAns)} * ${format(currX)} = ${format(ans)}`,
                    highlight: 'ans'
                });
            } else {
                trace.push({
                    type: 'check',
                    x: currX,
                    n: currN,
                    ans: ans,
                    desc: `n (${currN}) is even. No change to result.`,
                    highlight: 'n'
                });
            }

            // Square x
            const prevX = currX;
            currX = currX * currX;
            const prevN = currN;
            currN = Math.floor(currN / 2);

            if (currN > 0 || prevN > 1) { // If it wasn't the last step
                trace.push({
                    type: 'square',
                    x: currX,
                    n: currN,
                    ans: ans,
                    desc: `Square x: ${format(prevX)}² = ${format(currX)}. Halve n: ${prevN} / 2 = ${currN}`,
                    highlight: 'x'
                });
            }
        }

        trace.push({
            type: 'done',
            x: currX,
            n: 0,
            ans: ans,
            desc: `Calculation complete. Result = ${format(ans)}`,
            highlight: 'all'
        });

        setSteps(trace);
        setCurrentStep(0);
        setIsPlaying(false);
    }, [x, n]);

    // Handle Input Submit
    const handleUpdate = () => {
        const newX = parseFloat(xInput);
        const newN = parseInt(nInput);
        if (!isNaN(newX) && !isNaN(newN)) {
            setX(newX);
            setN(newN);
        }
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

    const currentData = steps[currentStep] || { x: 0, n: 0, ans: 0, desc: '' };

    return (
        <div className="flex h-full w-full">
            <ResizablePanelGroup direction="horizontal" className="h-full w-full">
                <ResizablePanel defaultSize={20} minSize={20} maxSize={50} className="bg-background">
                    <Card className="viz-sidebar flex flex-col h-full rounded-none border-0 border-r-0 bg-background">
                        <CardHeader className="border-b border-border pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Calculator className="w-5 h-5" />
                                Pow(x, n)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto space-y-6 pt-6">
                            <ProblemInfo problem={problem} />

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Base (x)</label>
                                    <Input
                                        value={xInput}
                                        onChange={(e) => setXInput(e.target.value)}
                                        className="font-mono"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Exponent (n)</label>
                                    <Input
                                        value={nInput}
                                        type="number"
                                        onChange={(e) => setNInput(e.target.value)}
                                        className="font-mono"
                                    />
                                </div>
                                <Button onClick={handleUpdate} className="w-full">
                                    <RefreshCw className="mr-2 h-4 w-4" /> Update
                                </Button>
                            </div>

                            <div className="p-4 rounded-lg bg-secondary border border-border mt-4">
                                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                    Current Result
                                </div>
                                <div className="text-2xl font-bold font-mono text-primary text-ellipsis overflow-hidden">
                                    {typeof currentData.ans === 'number' ? currentData.ans.toFixed(5).replace(/\.?0+$/, '') : currentData.ans}
                                </div>
                            </div>

                            <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border">
                                {currentData.desc}
                            </div>
                        </CardContent>
                    </Card>
                </ResizablePanel>

                <ResizableHandle withHandle />

                <ResizablePanel defaultSize={80}>
                    <div className="flex-1 flex flex-col relative h-full">
                        <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto bg-dot-pattern">

                            {/* Visualization Area */}
                            <div className="flex gap-8 items-start mb-12">
                                {/* Base X Card */}
                                <motion.div
                                    className={cn(
                                        "p-6 rounded-xl border-2 bg-card min-w-[180px] flex flex-col items-center gap-2 transition-colors",
                                        (currentData.highlight === 'x' || currentData.highlight === 'all') ? "border-primary shadow-[0_0_20px_rgba(59,130,246,0.2)]" : "border-border"
                                    )}
                                    layout
                                >
                                    <span className="text-sm text-muted-foreground font-semibold uppercase">Current Base (x)</span>
                                    <AnimatePresence mode='wait'>
                                        <motion.div
                                            key={currentData.x}
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            exit={{ y: -20, opacity: 0 }}
                                            className="text-4xl font-mono font-bold"
                                        >
                                            {typeof currentData.x === 'number' ? currentData.x.toFixed(4).replace(/\.?0+$/, '') : currentData.x}
                                        </motion.div>
                                    </AnimatePresence>
                                </motion.div>

                                {/* Operation Arrow */}
                                <div className="h-[120px] flex items-center justify-center text-muted-foreground">
                                    <ArrowRight className="w-8 h-8 opacity-50" />
                                </div>

                                {/* Exponent N Card */}
                                <motion.div
                                    className={cn(
                                        "p-6 rounded-xl border-2 bg-card min-w-[180px] flex flex-col items-center gap-2 transition-colors",
                                        (currentData.highlight === 'n' || currentData.highlight === 'all') ? "border-primary shadow-[0_0_20px_rgba(59,130,246,0.2)]" : "border-border"
                                    )}
                                    layout
                                >
                                    <span className="text-sm text-muted-foreground font-semibold uppercase">Exponent (n)</span>
                                    <AnimatePresence mode='wait'>
                                        <motion.div
                                            key={currentData.n}
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 1.2, opacity: 0 }}
                                            className="text-4xl font-mono font-bold"
                                        >
                                            {currentData.n}
                                        </motion.div>
                                    </AnimatePresence>

                                    {/* Binary Visualization of n */}
                                    <div className="flex gap-1 mt-2">
                                        {Math.abs(currentData.n).toString(2).split('').map((bit, i) => (
                                            <div key={i} className={cn(
                                                "w-2 h-2 rounded-full",
                                                bit === '1' ? "bg-primary" : "bg-muted"
                                            )} />
                                        ))}
                                    </div>
                                </motion.div>
                            </div>

                            {/* Result Area */}
                            <motion.div
                                className={cn(
                                    "p-8 rounded-2xl border-2 bg-secondary/50 backdrop-blur min-w-[300px] flex flex-col items-center gap-3",
                                    (currentData.highlight === 'ans' || currentData.highlight === 'all') ? "border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.15)]" : "border-border"
                                )}
                            >
                                <span className="text-sm text-muted-foreground font-semibold uppercase tracking-widest">Accumulated Result</span>
                                <AnimatePresence mode='wait'>
                                    <motion.div
                                        key={currentData.ans}
                                        initial={{ filter: "blur(10px)", opacity: 0 }}
                                        animate={{ filter: "blur(0px)", opacity: 1 }}
                                        className="text-5xl font-mono font-black text-primary"
                                    >
                                        {typeof currentData.ans === 'number' ? currentData.ans.toFixed(5).replace(/\.?0+$/, '') : currentData.ans}
                                    </motion.div>
                                </AnimatePresence>
                            </motion.div>

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

export default PowXN;
