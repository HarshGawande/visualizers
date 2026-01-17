import React, { useState, useEffect, useMemo, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import ReplayControl from '../components/ReplayControl';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { cn } from '../lib/utils';
import './CoinChange.css'; // Reusing styles
import ProblemInfo from '../components/ProblemInfo';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '../components/ui/resizable';

const CoinChangeII = ({ problem }) => {
    const [coinsInput, setCoinsInput] = useState("[1, 2, 5]");
    const [amountInput, setAmountInput] = useState("5");
    const [coins, setCoins] = useState([1, 2, 5]);
    const [amount, setAmount] = useState(5);

    // Playback state
    const [currentStep, setCurrentStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(1);
    const timerRef = useRef(null);

    // Inputs
    const coinsRef = useRef(null);
    const amountRef = useRef(null);

    const parseInput = () => {
        try {
            const c = JSON.parse(coinsRef.current.value);
            const a = parseInt(amountRef.current.value);

            if (Array.isArray(c) && c.every(n => typeof n === 'number') && !isNaN(a)) {
                setCoinsInput(coinsRef.current.value);
                setAmountInput(amountRef.current.value);
                setCoins(c);
                setAmount(a);
                setCurrentStep(0);
                setIsPlaying(false);
            }
        } catch (e) {
            console.error("Invalid input");
        }
    };

    const steps = useMemo(() => {
        const recordedSteps = [];
        const dp = new Array(amount + 1).fill(0);
        dp[0] = 1;

        const record = (type, data) => {
            recordedSteps.push({
                type,
                dpState: [...dp],
                ...data
            });
        };

        record('start', {
            description: `Initialize DP array of size ${amount + 1}. dp[0] = 1 (one way to make 0: use no coins), others = 0.`,
            activeCoin: null,
            activeIndex: null,
            prevIndex: null
        });

        for (const coin of coins) {
            record('check_coin', {
                description: `Processing coin: ${coin}. We will update DP table for all amounts >= ${coin}.`,
                activeCoin: coin,
                activeIndex: null,
                prevIndex: null
            });

            for (let i = coin; i <= amount; i++) {
                const prevAmount = i - coin;
                const waysToAdd = dp[prevAmount];

                record('check_index', {
                    description: `Amount ${i}: Add ways to make ${i} - ${coin} (${prevAmount}). Current dp[${i}] = ${dp[i]}. dp[${prevAmount}] = ${waysToAdd}.`,
                    activeIndex: i,
                    prevIndex: prevAmount,
                    activeCoin: coin,
                    highlight: [i, prevAmount]
                });

                if (waysToAdd > 0) {
                    dp[i] += waysToAdd;
                    record('update', {
                        description: `Updated dp[${i}]! New total ways: ${dp[i]}.`,
                        activeIndex: i,
                        prevIndex: prevAmount,
                        activeCoin: coin,
                        highlight: [i, prevAmount]
                    });
                }
            }
        }

        record('finish', {
            description: `Finished! Total combinations: ${dp[amount]}`,
            activeIndex: amount,
            activeCoin: null
        });

        return recordedSteps;
    }, [coins, amount]);

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
                            <CardTitle className="text-lg">Coin Change II (518)</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto space-y-6 pt-6">
                            <ProblemInfo problem={problem} />
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-muted-foreground block">
                                    Coins (Array)
                                </label>
                                <Input
                                    ref={coinsRef}
                                    defaultValue={coinsInput}
                                    placeholder="[1, 2, 5]"
                                    className="font-mono text-xs"
                                />
                                <label className="text-sm font-medium text-muted-foreground block">
                                    Amount
                                </label>
                                <div className="flex gap-2">
                                    <Input
                                        ref={amountRef}
                                        defaultValue={amountInput}
                                        placeholder="5"
                                        className="font-mono text-xs"
                                    />
                                    <Button onClick={parseInput} size="icon" variant="outline">
                                        <RefreshCw className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="p-4 rounded-lg bg-secondary border border-border">
                                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                                    Current Result
                                </div>
                                <div className={cn(
                                    "text-3xl font-bold font-mono transition-colors",
                                    isFinished ? "text-green-500" : "text-primary"
                                )}>
                                    {currentData.dpState && currentData.activeIndex !== null ?
                                        currentData.dpState[currentData.activeIndex]
                                        : '-'}
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

                    <div className="flex-1 flex flex-col relative">
                        <div className="flex-1 flex flex-col items-center justify-start p-8 overflow-y-auto">
                            {/* Coins */}
                            <div className="mb-8">
                                <h3 className="text-sm font-semibold text-muted-foreground mb-4 text-center">Available Coins</h3>
                                <div className="coin-container">
                                    {coins.map((coin, idx) => (
                                        <div key={idx} className={cn(
                                            "coin",
                                            currentData.activeCoin === coin && "active"
                                        )}>
                                            {coin}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* DP Array */}
                            <div className="w-full max-w-4xl">
                                <h3 className="text-sm font-semibold text-muted-foreground mb-4 text-center">
                                    DP Array (Number of Combinations)
                                </h3>
                                <div className="dp-grid">
                                    {currentData.dpState?.map((val, idx) => (
                                        <div key={idx} className={cn(
                                            "dp-cell",
                                            currentData.activeIndex === idx && "active",
                                            currentData.prevIndex === idx && "processing"
                                        )}>
                                            <span className="dp-cell-index">{idx}</span>
                                            <span className="dp-cell-value">
                                                {val}
                                            </span>
                                        </div>
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
        </div >
    );
};

export default CoinChangeII;
