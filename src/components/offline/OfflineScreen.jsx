import { useCallback, useEffect, useRef, useState } from "react";
import "./OfflineScreen.css";

// Covers the app while the connection is gone. The app is already loaded, so
// this is part of it; public/offline.html covers the other case, an app that
// cannot load at all (the service worker shows it then).

// The "MR" letters of favicon.svg as [x, y, width, height] blocks on its
// 16 x 16 grid, split below into single pixels
const LOGO_BLOCKS = [
    [2, 4, 1, 8],
    [6, 4, 1, 8],
    [3, 5, 1, 1],
    [5, 5, 1, 1],
    [4, 6, 1, 2],
    [9, 4, 1, 8],
    [10, 4, 3, 1],
    [13, 5, 1, 3],
    [10, 8, 3, 1],
    [11, 9, 1, 1],
    [12, 10, 1, 1],
    [13, 11, 1, 1],
];

// A small file the service worker leaves alone, so asking for it really
// reaches the site (navigator.onLine can claim a connection that does not)
const CONNECTION_CHECK_URL = `${process.env.PUBLIC_URL}/manifest.json`;

// Offline, a check fails at once; the spinner still turns this long, so a
// tap on "Try again" visibly did something
const MIN_CHECK_MS = 900;

// How long "Back online" shows before the screen goes away
const BACK_ONLINE_MS = 900;

const random = (min, max) => min + Math.random() * (max - min);

// Falling in column by column, left to right, each with its own direction
// to fly off in (in grid pixels) when the signal breaks up
function makeLogoCells() {
    const cells = [];

    LOGO_BLOCKS.forEach(([bx, by, bw, bh]) => {
        for (let x = bx; x < bx + bw; x++) {
            for (let y = by; y < by + bh; y++) cells.push({ x, y });
        }
    });

    return cells
        .sort((a, b) => a.x - b.x || a.y - b.y)
        .map((cell) => ({
            ...cell,
            dx: `${random(-3, 3).toFixed(2)}px`,
            dy: `${random(-3, 3).toFixed(2)}px`,
            r: `${random(-90, 90).toFixed(0)}deg`,
        }));
}

const STATUS_TEXT = {
    offline: "No connection",
    checking: "Checking…",
    failed: "Still offline",
    online: "Back online",
};

export default function OfflineScreen() {
    const [isShown, setIsShown] = useState(() => !navigator.onLine);
    const [phase, setPhase] = useState("offline");
    // Changes on every failed check, so the shake replays each time
    const [failCount, setFailCount] = useState(0);
    const [logoCells] = useState(makeLogoCells);

    const isCheckingRef = useRef(false);
    const isShownRef = useRef(isShown);
    isShownRef.current = isShown;
    const timersRef = useRef([]);

    const later = (fn, ms) => {
        timersRef.current.push(setTimeout(fn, ms));
    };

    useEffect(() => () => timersRef.current.forEach(clearTimeout), []);

    const check = useCallback(async () => {
        if (!isShownRef.current || isCheckingRef.current) return;
        isCheckingRef.current = true;
        setPhase("checking");

        const startedAt = Date.now();
        let isOnline = false;
        try {
            const response = await fetch(CONNECTION_CHECK_URL, {
                cache: "no-store",
            });
            isOnline = response.ok;
        } catch {}

        later(() => {
            isCheckingRef.current = false;

            if (!isOnline) {
                setPhase("failed");
                setFailCount((count) => count + 1);
                return;
            }

            setPhase("online");
            later(() => {
                setIsShown(false);
                setPhase("offline");
            }, BACK_ONLINE_MS);
        }, Math.max(0, MIN_CHECK_MS - (Date.now() - startedAt)));
    }, []);

    useEffect(() => {
        const handleOffline = () => {
            setPhase("offline");
            setIsShown(true);
        };

        // A phone may switch connection while the app is in the background
        // and say nothing about it once the app is back
        const handleVisibility = () => {
            if (document.visibilityState !== "visible") return;

            if (!navigator.onLine) handleOffline();
            else check();
        };

        window.addEventListener("offline", handleOffline);
        window.addEventListener("online", check);
        document.addEventListener("visibilitychange", handleVisibility);

        return () => {
            window.removeEventListener("offline", handleOffline);
            window.removeEventListener("online", check);
            document.removeEventListener("visibilitychange", handleVisibility);
        };
    }, [check]);

    // The page underneath must not scroll behind this screen
    useEffect(() => {
        if (!isShown) return;

        const root = document.documentElement;
        const previous = root.style.overflow;
        root.style.overflow = "hidden";

        return () => {
            root.style.overflow = previous;
        };
    }, [isShown]);

    if (!isShown) return null;

    return (
        <div
            className={`offline-screen is-${phase}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="offline-title"
        >
            <div className="offline-glow" aria-hidden="true">
                <span />
                <span />
                <span />
            </div>

            <div className="offline-body">
                <div className="offline-content">
                    <div className="offline-logo-wrap" aria-hidden="true">
                        <span className="offline-ripple" />
                        <span className="offline-ripple" />
                        <span className="offline-ripple" />
                        <svg
                            className="offline-logo"
                            viewBox="0 0 16 16"
                            shapeRendering="crispEdges"
                        >
                            <rect
                                className="offline-logo-tile"
                                width="16"
                                height="16"
                                rx="3"
                            />
                            {logoCells.map(({ x, y, dx, dy, r }, i) => (
                                <g
                                    key={`${x}-${y}`}
                                    className="offline-cell"
                                    style={{
                                        "--i": i,
                                        "--dx": dx,
                                        "--dy": dy,
                                        "--r": r,
                                    }}
                                >
                                    <rect x={x} y={y} width="1" height="1" />
                                </g>
                            ))}
                        </svg>
                    </div>

                    <span className="offline-reveal offline-status-wrap">
                        <span
                            key={failCount}
                            className={`offline-status${
                                phase === "failed" ? " is-failed" : ""
                            }`}
                            role="status"
                            aria-live="polite"
                        >
                            <span className="offline-status-dot" />
                            {STATUS_TEXT[phase]}
                        </span>
                    </span>

                    <h2
                        id="offline-title"
                        className="offline-reveal offline-title"
                    >
                        You're offline
                    </h2>
                    <p className="offline-reveal offline-code">
                        {"</ connection lost >"}
                        <span className="offline-caret" />
                    </p>
                    <p className="offline-reveal offline-message">
                        Check your internet connection. This page will
                        reconnect on its own as soon as you're back online.
                    </p>

                    <button
                        type="button"
                        className="offline-reveal offline-retry"
                        onClick={check}
                    >
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <path d="M21 12a9 9 0 1 1-2.64-6.36" />
                            <path d="M21 3v6h-6" />
                        </svg>
                        Try again
                    </button>
                </div>
            </div>
        </div>
    );
}
