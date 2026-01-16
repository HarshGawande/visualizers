import React, { useState } from 'react';
import { Code2, ChevronRight, Sun, Moon, Search } from 'lucide-react';
import { Input } from './ui/input';

const Sidebar = ({ problems, activeProblemId, setActiveProblemId, isDarkMode, toggleTheme }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredProblems = problems.filter(problem => {
        const query = searchQuery.toLowerCase();
        return (
            problem.title.toLowerCase().includes(query) ||
            problem.id.includes(query)
        );
    });

    return (
        <aside className="w-[300px] border-r border-border bg-card flex flex-col h-full flex-shrink-0">
            <div className="p-6 border-b border-border flex flex-col gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <Code2 size={24} />
                    </div>
                    <h1 className="font-bold text-lg tracking-tight">CodeVisuals</h1>
                </div>
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search problems or ID..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">
                    Algorithms
                </div>
                {filteredProblems.length === 0 ? (
                    <div className="text-sm text-muted-foreground px-2">No problems found.</div>
                ) : (
                    filteredProblems.map((problem) => (
                        <button
                            key={problem.id}
                            onClick={() => setActiveProblemId(problem.id)}
                            className={`w-full flex items-center justify-between p-3 rounded-md text-sm font-medium transition-all duration-200 group ${activeProblemId === problem.id
                                    ? 'bg-primary text-primary-foreground shadow-md'
                                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                                }`}
                        >
                            <div className="flex flex-col items-start truncate">
                                <span className="truncate w-full text-left mr-2">
                                    <span className="font-mono opacity-70 mr-2">{problem.id}.</span>
                                    {problem.title}
                                </span>
                                <span className={`text-[10px] mt-1 px-2 py-0.5 rounded-full font-medium ${problem.difficulty === 'Easy'
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                                        : problem.difficulty === 'Medium'
                                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
                                            : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                                    }`}>
                                    {problem.difficulty}
                                </span>
                            </div>
                            {activeProblemId === problem.id && <ChevronRight size={16} />}
                        </button>
                    ))
                )}
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
    );
};

export default Sidebar;
