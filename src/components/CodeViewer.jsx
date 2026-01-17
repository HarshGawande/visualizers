import React, { useState, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ScrollArea } from './ui/scroll-area';

const CodeViewer = ({ solutions, className }) => {
    const [activeLanguage, setActiveLanguage] = useState('java');
    const [isCopied, setIsCopied] = useState(false);
    const [isDark, setIsDark] = useState(true);

    useEffect(() => {
        const checkTheme = () => {
            const isDarkMode = document.documentElement.classList.contains('dark');
            setIsDark(isDarkMode);
        };

        checkTheme();

        const observer = new MutationObserver(checkTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

        return () => observer.disconnect();
    }, []);

    const handleCopy = async () => {
        const code = solutions?.[activeLanguage] || '';
        if (code) {
            await navigator.clipboard.writeText(code);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    const getCode = () => {
        if (!solutions) return '// No solution available';
        return solutions[activeLanguage] || '// Solution not available for this language';
    };

    return (
        <div className={cn("flex flex-col h-full", className)}>
            <div className="flex justify-between items-center p-2 border-b border-border bg-background">
                <div className="flex space-x-2">
                    {['java', 'python', 'cpp'].map((lang) => (
                        <button
                            key={lang}
                            onClick={() => setActiveLanguage(lang)}
                            className={cn(
                                "px-3 py-1 text-xs rounded-md transition-colors font-medium border border-border",
                                activeLanguage === lang
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-secondary hover:bg-muted text-muted-foreground"
                            )}
                        >
                            {lang === 'cpp' ? 'C++' : lang.charAt(0).toUpperCase() + lang.slice(1)}
                        </button>
                    ))}
                </div>
                <button
                    onClick={handleCopy}
                    className="p-1.5 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground"
                    title="Copy Code"
                >
                    {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </button>
            </div>

            <div className="flex-1 overflow-hidden relative bg-zinc-50 dark:bg-[#1e1e1e]">
                <div className="absolute inset-0">
                    <ScrollArea className="h-full w-full">
                        <SyntaxHighlighter
                            language={activeLanguage === 'cpp' ? 'cpp' : activeLanguage}
                            style={isDark ? vscDarkPlus : vs}
                            customStyle={{
                                margin: 0,
                                padding: '1rem',
                                fontSize: '14px',
                                lineHeight: '1.5',
                                background: 'transparent',
                                minHeight: '100%'
                            }}
                            showLineNumbers={true}
                            wrapLines={true}
                        >
                            {getCode()}
                        </SyntaxHighlighter>
                    </ScrollArea>
                </div>
            </div>
        </div>
    );
};

export default CodeViewer;
