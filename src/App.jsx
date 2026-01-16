import React, { useState } from 'react';
import { Layout, Menu, Moon, Sun, Code2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BinaryTreeMaxPathSum from './problems/BinaryTreeMaxPathSum';
import HouseRobber from './problems/HouseRobber';
import HouseRobberII from './problems/HouseRobberII';
import SubarraySumK from './problems/SubarraySumK';

// Problem Registry
const PROBLEMS = [
    {
        id: '124',
        title: 'Binary Tree Maximum Path Sum',
        difficulty: 'Hard',
        component: BinaryTreeMaxPathSum
    },
    {
        id: '198',
        title: 'House Robber',
        difficulty: 'Medium',
        component: HouseRobber
    },
    {
        id: '213',
        title: 'House Robber II (Circular)',
        difficulty: 'Medium',
        component: HouseRobberII
    },
    {
        id: '560',
        title: 'Subarray Sum Equals K',
        difficulty: 'Medium',
        component: SubarraySumK
    },
    // Future problems can be added here
];

const App = () => {
    const [activeProblemId, setActiveProblemId] = useState(PROBLEMS[0].id);
    const [isDarkMode, setIsDarkMode] = useState(true);

    // Toggle Dark Mode
    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
        document.documentElement.classList.toggle('dark');
    };

    // Initial Theme Setup
    React.useEffect(() => {
        document.documentElement.classList.add('dark');
    }, []);

    const activeProblem = PROBLEMS.find(p => p.id === activeProblemId);

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
            {/* Sidebar */}
            <aside className="w-[280px] border-r border-border bg-card flex flex-col h-full flex-shrink-0">
                <div className="p-6 border-b border-border flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <Code2 size={24} />
                    </div>
                    <h1 className="font-bold text-lg tracking-tight">CodeVisuals</h1>
                </div>

                <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">
                        Algorithms
                    </div>
                    {PROBLEMS.map((problem) => (
                        <button
                            key={problem.id}
                            onClick={() => setActiveProblemId(problem.id)}
                            className={`w-full flex items-center justify-between p-3 rounded-md text-sm font-medium transition-all duration-200 group ${activeProblemId === problem.id
                                ? 'bg-primary text-primary-foreground shadow-md'
                                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                                }`}
                        >
                            <div className="flex flex-col items-start truncate">
                                <span className="truncate w-full text-left">{problem.title}</span>
                                <span className={`text-[10px] mt-1 px-1.5 py-0.5 rounded-full ${activeProblemId === problem.id
                                    ? 'bg-primary-foreground/20 text-primary-foreground'
                                    : 'bg-background border border-border group-hover:bg-background/80'
                                    }`}>
                                    {problem.difficulty}
                                </span>
                            </div>
                            {activeProblemId === problem.id && <ChevronRight size={16} />}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-border mt-auto">
                    <button
                        onClick={toggleTheme}
                        className="w-full flex items-center justify-center gap-2 p-2 rounded-md bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors"
                    >
                        {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                        <span className="text-sm font-medium">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 h-full bg-card relative overflow-hidden flex flex-col">
                {activeProblem ? (
                    <activeProblem.component isDarkMode={isDarkMode} />
                ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                        Select a problem to start visualizing
                    </div>
                )}
            </main>
        </div>
    );
};

export default App;
