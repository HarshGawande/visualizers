import React, { useState, useEffect, useMemo, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import ReplayControl from '../components/ReplayControl';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { cn } from '../lib/utils';
import './LengthOfLastWord.css';
import ProblemInfo from '../components/ProblemInfo';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '../components/ui/resizable';

const LengthOfLastWord = ({ problem }) => {
    const [stringInput, setStringInput] = useState("Hello World   ");
    const [inputString, setInputString] = useState("Hello World   ");

    // Playback state
    const [currentStep, setCurrentStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(1);
    const timerRef = useRef(null);

    // Inputs
    const stringRef = useRef(null);

    const parseInput = () => {
        const val = stringRef.current.value;
        setStringInput(val);
        setInputString(val);
        setCurrentStep(0);
        setIsPlaying(false);
    };

    const steps = useMemo(() => {
        const recordedSteps = [];
        const s = inputString;
        let length = 0;

        // Track status of each index: 'default', 'skipped', 'counted', 'current'
        const indexStatus = new Array(s.length).fill('default');

        const record = (type, data) => {
            recordedSteps.push({
                type,
                length,
                indexStatus: [...indexStatus], // Snapshot
                ...data
            });
        };

        record('start', {
            description: `Start with string: "${s}"`,
            currentIndex: null,
            state: 'start'
        });

        let i = s.length - 1;

        // Step 1: Skip trailing spaces
        record('info', {
            description: "Starting from the end, skip any trailing spaces.",
            currentIndex: i,
            state: 'skipping'
        });

        while (i >= 0 && s[i] === ' ') {
            indexStatus[i] = 'skipped';
            record('skip', {
                description: `Index ${i} is a space, skipping...`,
                currentIndex: i,
                state: 'skipping'
            });
            i--;
        }

        // Step 2: Count last word
        if (i >= 0) {
            record('info', {
                description: `Found a non-space character at index ${i}. Start counting length.`,
                currentIndex: i,
                state: 'counting'
            });
        } else {
            record('finish', {
                description: "String contained only spaces. Length is 0.",
                currentIndex: null,
                state: 'finished',
                length: 0
            });
            return recordedSteps;
        }

        while (i >= 0 && s[i] !== ' ') {
            length++;
            indexStatus[i] = 'counted';
            record('count', {
                description: `Character '${s[i]}' at index ${i}. Length is now ${length}.`,
                currentIndex: i,
                state: 'counting',
                length: length
            });
            i--;
        }

        // Step 3: Finish
        record('finish', {
            description: `Encountered space or start of string. Final length of last word is ${length}.`,
            currentIndex: i,
            state: 'finished',
            length: length
        });

        return recordedSteps;
    }, [inputString]);

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
    const isFinished = currentData.type === 'finish';

    return (
        <div className="flex h-full w-full">
            <ResizablePanelGroup direction="horizontal" className="h-full w-full">
                <ResizablePanel defaultSize={20} minSize={20} maxSize={50} className="bg-background">
                    <Card className="viz-sidebar flex flex-col h-full rounded-none border-0 border-r-0 bg-background">
                        <CardHeader className="border-b border-border pb-4">
                            <CardTitle className="text-lg">Length of Last Word (58)</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto space-y-6 pt-6">
                            <ProblemInfo problem={problem} />
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-muted-foreground block">
                                    Input String
                                </label>
                                <div className="flex gap-2">
                                    <Input
                                        ref={stringRef}
                                        defaultValue={stringInput}
                                        placeholder="Hello World"
                                        className="font-mono text-xs"
                                    />
                                    <Button onClick={parseInput} size="icon" variant="outline">
                                        <RefreshCw className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="p-4 rounded-lg bg-secondary border border-border">
                                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                                    Current Length
                                </div>
                                <div className={cn(
                                    "text-3xl font-bold font-mono transition-colors",
                                    isFinished ? "text-green-500" : "text-primary"
                                )}>
                                    {currentData.length}
                                </div>
                            </div>

                            <div className="text-sm text-balance text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border">
                                {currentData?.description || "Ready to start"}
                            </div>
                        </CardContent>
                    </Card>
                </ResizablePanel>

                <ResizableHandle withHandle />

                <ResizablePanel defaultSize={80}>
                    <div className="flex-1 flex flex-col relative h-full">
                        <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto length-last-word-container h-full">

                            <div className="string-container">
                                {inputString.split('').map((char, index) => {
                                    const currentIndex = currentData.currentIndex;
                                    const status = currentData.indexStatus ? currentData.indexStatus[index] : 'default';

                                    return (
                                        <div key={index} className={cn(
                                            "char-box",
                                            char === ' ' && "space",
                                            status === 'skipped' && "skipped",
                                            status === 'counted' && "counted",
                                            index === currentIndex && "current"
                                        )}>
                                            {char === ' ' ? '␣' : char}
                                            <span className="char-index">{index}</span>
                                        </div>
                                    );
                                })}
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

export default LengthOfLastWord;
