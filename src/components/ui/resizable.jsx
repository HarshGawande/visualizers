import React, { Children } from "react"
import Split from 'react-split'
import { cn } from "../../lib/utils"
import "./resizable.css"

const ResizablePanelGroup = ({
    className,
    direction = "horizontal",
    children,
    ...props
}) => {
    // Filter out ResizableHandle and non-valid children
    const panels = Children.toArray(children).filter((child) => {
        return React.isValidElement(child) && child.type === ResizablePanel;
    });

    // Extract sizes
    const sizes = panels.map(panel => panel.props.defaultSize || (100 / panels.length));

    return (
        <Split
            className={cn("flex h-full w-full", className)}
            direction={direction}
            sizes={sizes}
            minSize={100}
            expandToMin={false}
            gutterSize={6}
            gutterAlign="center"
            snapOffset={30}
            dragInterval={1}
            {...props}
        >
            {panels}
        </Split>
    );
}

const ResizablePanel = ({
    className,
    defaultSize, // Consumed by Group
    minSize, // Ignored or could be passed to Split's minSize array if we want complex logic
    maxSize,
    children,
    ...props
}) => (
    <div
        className={cn("h-full w-full overflow-hidden flex flex-col", className)}
        {...props}
    >
        {children}
    </div>
)

// No-op component, just a marker/placeholder if present in legacy JSX
const ResizableHandle = () => null;

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
