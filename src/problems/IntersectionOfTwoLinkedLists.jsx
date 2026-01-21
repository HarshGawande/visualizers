
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, MapPin, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '../components/ui/resizable';
import ProblemInfo from '../components/ProblemInfo';
import ReplayControl from '../components/ReplayControl';
import { cn } from '../lib/utils';
import './IntersectionOfTwoLinkedLists.css';

const IntersectionOfTwoLinkedLists = ({ problem }) => {
    // Config
    const [lenAInput, setLenAInput] = useState(2);
    const [lenBInput, setLenBInput] = useState(3);
    const [lenCommonInput, setLenCommonInput] = useState(3);

    // Internal state
    const [structure, setStructure] = useState({ headA: [], headB: [], common: [] });
    const [currentStep, setCurrentStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [steps, setSteps] = useState([]);

    const timerRef = useRef(null);

    // Build Structure
    const generateSteps = (aSize, bSize, commSize) => {
        // IDs:
        // A unique: a1, a2...
        // B unique: b1, b2...
        // Common: c1, c2...

        const nodesA = Array.from({ length: aSize }, (_, i) => `a${i + 1}`);
        const nodesB = Array.from({ length: bSize }, (_, i) => `b${i + 1}`);
        const nodesC = Array.from({ length: commSize }, (_, i) => `c${i + 1}`);

        // Full paths for pointers
        // Path A: [...nodesA, ...nodesC, null, ...nodesB, ...nodesC, null];
        // Path B: [...nodesB, ...nodesC, null, ...nodesA, ...nodesC, null];

        // Wait, standard algo is:
        // if pA reaches end, go to headB
        // if pB reaches end, go to headA

        // Let's normalize data structures for trace
        const listA = [...nodesA, ...nodesC];
        const listB = [...nodesB, ...nodesC];

        const trace = [];

        let ptrAIdx = 0; // Index in "Logical Path A"
        let ptrBIdx = 0; // Index in "Logical Path B"

        // Max steps to prevent infinite loop
        let maxSteps = (listA.length + listB.length) * 2;
        let pA = listA[0] || null; // current node ID for A
        let pB = listB[0] || null; // current node ID for B

        // We need to track if we have switched heads
        let switchedA = false;
        let switchedB = false;
        let aPos = 0; // position in current list
        let bPos = 0;

        // Helper to get Node ID from current state
        // State A: (isFirstPass, index)
        const getVal = (isFirstPass, listArr, otherListArr, idx) => {
            if (isFirstPass) {
                if (idx < listArr.length) return listArr[idx];
                return 'null-transition'; // reached end of first pass
            } else {
                if (idx < otherListArr.length) return otherListArr[idx];
                return 'null-final'; // reached end of second pass
            }
        };

        let currA = listA.length > 0 ? listA[0] : (listB.length > 0 ? 'switch-to-B' : 'null-final');
        let currB = listB.length > 0 ? listB[0] : (listA.length > 0 ? 'switch-to-A' : 'null-final');

        // Let's effectively simulate the pointers
        // We really just need the sequence of Node IDs each pointer visits

        const buildPath = (primary, secondary) => {
            const path = [];
            // First pass
            for (let id of primary) path.push({ id, list: 'primary' });
            path.push({ id: 'null', list: 'transition' });
            // Second pass
            for (let id of secondary) path.push({ id, list: 'secondary' });
            path.push({ id: 'null', list: 'final' });
            return path;
        };

        const pathA = buildPath(listA, listB);
        const pathB = buildPath(listB, listA);

        let i = 0;
        let j = 0;

        while (i < pathA.length && j < pathB.length) {
            const nodeA = pathA[i];
            const nodeB = pathB[j];

            trace.push({
                idxA: i,
                idxB: j,
                valA: nodeA.id,
                valB: nodeB.id,
                desc: `pA at ${nodeA.id === 'null' ? 'null' : nodeA.id}, pB at ${nodeB.id === 'null' ? 'null' : nodeB.id}`,
                match: (nodeA.id !== 'null' && nodeA.id === nodeB.id)
            });

            if (nodeA.id !== 'null' && nodeA.id === nodeB.id) {
                // Intersection found
                trace[trace.length - 1].desc = `Intersection found at node ${nodeA.id}!`;
                break;
            }

            if (nodeA.id === 'null' && nodeB.id === 'null' && i === pathA.length - 1 && j === pathB.length - 1) {
                // Both reached end null at same time without match (no intersection case)
                trace[trace.length - 1].desc = `Both reached null. No intersection.`;
                break;
            }

            // Move pointers
            // Logic: if node is null (transition), jump to 0 of other list
            // For the sake of our pre-calc path, simply increment index
            i++;
            j++;
        }

        return {
            trace,
            structure: {
                headA: nodesA,
                headB: nodesB,
                common: nodesC,
                listA,
                listB
            }
        };
    };

    const handleUpdate = () => {
        const { trace, structure } = generateSteps(lenAInput, lenBInput, lenCommonInput);
        setSteps(trace);
        setStructure(structure);
        setCurrentStep(0);
        setIsPlaying(false);
    };

    useEffect(() => {
        handleUpdate();
    }, []);

    // Playback
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

    const currentData = steps[currentStep] || { valA: '', valB: '', desc: '' };

    // Check if pointers are on a specific node
    const isPtrAOn = (id) => currentData.valA === id;
    const isPtrBOn = (id) => currentData.valB === id;

    // Helper to render nodes
    const renderNode = (id, extraClass = '') => (
        <React.Fragment key={id}>
            <div className={cn(
                "ill-node",
                extraClass,
                isPtrAOn(id) && isPtrBOn(id) ? "highlight-both" : "",
                isPtrAOn(id) && !isPtrBOn(id) ? "highlight-a" : "",
                !isPtrAOn(id) && isPtrBOn(id) ? "highlight-b" : "",
                currentData.match && id === currentData.valA ? "intersect-found" : ""
            )}>
                {id}
                <div className="ill-arrow"></div>

                {/* Pointers */}
                <AnimatePresence>
                    {isPtrAOn(id) && (
                        <motion.div
                            layoutId="ptr-a"
                            className="ill-pointer-label ill-ptr-a"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                        >
                            pA
                        </motion.div>
                    )}
                    {isPtrBOn(id) && (
                        <motion.div
                            layoutId="ptr-b"
                            className="ill-pointer-label ill-ptr-b"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                        >
                            pB
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </React.Fragment>
    );

    return (
        <div className="flex h-full w-full">
            <ResizablePanelGroup direction="horizontal" className="h-full w-full">
                <ResizablePanel defaultSize={25} minSize={20} maxSize={50} className="bg-background">
                    <Card className="viz-sidebar flex flex-col h-full rounded-none border-0 border-r-0 bg-background">
                        <CardHeader className="border-b border-border pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <MapPin className="w-5 h-5" />
                                Intersection of Lists
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto space-y-6 pt-6">
                            <ProblemInfo problem={problem} />

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">List A Unique Nodes</label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="5"
                                        value={lenAInput}
                                        onChange={(e) => setLenAInput(Math.min(5, Math.max(0, parseInt(e.target.value) || 0)))}
                                        className="font-mono"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">List B Unique Nodes</label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="5"
                                        value={lenBInput}
                                        onChange={(e) => setLenBInput(Math.min(5, Math.max(0, parseInt(e.target.value) || 0)))}
                                        className="font-mono"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Common Nodes</label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="5"
                                        value={lenCommonInput}
                                        onChange={(e) => setLenCommonInput(Math.min(5, Math.max(0, parseInt(e.target.value) || 0)))}
                                        className="font-mono"
                                    />
                                </div>
                                <Button onClick={handleUpdate} className="w-full">
                                    <RefreshCw className="mr-2 h-4 w-4" /> Reset & Build
                                </Button>
                            </div>

                            <div className="text-sm text-balance text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border mt-4">
                                {currentData.desc}
                            </div>
                        </CardContent>
                    </Card>
                </ResizablePanel>

                <ResizableHandle withHandle />

                <ResizablePanel defaultSize={75}>
                    <div className="flex-1 flex flex-col relative h-full">
                        <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto bg-dot-pattern">

                            <div className="ill-container">
                                <div className="ill-viz-area">

                                    {/* Fork Area: A and B unique branches */}
                                    <div className="ill-fork-area">

                                        {/* Branch A */}
                                        <div className="ill-list-section">
                                            <div className="mr-4 font-bold text-muted-foreground">A</div>
                                            {structure.headA.map(id => renderNode(id))}
                                            {/* Connector A->C */}
                                            <svg className="absolute w-[60px] h-[100px] pointer-events-none stroke-current text-muted-foreground" style={{ right: '-50px', top: '25px', zIndex: 0 }}>
                                                <path d="M 0,25 C 30,25 30,75 60,75" fill="none" strokeWidth="2" />
                                            </svg>
                                        </div>

                                        {/* Branch B */}
                                        <div className="ill-list-section">
                                            <div className="mr-4 font-bold text-muted-foreground">B</div>
                                            {structure.headB.map(id => renderNode(id))}
                                            {/* Connector B->C */}
                                            <svg className="absolute w-[60px] h-[100px] pointer-events-none stroke-current text-muted-foreground" style={{ right: '-50px', top: '-75px', zIndex: 0 }}>
                                                <path d="M 0,75 C 30,75 30,25 60,25" fill="none" strokeWidth="2" />
                                            </svg>
                                        </div>
                                    </div>

                                    {/* Common Area */}
                                    <div className="ill-common-area" style={{ marginTop: '0px' }}>
                                        {structure.common.map(id => renderNode(id))}
                                        {/* Render Null for visual end */}
                                        <div className={cn(
                                            "ill-null relative",
                                            (isPtrAOn('null') || isPtrBOn('null')) ? "border-primary text-primary" : ""
                                        )}>
                                            NULL
                                            <AnimatePresence>
                                                {isPtrAOn('null') && (
                                                    <motion.div layoutId="ptr-a" className="ill-pointer-label ill-ptr-a" transition={{ type: 'tween' }}>pA</motion.div>
                                                )}
                                                {isPtrBOn('null') && (
                                                    <motion.div layoutId="ptr-b" className="ill-pointer-label ill-ptr-b" transition={{ type: 'tween' }}>pB</motion.div>
                                                )}
                                            </AnimatePresence>
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

export default IntersectionOfTwoLinkedLists;
