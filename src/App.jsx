import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import { PROBLEMS } from './data/problems';

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
            <Sidebar
                problems={PROBLEMS}
                activeProblemId={activeProblemId}
                setActiveProblemId={setActiveProblemId}
                isDarkMode={isDarkMode}
                toggleTheme={toggleTheme}
            />

            {/* Main Content */}
            <main className="flex-1 h-full bg-card relative overflow-hidden flex flex-col">
                {activeProblem ? (
                    <activeProblem.component isDarkMode={isDarkMode} problem={activeProblem} />
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
