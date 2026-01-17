import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '../lib/utils';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useEffect } from 'react';

const ProblemInfo = ({ problem, className }) => {
    const [activeTab, setActiveTab] = useState('description');
    const [activeLanguage, setActiveLanguage] = useState('java');
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = async () => {
        const code = problem.solutions?.[activeLanguage] || '';
        if (code) {
            await navigator.clipboard.writeText(code);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    if (!problem) return null;

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

    // Helper to get code based on language
    const getCode = () => {
        if (!problem.solutions) return '// No solution available';
        return problem.solutions[activeLanguage] || '// Solution not available for this language';
    };

    return (
        <div className={cn("space-y-4", className)}>
            <Tabs defaultValue="description" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="description">Description</TabsTrigger>
                    <TabsTrigger value="solution">Solution Code</TabsTrigger>
                </TabsList>

                <TabsContent value="description" className="mt-4">
                    <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg border border-border leading-relaxed tracking-wide">
                        <p className="font-semibold mb-2 text-foreground">Problem Description</p>
                        {problem.description}
                    </div>
                </TabsContent>

                <TabsContent value="solution" className="mt-4">
                    <div className="space-y-2">
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex space-x-2">
                                {['java', 'python', 'cpp'].map((lang) => (
                                    <button
                                        key={lang}
                                        onClick={() => setActiveLanguage(lang)}
                                        className={cn(
                                            "px-3 py-1 text-xs rounded-md transition-colors font-medium border border-border",
                                            activeLanguage === lang
                                                ? "bg-primary text-primary-foreground border-primary"
                                                : "bg-background hover:bg-muted text-muted-foreground"
                                        )}
                                    >
                                        {lang === 'cpp' ? 'C++' : lang.charAt(0).toUpperCase() + lang.slice(1)}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={handleCopy}
                                className="p-2 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground"
                                title="Copy Code"
                            >
                                {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                            </button>
                        </div>

                        <div className="rounded-lg overflow-hidden border border-border bg-zinc-50 dark:bg-[#1e1e1e]">
                            <ScrollArea className="h-[300px] w-full rounded-md">
                                <SyntaxHighlighter
                                    language={activeLanguage === 'cpp' ? 'cpp' : activeLanguage}
                                    style={isDark ? vscDarkPlus : vs}
                                    customStyle={{ margin: 0, padding: '1rem', fontSize: '14px', lineHeight: '1.5', background: 'transparent' }}
                                    showLineNumbers={true}
                                >
                                    {getCode()}
                                </SyntaxHighlighter>
                            </ScrollArea>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default ProblemInfo;
