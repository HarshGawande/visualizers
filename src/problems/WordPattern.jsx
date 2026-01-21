
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, BookOpen, Link2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '../components/ui/resizable';
import ProblemInfo from '../components/ProblemInfo';
import ReplayControl from '../components/ReplayControl';
import { cn } from '../lib/utils';
import './WordPattern.css';

const WordPattern = ({ problem }) => {
    const [patternInput, setPatternInput] = useState("abba");
    const [sInput, setSInput] = useState("dog cat cat dog");
    const [pattern, setPattern] = useState("abba");
    const [s, setS] = useState("dog cat cat dog");
    const [currentStep, setCurrentStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [steps, setSteps] = useState([]);

    // Timer ref for playback
    const timerRef = useRef(null);

    // Generate steps
    useEffect(() => {
        const trace = [];
        const words = s.split(' ');
        const pLen = pattern.length;
        const wLen = words.length;

        const charToWord = {};
        const wordToChar = {};

        // Initial Step
        trace.push({
            i: -1,
            charToWord: { ...charToWord },
            wordToChar: { ...wordToChar },
            desc: `Start check. Pattern length: ${pLen}, Words count: ${wLen}.`,
            status: 'init',
            error: null
        });

        if (pLen !== wLen) {
            trace.push({
                i: -1,
                charToWord: { ...charToWord },
                wordToChar: { ...wordToChar },
                desc: `Length mismatch! Pattern has ${pLen} chars but String has ${wLen} words.`,
                status: 'error',
                error: 'Lengths do not match'
            });
        } else {
            for (let i = 0; i < pLen; i++) {
                const char = pattern[i];
                const word = words[i];

                trace.push({
                    i,
                    charToWord: { ...charToWord },
                    wordToChar: { ...wordToChar },
                    desc: `Checking Index ${i}: '${char}' vs "${word}"`,
                    status: 'check',
                    currentPair: { char, word }
                });

                // Check existing mappings
                if (charToWord.hasOwnProperty(char) && charToWord[char] !== word) {
                    trace.push({
                        i,
                        charToWord: { ...charToWord },
                        wordToChar: { ...wordToChar },
                        desc: `Mismatch! '${char}' is already mapped to "${charToWord[char]}", not "${word}".`,
                        status: 'error',
                        error: `Pattern mismatch at index ${i}`,
                        highlight: 'mismatch-char'
                    });
                    return setSteps(trace);
                }

                if (wordToChar.hasOwnProperty(word) && wordToChar[word] !== char) {
                    trace.push({
                        i,
                        charToWord: { ...charToWord },
                        wordToChar: { ...wordToChar },
                        desc: `Mismatch! "${word}" is already mapped to '${wordToChar[word]}', not '${char}'.`,
                        status: 'error',
                        error: `Word mismatch at index ${i}`,
                        highlight: 'mismatch-word'
                    });
                    return setSteps(trace);
                }

                // If new mapping needed
                if (!charToWord.hasOwnProperty(char) && !wordToChar.hasOwnProperty(word)) {
                    charToWord[char] = word;
                    wordToChar[word] = char;
                    trace.push({
                        i,
                        charToWord: { ...charToWord },
                        wordToChar: { ...wordToChar },
                        desc: `New Mapping: '${char}' ↔ "${word}"`,
                        status: 'map',
                        currentPair: { char, word }
                    });
                } else {
                    trace.push({
                        i,
                        charToWord: { ...charToWord },
                        wordToChar: { ...wordToChar },
                        desc: `Existing Mapping Verified: '${char}' ↔ "${word}"`,
                        status: 'match',
                        currentPair: { char, word }
                    });
                }
            }

            trace.push({
                i: pLen,
                charToWord: { ...charToWord },
                wordToChar: { ...wordToChar },
                desc: "Success! The string follows the pattern.",
                status: 'success'
            });
        }

        setSteps(trace);
        setCurrentStep(0);
        setIsPlaying(false);
    }, [pattern, s]);

    // Handle Input Update
    const handleUpdate = () => {
        setPattern(patternInput);
        setS(sInput);
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
            }, 1200);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [isPlaying, steps.length]);

    const currentData = steps[currentStep] || { i: -1, charToWord: {}, wordToChar: {}, desc: '' };
    const wordsArray = s.split(' ');

    return (
        <div className="flex h-full w-full">
            <ResizablePanelGroup direction="horizontal" className="h-full w-full">
                <ResizablePanel defaultSize={25} minSize={20} maxSize={50} className="bg-background">
                    <Card className="viz-sidebar flex flex-col h-full rounded-none border-0 border-r-0 bg-background">
                        <CardHeader className="border-b border-border pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <BookOpen className="w-5 h-5" />
                                Word Pattern
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto space-y-6 pt-6">
                            <ProblemInfo problem={problem} />

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Pattern</label>
                                    <Input
                                        value={patternInput}
                                        onChange={(e) => setPatternInput(e.target.value)}
                                        className="font-mono"
                                        placeholder="abba"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">String s (words)</label>
                                    <Input
                                        value={sInput}
                                        onChange={(e) => setSInput(e.target.value)}
                                        className="font-mono"
                                        placeholder="dog cat cat dog"
                                    />
                                </div>
                                <Button onClick={handleUpdate} className="w-full">
                                    <RefreshCw className="mr-2 h-4 w-4" /> Update
                                </Button>
                            </div>

                            <div className={cn(
                                "p-4 rounded-lg border border-border mt-4 transition-colors",
                                currentData.status === 'error' ? "bg-red-500/10 border-red-500/50" :
                                    currentData.status === 'success' ? "bg-green-500/10 border-green-500/50" : "bg-secondary"
                            )}>
                                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                    Status
                                </div>
                                <div className={cn(
                                    "text-lg font-bold",
                                    currentData.status === 'error' ? "text-red-500" :
                                        currentData.status === 'success' ? "text-green-500" : "text-primary"
                                )}>
                                    {currentData.status === 'error' ? 'Mismatch Found' :
                                        currentData.status === 'success' ? 'Pattern Match' : 'Checking...'}
                                </div>
                            </div>

                            <div className="text-sm text-balance text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border">
                                {currentData.desc}
                            </div>
                        </CardContent>
                    </Card>
                </ResizablePanel>

                <ResizableHandle withHandle />

                <ResizablePanel defaultSize={75}>
                    <div className="flex-1 flex flex-col relative h-full">
                        <div className="flex-1 flex flex-col items-center justify-start p-8 overflow-y-auto bg-dot-pattern">

                            <div className="wp-container max-w-5xl mt-8">

                                {/* Pattern Row */}
                                <div className="flex flex-col gap-8 w-full">
                                    <div className="flex flex-col gap-2">
                                        <h3 className="text-sm font-semibold text-muted-foreground uppercase ml-2">Pattern</h3>
                                        <div className="wp-sequence-row flex-wrap justify-start pl-2">
                                            {pattern.split('').map((char, idx) => (
                                                <motion.div
                                                    key={`p-${idx}`}
                                                    className={cn(
                                                        "wp-item-box w-12 h-12 text-xl",
                                                        currentData.i === idx && "active",
                                                        (currentData.status === 'error' && currentData.i === idx) && "error",
                                                        (currentData.status === 'success' || currentData.i > idx) && "match"
                                                    )}
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                >
                                                    {char}
                                                    <span className="wp-label">{idx}</span>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Link Icon Separator */}
                                    <div className="flex w-full justify-center">
                                        <Link2 className="text-muted-foreground/30 rotate-45" />
                                    </div>

                                    {/* Words Row */}
                                    <div className="flex flex-col gap-2">
                                        <h3 className="text-sm font-semibold text-muted-foreground uppercase ml-2">String Words</h3>
                                        <div className="wp-sequence-row flex-wrap justify-start pl-2">
                                            {wordsArray.map((word, idx) => (
                                                <motion.div
                                                    key={`w-${idx}`}
                                                    className={cn(
                                                        "wp-item-box px-4 min-w-[80px]",
                                                        currentData.i === idx && "active",
                                                        (currentData.status === 'error' && currentData.i === idx) && "error",
                                                        (currentData.status === 'success' || currentData.i > idx) && "match"
                                                    )}
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                >
                                                    {word}
                                                    <span className="wp-label">{idx}</span>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Bijective Maps */}
                                <div className="wp-maps-container mt-8">
                                    <div className="wp-map-card">
                                        <div className="wp-map-title">Char → Word</div>
                                        <div className="wp-map-entries">
                                            <AnimatePresence>
                                                {Object.entries(currentData.charToWord).map(([key, val]) => (
                                                    <motion.div
                                                        key={`${key}-${val}`}
                                                        layout
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        className={cn(
                                                            "wp-map-entry",
                                                            (currentData.currentPair?.char === key) && "border-primary bg-primary/5"
                                                        )}
                                                    >
                                                        <span>{key}</span>
                                                        <span className="wp-arrow">→</span>
                                                        <span>{val}</span>
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                            {Object.keys(currentData.charToWord).length === 0 && <span className="text-muted-foreground text-sm text-center italic mt-4">Empty</span>}
                                        </div>
                                    </div>

                                    <div className="wp-map-card">
                                        <div className="wp-map-title">Word → Char</div>
                                        <div className="wp-map-entries">
                                            <AnimatePresence>
                                                {Object.entries(currentData.wordToChar).map(([key, val]) => (
                                                    <motion.div
                                                        key={`${key}-${val}`}
                                                        layout
                                                        initial={{ opacity: 0, x: 20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        className={cn(
                                                            "wp-map-entry",
                                                            (currentData.currentPair?.word === key) && "border-primary bg-primary/5"
                                                        )}
                                                    >
                                                        <span>{key}</span>
                                                        <span className="wp-arrow">→</span>
                                                        <span>{val}</span>
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                            {Object.keys(currentData.wordToChar).length === 0 && <span className="text-muted-foreground text-sm text-center italic mt-4">Empty</span>}
                                        </div>
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

export default WordPattern;
