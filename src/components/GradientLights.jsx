import { useEffect, useMemo, useRef, useState } from "react";
import { LightGradients } from "../store/LightColors";

// A light crossing the whole long side of the screen takes about this long,
// on every screen size; shorter trips take proportionally less
const CROSS_SCREEN_MS = 16000;
const MIN_TRIP_MS = 3000;

// Every trip covers at least this share of the screen's long side, so lights
// keep sweeping the screen (top to bottom on a phone) instead of hovering
const MIN_TRIP_SHARE = 0.4;
const TARGET_ATTEMPTS = 6;

// A light rests up to this long where it arrives before setting off again
const MAX_REST_MS = 3000;

// A resize smaller than this (e.g. a phone's address bar sliding away) does
// not send the lights off to new places
const MIN_RESIZE_DELTA = 100;

// Lights glow much stronger on the dark page, so there they are dimmed to
// this share of their brightness
const DARK_MODE_DIMMING = 0.7;

function shuffle(items) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

const pickRandom = (items) => items[Math.floor(Math.random() * items.length)];

// One gradient from each hue group first (in random order), then any others
function selectUniqueGradients(count) {
    const groups = shuffle(Object.values(LightGradients));
    const picked = groups.map(pickRandom);
    const rest = shuffle(groups.flat().filter((g) => !picked.includes(g)));

    return [...picked, ...rest].slice(0, count);
}

const getViewport = () => ({ w: window.innerWidth, h: window.innerHeight });

function getLightSize({ w, h }) {
    if (w < 640 || h < 640) return 120;
    if (w < 1700) return 240;
    return 360;
}

// Small lights are brighter so they still read on a small screen
function randomOpacity(size) {
    const min = size < 200 ? 0.5 : 0.25;
    const max = size < 200 ? 0.75 : 0.45;
    const opacity = min + Math.random() * (max - min);

    const isDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    return isDark ? opacity * DARK_MODE_DIMMING : opacity;
}

const randomPosition = (maxX, maxY) => ({
    x: Math.random() * maxX,
    y: Math.random() * maxY,
});

const distanceBetween = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// 0..1, landing near either end more often than in the middle
const randomTowardsEnds = () => Math.sin((Math.random() * Math.PI) / 2) ** 2;

// Lights travelling between evenly spread spots would cross the middle of the
// screen on most trips and seem to stay there. So along the long side (the
// height on a phone, the width on a desktop) destinations favour the two ends.
const randomDestination = (maxX, maxY) =>
    maxX >= maxY
        ? { x: randomTowardsEnds() * maxX, y: Math.random() * maxY }
        : { x: Math.random() * maxX, y: randomTowardsEnds() * maxY };

// A destination far enough from the current spot (or the farthest one found)
function pickTarget(from, maxX, maxY) {
    const minDistance = Math.max(maxX, maxY) * MIN_TRIP_SHARE;
    let farthest = from;

    for (let attempt = 0; attempt < TARGET_ATTEMPTS; attempt++) {
        const candidate = randomDestination(maxX, maxY);
        if (distanceBetween(candidate, from) >= minDistance) return candidate;
        if (distanceBetween(candidate, from) > distanceBetween(farthest, from))
            farthest = candidate;
    }

    return farthest;
}

// Where the light is drawn right now, even in the middle of a trip
function currentPosition(el) {
    const { m41, m42 } = new DOMMatrixReadOnly(getComputedStyle(el).transform);
    return { x: m41, y: m42 };
}

export default function GradientLights({
    count,
    movementSpeed = 1,
    fadeDuration = 2,
}) {
    const containerRef = useRef(null);
    const [viewport, setViewport] = useState(getViewport);

    // Decided once: a random default must not change from render to render
    const [defaultCount] = useState(() => 6 + Math.floor(Math.random() * 4));
    const lightCount = count ?? defaultCount;

    const size = getLightSize(viewport);

    const lights = useMemo(() => {
        const { w, h } = getViewport();
        const initialSize = getLightSize({ w, h });

        return selectUniqueGradients(lightCount).map((colors) => ({
            colors,
            // Only where the light first appears; it is moved from there by
            // the effect below, not by re-rendering
            start: randomPosition(
                Math.max(0, w - initialSize),
                Math.max(0, h - initialSize)
            ),
        }));
    }, [lightCount]);

    // Each light travels from spot to spot, resting briefly at each one. The
    // browser animates a trip as a CSS transition, and a timer only fires once
    // per trip to start the next.
    useEffect(() => {
        const container = containerRef.current;
        const elements = [...container.children];
        const timers = [];

        const startTrip = (el, i, from) => {
            const maxX = Math.max(0, container.offsetWidth - size);
            const maxY = Math.max(0, container.offsetHeight - size);
            const longSide = Math.max(maxX, maxY, 1);

            const to = pickTarget(from, maxX, maxY);
            const duration =
                Math.max(
                    MIN_TRIP_MS,
                    (distanceBetween(from, to) / longSide) *
                        CROSS_SCREEN_MS *
                        (0.8 + Math.random() * 0.4)
                ) / movementSpeed;

            el.style.transition = `transform ${duration}ms linear, opacity ${fadeDuration}s ease`;
            el.style.transform = `translate(${to.x}px, ${to.y}px)`;
            el.style.opacity = randomOpacity(size);

            const rest = (Math.random() * MAX_REST_MS) / movementSpeed;
            timers[i] = setTimeout(() => startTrip(el, i, to), duration + rest);
        };

        elements.forEach((el, i) => startTrip(el, i, currentPosition(el)));

        return () => timers.forEach(clearTimeout);
    }, [lights, size, viewport, movementSpeed, fadeDuration]);

    useEffect(() => {
        const handleResize = () => {
            const next = getViewport();

            setViewport((prev) =>
                Math.abs(next.w - prev.w) < MIN_RESIZE_DELTA &&
                Math.abs(next.h - prev.h) < MIN_RESIZE_DELTA
                    ? prev
                    : next
            );
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
        <div
            ref={containerRef}
            style={{
                position: "fixed",
                inset: 0,
                overflow: "hidden",
                pointerEvents: "none",
                zIndex: "var(--z-background)",
            }}
        >
            {lights.map(({ colors, start }, i) => (
                <div
                    key={i}
                    className="gradient-light"
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: size + "px",
                        height: size + "px",
                        borderRadius: "50%",
                        filter: `blur(${size * 0.45}px)`,
                        mixBlendMode: "screen",
                        opacity: 0,
                        background: `radial-gradient(circle at center, ${colors[0]}, ${colors[1]})`,
                        transform: `translate(${start.x}px, ${start.y}px)`,
                        // Keeps each blurred light on its own layer, so moving
                        // it never makes the browser redraw the blur
                        willChange: "transform, opacity",
                    }}
                />
            ))}
        </div>
    );
}
