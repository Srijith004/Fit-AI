/* eslint-disable react/prop-types */
import React from 'react';

const GlassCard = ({ children, className = '', style = {}, glow, onClick }) => {
    const glowStyle = glow ? { boxShadow: `0 0 40px ${glow}` } : {};
    return (
        <div
            className={`glass-panel ${className}`}
            style={{ padding: '24px', ...glowStyle, ...style }}
            onClick={onClick}
        >
            {children}
        </div>
    );
};

export default GlassCard;
