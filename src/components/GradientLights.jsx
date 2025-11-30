import { useEffect, useRef, useState } from "react";

// ---------- COLOR GROUPS ----------
const gradientGroups = {
    pinkPurple: [
        ["#ff007f", "#8a2be2"],
        ["#ff4db2", "#6a00ff"],
        ["#ff00c8", "#4b00ff"],
        ["#4400ff", "#9b00ff"],
        ["#5a00ff", "#cc00ff"],
        ["#3a00ff", "#b200ff"],
    ],
    redOrange: [
        ["#ff1a1a", "#ff8c00"],
        ["#ff6a00", "#ee0979"],
        ["#ff2a00", "#ff5f33"],
    ],
    yellow: [
        ["#ffe600", "#ff9900"],
        ["#fff200", "#ff5f00"],
        ["#ffed4a", "#ff8800"],
    ],
    blueTurquoise: [
        ["#0047ff", "#00a2ff"],
        ["#0060ff", "#0091ff"],
        ["#003cff", "#00bbff"],
    ],
    turquoise: [
        ["#00ffd5", "#008cff"],
        ["#00ffea", "#00bcd4"],
        ["#00ffe4", "#009cff"],
    ],
    green: [
        ["#00ff6a", "#00b36b"],
        ["#a8ff00", "#00c853"],
        ["#66ff00", "#009e59"],
    ],
    exotic: [
        ["#ff00ff", "#00ff00"],
        ["#ffea00", "#00c8ff"],
        ["#ff003c", "#00ffc8"],
        ["#ff8c00", "#7600ff"],
        ["#00ff95", "#ff005a"],
        ["#39ff14", "#ff3131"],
        ["#ffe600", "#7f00ff"],
        ["#00ffea", "#ff6600"],
        ["#00ff4c", "#ff00c8"],
        ["#ff00d4", "#00eaff"],
        ["#ff1a00", "#00eaff"],
        ["#ffee00", "#ff00aa"],
    ],
};

// Pick 1 gradient from unique hue groups first, then fill the rest non-repeated.
function selectUniqueGradients(count) {
    const groups = [...Object.values(gradientGroups)].sort(
        () => Math.random() - 0.5
    );
    const flat = groups.flat();
    const used = new Set();
    const result = [];

    if (count > flat.length) {
        throw new Error("Requested more lights than unique gradients.");
    }
    for (const group of groups) {
        if (result.length >= count) break;
        const g = group[Math.floor(Math.random() * group.length)];
        const key = g.join("-");
        if (!used.has(key)) {
            used.add(key);
            result.push(g);
        }
    }
    while (result.length < count) {
        const g = flat[Math.floor(Math.random() * flat.length)];
        const key = g.join("-");
        if (!used.has(key)) {
            used.add(key);
            result.push(g);
        }
    }
    return result;
}

// Dynamic size based on screen width
function getLightSize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    if (width < 640 || height < 640) return 120;
    if (width < 1024) return 240;
    return 360;
}

// Random position inside container
function randomPosition(W, H, SIZE) {
    let x = Math.random() * (W - SIZE);
    let y = Math.random() * (H - SIZE);
    return { x, y };
}

// ---------- MAIN COMPONENT ----------
export default function GradientLights({
    count = 4 + Math.floor(Math.random() * 4),
    movementSpeed = 1,
}) {
    const containerRef = useRef(null);
    const lastSizeRef = useRef({
        w: typeof window !== "undefined" ? window.innerWidth : 0,
        h: typeof window !== "undefined" ? window.innerHeight : 0,
    });
    const [lights, setLights] = useState([]);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const W = el.offsetWidth;
        const H = el.offsetHeight;
        const SIZE = getLightSize();

        const gradients = selectUniqueGradients(count);

        const positions = Array.from({ length: count }).map(() =>
            randomPosition(W, H, SIZE)
        );

        setLights(
            gradients.map((g, i) => ({
                colors: g,
                pos: positions[i],
            }))
        );
    }, [count]);

    useEffect(() => {
        if (lights.length === 0) return;

        const el = containerRef.current;
        const elements = el.querySelectorAll(".gradient-light");
        const timeouts = [];

        const animate = (lightEl) => {
            const W = el.offsetWidth;
            const H = el.offsetHeight;
            const SIZE = getLightSize();

            const { x, y } = randomPosition(W, H, SIZE);

            lightEl.style.transform = `translate(${x}px, ${y}px)`;

            const minOpacity = SIZE < 200 ? 0.5 : 0.25;
            const maxOpacity = SIZE < 200 ? 0.75 : 0.45;
            lightEl.style.opacity =
                minOpacity + Math.random() * (maxOpacity - minOpacity);

            const duration =
                ((5000 + Math.random() * 6000) * (SIZE / 240)) / movementSpeed;

            const t = setTimeout(() => animate(lightEl), duration);
            timeouts.push(t);
        };

        elements.forEach(animate);

        return () => timeouts.forEach(clearTimeout);
    }, [lights, movementSpeed]);

    // ---- RESIZE HANDLER (also fixes effects) ----
    useEffect(() => {
        function handleResize() {
            const el = containerRef.current;
            if (!el) return;

            const w = window.innerWidth;
            const h = window.innerHeight;

            const prev = lastSizeRef.current;
            const deltaW = Math.abs(w - prev.w);
            const deltaH = Math.abs(h - prev.h);

            // Ignore small changes (tweak thresholds if you like)
            const MIN_DELTA_W = 100; // e.g. orientation / major layout change
            const MIN_DELTA_H = 100;

            // On mobile Safari, height changes a lot due to address bar,
            // so we usually care more about width OR a big height change.
            if (deltaW < MIN_DELTA_W && deltaH < MIN_DELTA_H) {
                return;
            }

            // Update stored size
            lastSizeRef.current = { w, h };

            const W = el.offsetWidth;
            const H = el.offsetHeight;
            const SIZE = getLightSize();

            setLights((prev) =>
                prev.map((light) => ({
                    ...light,
                    pos: randomPosition(W, H, SIZE),
                }))
            );
        }

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
        <div
            ref={containerRef}
            style={{
                position: "absolute",
                inset: 0,
                overflow: "hidden",
                zIndex: -1,
            }}
        >
            {lights.map((light, i) => {
                const { colors, pos } = light;
                const SIZE = getLightSize();
                const BLUR = SIZE * 0.45;

                return (
                    <div
                        key={i}
                        className="gradient-light"
                        style={{
                            position: "absolute",
                            width: SIZE + "px",
                            height: SIZE + "px",
                            borderRadius: "50%",
                            filter: `blur(${BLUR}px)`,
                            pointerEvents: "none",
                            mixBlendMode: "screen",
                            opacity: 0,
                            background: `radial-gradient(circle at center, ${colors[0]}, ${colors[1]})`,
                            transition: `transform ${
                                9 / movementSpeed
                            }s linear, opacity 2s ease`,
                            transform: `translate(${pos.x}px, ${pos.y}px)`,
                        }}
                    />
                );
            })}
        </div>
    );
}
