/* eslint-disable react/prop-types */
import React from 'react';

const ProgressBar = ({ value, max, color = 'var(--primary)', height = '8px', label, animate = true }) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    const gradient = color === 'var(--primary)'
        ? 'linear-gradient(90deg, #00b4ad, #00f2ea)'
        : color === 'var(--secondary)'
            ? 'linear-gradient(90deg, #c0392b, #ff2d78)'
            : color;

    return (
        <div>
            {label && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                    <span>{label}</span>
                    <span style={{ fontWeight: '600', color: 'var(--text)' }}>{Math.round(percentage)}%</span>
                </div>
            )}
            <div className="progress-track" style={{ height }}>
                <div
                    className="progress-fill"
                    style={{
                        width: `${percentage}%`,
                        background: gradient,
                        boxShadow: `0 0 10px ${color === 'var(--primary)' ? 'rgba(0,242,234,0.4)' : 'rgba(255,45,120,0.4)'}`,
                    }}
                />
            </div>
        </div>
    );
};

export default ProgressBar;
