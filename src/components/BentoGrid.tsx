import React, {useCallback, useMemo, useState} from 'react';
import GridLayout, {Layout} from 'react-grid-layout';
import {useTheme} from './ThemeProvider.js';
import type {Widget, WidgetLayout} from '../types';

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const DEFAULT_COLS = 12;
const DEFAULT_ROW_HEIGHT = 80;
const DEFAULT_GRID_WIDTH = 1200;
const GRID_MARGIN: [number, number] = [12, 12];
const GRID_CONTAINER_PADDING: [number, number] = [0, 0];

interface BentoGridProps {
    widgets: Widget[];
    layouts?: WidgetLayout[];
    defaultLayouts?: WidgetLayout[];
    cols?: number;
    rowHeight?: number;
    width?: number;
    onLayoutChange?: (layouts: WidgetLayout[]) => void;
    renderWidget: (widget: Widget) => React.ReactNode;
    isDraggable?: boolean;
    isResizable?: boolean;
    className?: string;
}

function toGridLayout(layouts: WidgetLayout[]): Layout[] {
    return layouts.map((l) => ({
        i: l.i,
        x: l.x,
        y: l.y,
        w: l.w,
        h: l.h,
        minW: l.minW,
        minH: l.minH,
        maxW: l.maxW,
        maxH: l.maxH,
        static: l.static,
    }));
}

function fromGridLayout(layouts: Layout[]): WidgetLayout[] {
    return layouts.map((l) => {
        const result: WidgetLayout = {i: l.i, x: l.x, y: l.y, w: l.w, h: l.h};
        if (l.minW !== undefined) result.minW = l.minW;
        if (l.minH !== undefined) result.minH = l.minH;
        if (l.maxW !== undefined) result.maxW = l.maxW;
        if (l.maxH !== undefined) result.maxH = l.maxH;
        if (l.static !== undefined) result.static = l.static;
        return result;
    });
}

export function WidgetShell({
                                widget,
                                children,
                                tokens,
                            }: {
    widget: Widget;
    children: React.ReactNode;
    tokens: ReturnType<typeof useTheme>['tokens'];
}) {
    return (
        <div
            style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: tokens.surface,
                border: `1px solid ${tokens.border}`,
                borderRadius: 12,
                overflow: 'hidden',
            }}
        >
            <div
                style={{
                    padding: '0.75rem 1rem',
                    borderBottom: `1px solid ${tokens.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    flexShrink: 0,
                    cursor: 'grab',
                    userSelect: 'none',
                }}
                className="drag-handle"
            >
        <span
            style={{
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: tokens.text,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
            }}
        >
          {widget.title}
        </span>
            </div>
            <div style={{flex: 1, overflow: 'auto', padding: '0.75rem'}}>
                {children}
            </div>
        </div>
    );
}

export function BentoGrid({
                              widgets,
                              layouts: controlledLayouts,
                              defaultLayouts,
                              cols = DEFAULT_COLS,
                              rowHeight = DEFAULT_ROW_HEIGHT,
                              width = DEFAULT_GRID_WIDTH,
                              onLayoutChange,
                              renderWidget,
                              isDraggable = true,
                              isResizable = true,
                              className,
                          }: BentoGridProps) {
    const {tokens} = useTheme();

    const isControlled = controlledLayouts !== undefined;
    const [internalLayouts, setInternalLayouts] = useState<WidgetLayout[]>(
        () => defaultLayouts ?? []
    );

    const activeLayouts = isControlled ? controlledLayouts : internalLayouts;

    const gridLayouts = useMemo(() => toGridLayout(activeLayouts), [activeLayouts]);

    const widgetMap = useMemo(
        () => new Map(widgets.map((w) => [w.id, w])),
        [widgets]
    );

    const handleLayoutChange = useCallback(
        (newLayouts: Layout[]) => {
            const converted = fromGridLayout(newLayouts);
            if (!isControlled) {
                setInternalLayouts(converted);
            }
            onLayoutChange?.(converted);
        },
        [isControlled, onLayoutChange]
    );

    return (
        <div
            className={className}
            style={{backgroundColor: tokens.background}}
        >
            <GridLayout
                layout={gridLayouts}
                cols={cols}
                rowHeight={rowHeight}
                width={width}
                isDraggable={isDraggable}
                isResizable={isResizable}
                draggableHandle=".drag-handle"
                onLayoutChange={handleLayoutChange}
                margin={GRID_MARGIN}
                containerPadding={GRID_CONTAINER_PADDING}
                resizeHandles={['se']}
            >
                {activeLayouts.map((layout) => {
                    const widget = widgetMap.get(layout.i);
                    if (!widget) return null;
                    return (
                        <div key={layout.i}>
                            <WidgetShell widget={widget} tokens={tokens}>
                                {renderWidget(widget)}
                            </WidgetShell>
                        </div>
                    );
                })}
            </GridLayout>
        </div>
    );
}
