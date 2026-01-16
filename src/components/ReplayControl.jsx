import React from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

const ReplayControl = ({
    currentStep,
    totalSteps,
    isPlaying,
    onPlayPause,
    onStepChange,
    className
}) => {

    const handleProgressClick = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const step = Math.floor((x / rect.width) * totalSteps);
        onStepChange(Math.min(Math.max(0, step), totalSteps - 1));
    };

    return (
        <div className={cn("p-4 border-t border-border bg-background flex flex-col gap-4", className)}>
            {/* Progress Bar */}
            <div
                className="h-1.5 w-full bg-secondary rounded-full overflow-hidden cursor-pointer hover:h-2 transition-all"
                onClick={handleProgressClick}
            >
                <motion.div
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0}%` }}
                    transition={{ ease: "linear", duration: 0.1 }}
                />
            </div>

            <div className="flex items-center justify-between">
                <div className="flex gap-2">
                    <Button
                        variant="outline" size="icon"
                        onClick={() => onStepChange(0)}
                        disabled={currentStep === 0 || totalSteps === 0}
                    >
                        <RotateCcw className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex gap-2">
                    <Button
                        variant="outline" size="icon"
                        onClick={() => onStepChange(Math.max(0, currentStep - 1))}
                        disabled={currentStep === 0 || totalSteps === 0}
                    >
                        <SkipBack className="h-4 w-4" />
                    </Button>
                    <Button
                        onClick={onPlayPause}
                        disabled={totalSteps === 0}
                        className="w-12"
                    >
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                    </Button>
                    <Button
                        variant="outline" size="icon"
                        onClick={() => onStepChange(Math.min(totalSteps - 1, currentStep + 1))}
                        disabled={currentStep === totalSteps - 1 || totalSteps === 0}
                    >
                        <SkipForward className="h-4 w-4" />
                    </Button>
                </div>

                <div className="text-xs font-mono text-muted-foreground w-[100px] text-right">
                    Step {totalSteps > 0 ? currentStep + 1 : 0} / {totalSteps}
                </div>
            </div>
        </div>
    );
};

export default ReplayControl;
