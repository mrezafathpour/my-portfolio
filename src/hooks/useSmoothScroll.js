import { useCallback, useEffect, useRef } from "react";

// How long (ms) a scroll to a section takes, whatever the distance; raise it
// to slow every in-page scroll down (navbar, Contact links, back to top)
export const SCROLL_DURATION = 1500;

// Starts slowly, speeds up, then settles gently on the section
const easeInOutCubic = (t) =>
    t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

// Any of these from the user takes over from a scroll still under way
const USER_SCROLL_EVENTS = ["wheel", "touchstart", "keydown"];

// Returns scrollToY(y) and scrollToSection(id), which scroll the page there
// over `duration` ms; a new scroll replaces the one still running
export default function useSmoothScroll(duration = SCROLL_DURATION) {
    // Stops the scroll currently running, if any
    const stopScrollRef = useRef(null);

    useEffect(() => () => stopScrollRef.current?.(), []);

    const scrollToY = useCallback(
        (targetY) => {
            stopScrollRef.current?.();

            const startY = window.scrollY;
            const distance = targetY - startY;

            const prefersReduced = window.matchMedia?.(
                "(prefers-reduced-motion: reduce)"
            ).matches;

            if (prefersReduced || duration <= 0 || distance === 0) {
                window.scrollTo(0, targetY);
                return;
            }

            const startTime = performance.now();
            let raf = 0;

            const stop = () => {
                cancelAnimationFrame(raf);
                USER_SCROLL_EVENTS.forEach((type) =>
                    window.removeEventListener(type, stop)
                );
                stopScrollRef.current = null;
            };

            const step = (now) => {
                const progress = Math.min((now - startTime) / duration, 1);
                window.scrollTo(
                    0,
                    startY + distance * easeInOutCubic(progress)
                );

                if (progress < 1) raf = requestAnimationFrame(step);
                else stop();
            };

            USER_SCROLL_EVENTS.forEach((type) =>
                window.addEventListener(type, stop, { passive: true })
            );
            stopScrollRef.current = stop;
            raf = requestAnimationFrame(step);
        },
        [duration]
    );

    // Returns whether the section exists (and the scroll started)
    const scrollToSection = useCallback(
        (id) => {
            const target = document.getElementById(id);
            if (!target) return false;

            scrollToY(target.getBoundingClientRect().top + window.scrollY);
            return true;
        },
        [scrollToY]
    );

    return { scrollToY, scrollToSection };
}
