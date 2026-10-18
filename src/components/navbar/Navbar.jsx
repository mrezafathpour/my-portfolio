import { useEffect, useRef, useState } from "react";
import { useNavigation } from "../../features/navigation/NavigationContext";
import "./Navbar.css";

const navLinks = ["Intro", "Projects", "Skills", "Journey"];

// The fonts the links are measured with; the navbar waits until the browser
// has finished loading them, so it does not resize right after appearing
const NAV_FONTS = ['1rem "main-normal"', 'bold 1rem "main-bold"'];

// Starts slowly, speeds up, then settles gently on the section
const easeInOutCubic = (t) =>
    t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

// Any of these from the user takes over from a scroll still under way
const USER_SCROLL_EVENTS = ["wheel", "touchstart", "keydown"];

// scrollDuration: how long (ms) the scroll to a section takes when a link is
// clicked, whatever the distance; raise it to slow the scroll down
export default function Navbar({ scrollDuration = 1000 }) {
    const [hidden, setHidden] = useState(false);
    const [activeSection, setActiveSection] = useState("Intro");
    const [fontsReady, setFontsReady] = useState(false);
    const { handleIntro } = useNavigation();

    // Stops the scroll currently running, if any
    const stopScrollRef = useRef(null);

    useEffect(() => () => stopScrollRef.current?.(), []);

    // onDone runs once the page arrives, not if the scroll is interrupted
    const scrollToY = (targetY, onDone) => {
        stopScrollRef.current?.();

        const startY = window.scrollY;
        const distance = targetY - startY;

        const prefersReduced = window.matchMedia?.(
            "(prefers-reduced-motion: reduce)"
        ).matches;

        if (prefersReduced || scrollDuration <= 0 || distance === 0) {
            window.scrollTo(0, targetY);
            onDone?.();
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
            const progress = Math.min((now - startTime) / scrollDuration, 1);
            window.scrollTo(0, startY + distance * easeInOutCubic(progress));

            if (progress < 1) {
                raf = requestAnimationFrame(step);
            } else {
                stop();
                onDone?.();
            }
        };

        USER_SCROLL_EVENTS.forEach((type) =>
            window.addEventListener(type, stop, { passive: true })
        );
        stopScrollRef.current = stop;
        raf = requestAnimationFrame(step);
    };

    useEffect(() => {
        if (!document.fonts?.load) {
            setFontsReady(true);
            return;
        }

        let isCancelled = false;

        // Settles once every font has either loaded or failed, so the navbar
        // still shows (in the fallback font) if a font cannot be fetched
        Promise.allSettled(
            NAV_FONTS.map((font) => document.fonts.load(font))
        ).then(() => {
            if (!isCancelled) setFontsReady(true);
        });

        return () => {
            isCancelled = true;
        };
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            const doc = document.documentElement;
            const rawScroll = window.pageYOffset ?? doc.scrollTop;

            const viewportHeight = window.innerHeight;
            const docHeight = doc.scrollHeight;
            const maxScroll = docHeight - viewportHeight;
            const current = Math.max(0, Math.min(rawScroll, maxScroll));

            const isAtBottom = maxScroll - current <= 2;

            setHidden(isAtBottom);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Highlight the section that sits under the middle of the screen
    useEffect(() => {
        const handleScrollSpy = () => {
            const middle = window.innerHeight / 2;

            const current = navLinks.find((id) => {
                const section = document.getElementById(id);
                if (!section) return false;

                const rect = section.getBoundingClientRect();
                return rect.top <= middle && rect.bottom > middle;
            });

            setActiveSection(current ?? null);
        };

        window.addEventListener("scroll", handleScrollSpy, { passive: true });
        window.addEventListener("resize", handleScrollSpy);
        handleScrollSpy();

        return () => {
            window.removeEventListener("scroll", handleScrollSpy);
            window.removeEventListener("resize", handleScrollSpy);
        };
    }, []);

    const handleLinkClick = (e, label) => {
        e.preventDefault();

        // The intro text changes only once the page has scrolled up to it
        const onArrive =
            label === "Intro" && handleIntro ? handleIntro : undefined;

        const target = document.querySelector(`#${label}`);
        if (target) {
            scrollToY(
                target.getBoundingClientRect().top + window.scrollY,
                onArrive
            );
        } else {
            onArrive?.();
        }
    };

    if (!fontsReady) return null;

    return (
        <nav className={`nav-container${hidden ? " nav-hidden" : ""}`}>
            <div className="nav-inner">
                {navLinks.map((label, i) => (
                    <a
                        draggable="false"
                        key={label}
                        href={`#${label}`}
                        className={`nav-link disable-select ${
                            hidden ? "" : "fade-in-link"
                        } ${activeSection === label ? "is-active" : ""}`}
                        data-label={label}
                        aria-current={
                            activeSection === label ? "location" : undefined
                        }
                        style={{ animationDelay: `${i * 0.12}s` }}
                        onClick={(e) => handleLinkClick(e, label)}
                    >
                        {label}
                    </a>
                ))}
            </div>
        </nav>
    );
}
