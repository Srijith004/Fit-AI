import { useState, useEffect, useRef, useCallback } from 'react';

const STEP_THRESHOLD = 12;    // m/s² — tune this if needed
const STEP_COOLDOWN_MS = 300; // minimum time between two steps

/**
 * useStepCounter — detects steps via DeviceMotionEvent on mobile.
 * Falls back to manual mode on desktop.
 *
 * Returns:
 *   steps          - current step count
 *   isActive       - whether the accelerometer listener is running
 *   isSupported    - whether DeviceMotion is available
 *   permissionState- 'unknown' | 'granted' | 'denied' | 'unsupported'
 *   start()        - begin counting
 *   stop()         - stop counting
 *   reset()        - reset to 0
 *   addSteps(n)    - manually add n steps (for desktop / manual entry)
 */
export function useStepCounter(initialSteps = 0) {
    const [steps, setSteps] = useState(initialSteps);
    const [isActive, setIsActive] = useState(false);
    const [permissionState, setPermissionState] = useState('unknown'); // unknown | granted | denied | unsupported

    const lastStepTime = useRef(0);
    const lastMag = useRef(0);
    const rising = useRef(false);

    const isSupported = typeof window !== 'undefined' && 'DeviceMotionEvent' in window;

    const handleMotion = useCallback((event) => {
        const acc = event.accelerationIncludingGravity;
        if (!acc) return;

        const { x = 0, y = 0, z = 0 } = acc;
        const mag = Math.sqrt(x * x + y * y + z * z);

        // Simple peak detection
        if (mag > STEP_THRESHOLD && !rising.current) {
            rising.current = true;
        } else if (mag < STEP_THRESHOLD && rising.current) {
            rising.current = false;
            const now = Date.now();
            if (now - lastStepTime.current > STEP_COOLDOWN_MS) {
                lastStepTime.current = now;
                setSteps(s => s + 1);
            }
        }
        lastMag.current = mag;
    }, []);

    const requestPermissionAndStart = useCallback(async () => {
        if (!isSupported) {
            setPermissionState('unsupported');
            return;
        }

        // iOS 13+ requires explicit permission
        if (typeof DeviceMotionEvent.requestPermission === 'function') {
            try {
                const result = await DeviceMotionEvent.requestPermission();
                if (result === 'granted') {
                    setPermissionState('granted');
                    window.addEventListener('devicemotion', handleMotion);
                    setIsActive(true);
                } else {
                    setPermissionState('denied');
                }
            } catch {
                setPermissionState('denied');
            }
        } else {
            // Android / desktop Chrome — no permission needed
            window.addEventListener('devicemotion', handleMotion);
            setPermissionState('granted');
            setIsActive(true);
        }
    }, [isSupported, handleMotion]);

    const stop = useCallback(() => {
        window.removeEventListener('devicemotion', handleMotion);
        setIsActive(false);
    }, [handleMotion]);

    const reset = useCallback(() => {
        setSteps(0);
        lastStepTime.current = 0;
        rising.current = false;
    }, []);

    const addSteps = useCallback((n = 1) => {
        setSteps(s => Math.max(0, s + n));
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => { window.removeEventListener('devicemotion', handleMotion); };
    }, [handleMotion]);

    // Derived stats
    const calories = Math.round(steps * 0.04);   // ~0.04 kcal per step
    const distanceKm = parseFloat((steps * 0.00078).toFixed(2));  // ~78cm avg stride
    const distanceMi = parseFloat((distanceKm * 0.621).toFixed(2));

    return {
        steps,
        isActive,
        isSupported,
        permissionState,
        calories,
        distanceKm,
        start: requestPermissionAndStart,
        stop,
        reset,
        addSteps,
    };
}
