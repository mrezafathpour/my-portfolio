import { useEffect, useMemo, useRef } from "react";

export function GlyphPlasmaBackground({
    className,
    seed = 0,
    glyphs = " .:;=+*#%@$&",
    sizes = {
        base: { cellSize: 10, fontSize: 14 },
        mobile: { cellSize: 8, fontSize: 10 },
        tablet: { cellSize: 11, fontSize: 15 },
        desktop: { cellSize: 16, fontSize: 20 },
    },
    breakpoints = { mobile: 640, tablet: 1024 },

    fontFamily = "main-normal ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    speed = 1,
    fps = 120,
    trailStrength = 0.5,
    maxCells = 200000,
    colorVar = "--glyph-color",
    fallbackLight = "rgba(0, 0, 0, 0.05)",
    fallbackDark = "rgba(255, 255, 255, 0.05)",
    respectReducedMotion = true,
    maxCanvasDim = 8192,
    maxCanvasArea = 8192 * 8192,
    blobStrength = 1,
    shimmerStrength = 0.06,
}) {
    const canvasRef = useRef(null);
    const glyphArr = useMemo(() => glyphs.split(""), [glyphs]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d", { alpha: true });
        if (!ctx) return;

        const prefersReduced =
            respectReducedMotion &&
            window.matchMedia &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        let raf = 0;
        let lastFrameTime = 0;

        let cssW = 0;
        let cssH = 0;
        let renderDpr = 1;

        let activeCellSize = sizes?.base?.cellSize ?? 10;
        let activeFontSize = sizes?.base?.fontSize ?? 14;

        const pickSizes = () => {
            const w = window.innerWidth;

            const bpMobile = breakpoints?.mobile ?? 640;
            const bpTablet = breakpoints?.tablet ?? 1024;

            const base = sizes?.base || {};
            const chosen =
                w < bpMobile
                    ? sizes?.mobile
                    : w < bpTablet
                    ? sizes?.tablet
                    : sizes?.desktop;

            activeCellSize = chosen?.cellSize ?? base.cellSize ?? 10;
            activeFontSize = chosen?.fontSize ?? base.fontSize ?? 14;

            ctx.font = `${activeFontSize}px ${fontFamily}`;
        };

        pickSizes();

        let glyphColor = fallbackDark;

        const readGlyphColorFromCSS = () => {
            const host = canvas.parentElement || document.documentElement;
            const styles = getComputedStyle(host);

            const value = (styles.getPropertyValue(colorVar) || "").trim();
            if (value) return value;

            const mq = window.matchMedia
                ? window.matchMedia("(prefers-color-scheme: dark)")
                : null;
            const isDark = mq ? mq.matches : false;
            return isDark ? fallbackDark : fallbackLight;
        };

        glyphColor = readGlyphColorFromCSS();

        const ensureSize = () => {
            const parent = canvas.parentElement;
            if (!parent) return;

            const rect = parent.getBoundingClientRect();

            let newCssW = Math.max(1, Math.round(rect.width));
            let newCssH = Math.max(1, Math.round(rect.height));

            newCssW = Math.min(newCssW, maxCanvasDim);
            newCssH = Math.min(newCssH, maxCanvasDim);

            const dpr = Math.max(1, window.devicePixelRatio || 1);

            let dprCandidate = dpr;
            dprCandidate = Math.min(
                dprCandidate,
                maxCanvasDim / newCssW,
                maxCanvasDim / newCssH
            );

            const areaAt1 = newCssW * newCssH;
            if (areaAt1 > 0) {
                dprCandidate = Math.min(
                    dprCandidate,
                    Math.sqrt(maxCanvasArea / areaAt1)
                );
            }
            dprCandidate = Math.max(1, dprCandidate);

            if (
                newCssW === cssW &&
                newCssH === cssH &&
                dprCandidate === renderDpr
            )
                return;

            cssW = newCssW;
            cssH = newCssH;
            renderDpr = dprCandidate;

            const pxW = Math.max(1, Math.round(cssW * renderDpr));
            const pxH = Math.max(1, Math.round(cssH * renderDpr));

            if (canvas.width !== pxW) canvas.width = pxW;
            if (canvas.height !== pxH) canvas.height = pxH;

            ctx.setTransform(renderDpr, 0, 0, renderDpr, 0, 0);
            ctx.textBaseline = "top";
            ctx.textAlign = "left";

            ctx.font = `${activeFontSize}px ${fontFamily}`;
        };

        const hash2 = (x, y) => {
            const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
            return s - Math.floor(s);
        };

        const blob = (x, y, cx, cy, k) => {
            const dx = x - cx;
            const dy = y - cy;
            return 1 / (1 + k * (dx * dx + dy * dy));
        };

        const mq = window.matchMedia
            ? window.matchMedia("(prefers-color-scheme: dark)")
            : null;
        const onSchemeChange = () => {
            glyphColor = readGlyphColorFromCSS();
            ctx.clearRect(0, 0, cssW, cssH);
        };
        if (mq) {
            if (mq.addEventListener)
                mq.addEventListener("change", onSchemeChange);
            else mq.addListener(onSchemeChange);
        }

        const drawFrame = (now) => {
            raf = requestAnimationFrame(drawFrame);
            if (prefersReduced) return;

            if (fps > 0) {
                const minDt = 1000 / fps;
                if (now - lastFrameTime < minDt) return;
                lastFrameTime = now;
            }

            try {
                ensureSize();
            } catch {
                return;
            }
            if (cssW <= 0 || cssH <= 0) return;

            let effectiveCell = activeCellSize;
            const approxCols = Math.ceil(cssW / effectiveCell);
            const approxRows = Math.ceil(cssH / effectiveCell);
            const approxCells = approxCols * approxRows;
            if (approxCells > maxCells) {
                const scale = Math.sqrt(approxCells / maxCells);
                effectiveCell = Math.ceil(effectiveCell * scale);
            }

            const cols = Math.ceil(cssW / effectiveCell);
            const rows = Math.ceil(cssH / effectiveCell);

            if (trailStrength > 0) {
                ctx.save();
                ctx.globalCompositeOperation = "destination-in";
                ctx.fillStyle = `rgba(0,0,0,${1 - trailStrength})`;
                ctx.fillRect(0, 0, cssW, cssH);
                ctx.restore();
            } else {
                ctx.clearRect(0, 0, cssW, cssH);
            }

            ctx.fillStyle = glyphColor;

            const t = (now / 1000) * speed + seed * 1000;

            const s1 = Math.sin(t * 0.9);
            const s2 = Math.sin(t * 1.3 + 1.7);
            const s3 = Math.sin(t * 0.6 + 3.1);

            const cx1 = cols * (0.5 + 0.25 * Math.sin(t * 0.23));
            const cy1 = rows * (0.5 + 0.25 * Math.cos(t * 0.19));
            const cx2 = cols * (0.5 + 0.3 * Math.sin(t * 0.17 + 2.0));
            const cy2 = rows * (0.5 + 0.3 * Math.cos(t * 0.21 + 2.0));
            const cx3 = cols * (0.5 + 0.22 * Math.sin(t * 0.29 + 4.0));
            const cy3 = rows * (0.5 + 0.22 * Math.cos(t * 0.27 + 4.0));

            const k = 0.08;

            for (let r = 0; r < rows; r++) {
                const y = r * effectiveCell;

                for (let c = 0; c < cols; c++) {
                    const x = c * effectiveCell;

                    const gx = c / 6;
                    const gy = r / 6;

                    const base =
                        0.35 * Math.sin(gx * 0.85) * s1 +
                        0.35 * Math.sin(gy * 0.78) * s2 +
                        0.3 * Math.sin((gx + gy) * 0.55) * s3;

                    const b =
                        blob(c, r, cx1, cy1, k) +
                        0.9 * blob(c, r, cx2, cy2, k * 1.1) +
                        0.8 * blob(c, r, cx3, cy3, k * 0.95);

                    let v = base + blobStrength * (b - 0.9);

                    const h = hash2(c, r);
                    v +=
                        shimmerStrength *
                        Math.sin(t * (2.2 + h * 2.5) + h * 6.283);

                    const n = Math.min(1, Math.max(0, (v + 1) * 0.5));

                    const idx = Math.min(
                        glyphArr.length - 1,
                        Math.floor(n * glyphArr.length)
                    );
                    const ch = glyphArr[idx];
                    if (ch === " ") continue;

                    ctx.fillText(ch, x, y);
                }
            }
        };

        const onResize = () => {
            pickSizes();
            try {
                ensureSize();
            } catch {}
        };
        const onVis = () => {
            if (document.hidden) cancelAnimationFrame(raf);
            else {
                lastFrameTime = 0;
                raf = requestAnimationFrame(drawFrame);
            }
        };

        window.addEventListener("resize", onResize);
        document.addEventListener("visibilitychange", onVis);

        try {
            ensureSize();
        } catch {}
        raf = requestAnimationFrame(drawFrame);

        return () => {
            window.removeEventListener("resize", onResize);
            document.removeEventListener("visibilitychange", onVis);
            if (mq) {
                if (mq.removeEventListener)
                    mq.removeEventListener("change", onSchemeChange);
                else mq.removeListener(onSchemeChange);
            }
            cancelAnimationFrame(raf);
        };
    }, [
        glyphArr,
        sizes,
        breakpoints,
        fontFamily,
        speed,
        fps,
        trailStrength,
        maxCells,
        colorVar,
        fallbackLight,
        fallbackDark,
        respectReducedMotion,
        maxCanvasDim,
        maxCanvasArea,
        blobStrength,
        shimmerStrength,
        seed,
    ]);

    return (
        <canvas
            ref={canvasRef}
            className={className}
            aria-hidden="true"
            style={{
                pointerEvents: "none",
                width: "100%",
                height: "100%",
                display: "block",
            }}
        />
    );
}
