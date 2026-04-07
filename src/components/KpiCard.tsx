import React, {useMemo} from 'react';
import {useTheme} from './ThemeProvider.js';
import type {KpiValue} from '../types';

interface KpiCardProps {
    kpi: KpiValue;
    loading?: boolean;
    onClick?: () => void;
    className?: string;
}

function formatValue(value: number, unit?: string): string {
    const abs = Math.abs(value);
    let formatted: string;

    if (abs >= 1_000_000) {
        formatted = `${(value / 1_000_000).toFixed(2)}M`;
    } else if (abs >= 1_000) {
        formatted = `${(value / 1_000).toFixed(1)}K`;
    } else {
        formatted = value.toLocaleString(undefined, {maximumFractionDigits: 2});
    }

    return unit ? `${formatted} ${unit}` : formatted;
}

function TrendArrow({direction}: { direction: 'up' | 'down' | 'flat' }) {
    if (direction === 'flat') {
        return <span style={{fontSize: '1rem'}}>→</span>;
    }
    return <span style={{fontSize: '1rem'}}>{direction === 'up' ? '↑' : '↓'}</span>;
}

function ProgressBar({
                         value,
                         target,
                         accentColor,
                         borderColor,
                     }: {
    value: number;
    target: number;
    accentColor: string;
    borderColor: string;
}) {
    const pct = Math.max(0, Math.min(100, (value / target) * 100));
    return (
        <div
            role="progressbar"
            aria-valuenow={Math.round(pct)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${Math.round(pct)}% of target`}
            style={{
                marginTop: '0.75rem',
                height: 4,
                borderRadius: 2,
                backgroundColor: borderColor,
                overflow: 'hidden',
            }}
        >
            <div
                style={{
                    width: `${pct}%`,
                    height: '100%',
                    backgroundColor: accentColor,
                    borderRadius: 2,
                    transition: 'width 0.4s ease',
                }}
            />
        </div>
    );
}

export function KpiCard({kpi, loading = false, onClick, className}: KpiCardProps) {
    const {tokens} = useTheme();

    const statusColor = useMemo(() => {
        switch (kpi.status) {
            case 'good':
                return tokens.success;
            case 'warning':
                return tokens.warning;
            case 'critical':
                return tokens.danger;
            default:
                return tokens.accent;
        }
    }, [kpi.status, tokens]);

    const trendColor = useMemo(() => {
        if (!kpi.trend || kpi.trend === 'flat') return tokens.textMuted;
        return kpi.trend === 'up' ? tokens.success : tokens.danger;
    }, [kpi.trend, tokens]);

    const containerStyle: React.CSSProperties = {
        backgroundColor: tokens.surface,
        border: `1px solid ${tokens.border}`,
        borderRadius: 12,
        padding: '1.25rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
        transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
        position: 'relative',
        overflow: 'hidden',
        minWidth: 160,
    };

    const accentBarStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        backgroundColor: statusColor,
        borderRadius: '12px 12px 0 0',
    };

    if (loading) {
        return (
            <div style={containerStyle} className={className} aria-busy="true">
                <div style={accentBarStyle}/>
                <div
                    style={{
                        height: 12,
                        width: '60%',
                        backgroundColor: tokens.surfaceVariant,
                        borderRadius: 6,
                        animation: 'pulse 1.5s ease-in-out infinite',
                    }}
                />
                <div
                    style={{
                        height: 28,
                        width: '80%',
                        backgroundColor: tokens.surfaceVariant,
                        borderRadius: 6,
                        marginTop: 8,
                        animation: 'pulse 1.5s ease-in-out infinite',
                    }}
                />
            </div>
        );
    }

    const content = (
        <>
            <div style={accentBarStyle}/>

            <span
                style={{
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: tokens.textSecondary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                }}
            >
        {kpi.label}
      </span>

            <span
                style={{
                    fontSize: '2rem',
                    fontWeight: 700,
                    color: tokens.text,
                    lineHeight: 1.1,
                    marginTop: '0.25rem',
                }}
            >
        {formatValue(kpi.value, kpi.unit)}
      </span>

            {(kpi.trend || kpi.trendPercent !== undefined) && (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        color: trendColor,
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        marginTop: '0.25rem',
                    }}
                >
                    {kpi.trend && <TrendArrow direction={kpi.trend}/>}
                    {kpi.trendPercent !== undefined && (
                        <span>
              {kpi.trendPercent > 0 ? '+' : ''}
                            {kpi.trendPercent.toFixed(1)}%
            </span>
                    )}
                    {kpi.previousValue !== undefined && (
                        <span style={{color: tokens.textMuted, fontWeight: 400}}>
              vs {formatValue(kpi.previousValue, kpi.unit)}
            </span>
                    )}
                </div>
            )}

            {kpi.target !== undefined && kpi.target > 0 && (
                <>
          <span
              style={{
                  fontSize: '0.75rem',
                  color: tokens.textMuted,
                  marginTop: '0.5rem',
              }}
          >
            Target: {formatValue(kpi.target, kpi.unit)}
          </span>
                    <ProgressBar
                        value={kpi.value}
                        target={kpi.target}
                        accentColor={statusColor}
                        borderColor={tokens.border}
                    />
                </>
            )}

            {kpi.timestamp && (
                <span
                    style={{
                        fontSize: '0.6875rem',
                        color: tokens.textMuted,
                        marginTop: '0.5rem',
                    }}
                >
          {new Date(kpi.timestamp).toLocaleTimeString()}
        </span>
            )}
        </>
    );

    if (onClick) {
        return (
            <button
                type="button"
                style={{
                    ...containerStyle,
                    cursor: 'pointer',
                    textAlign: 'left',
                    font: 'inherit',
                }}
                className={className}
                onClick={onClick}
            >
                {content}
            </button>
        );
    }

    return (
        <div style={containerStyle} className={className}>
            {content}
        </div>
    );
}
