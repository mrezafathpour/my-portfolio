import { useEffect, useMemo, useRef } from "react";

// Kept outside the component: default objects made on every render would
// restart the animation each time the parent re-renders
// Larger screens keep the mobile font-to-cell ratio (1.4), so the glyphs
// grow along with the card text instead of thinning out
const DEFAULT_SIZES = {
    base: { cellSize: 10, fontSize: 14 },
    tablet: { cellSize: 12, fontSize: 17 },
    desktop: { cellSize: 14, fontSize: 20 },
};
const DEFAULT_BREAKPOINTS = { mobile: 640, tablet: 1024 };

// Rows this far past the screen's edges are drawn too, so a quick scroll
// reveals glyphs that are already there
const VISIBLE_MARGIN = 120;

export function GlyphPlasmaBackground({
    className,
    seed = 0,
    glyphs = " .:;=+*#%@$&",
    sizes = DEFAULT_SIZES,
    breakpoints = DEFAULT_BREAKPOINTS,

    fontFamily = "main-normal ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    speed = 1,
    // The plasma drifts slowly, so 30 frames a second look just as smooth
    // as 120 and cost a quarter of the work
    fps = 30,
    // The glyphs are faint, so a sharper canvas than this only costs pixels
    maxDpr = 1.5,
    maxCells = 200000,
    colorVar = "--glyph-color",
    fallbackLight = "rgba(0, 0, 0, 0.06)",
    fallbackDark = "rgba(255, 255, 255, 0.06)",
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
        const parent = canvas?.parentElement;
        if (!parent) return;

        const ctx = canvas.getContext("2d", { alpha: true });
        if (!ctx) return;

        const prefersReduced =
            respectReducedMotion &&
            window.matchMedia &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        let raf = 0;
        let lastFrameTime = 0;
        let isOnScreen = false;

        let cssW = 0;
        let cssH = 0;
        let renderDpr = 1;
        let layoutKey = "";

        let activeCellSize = sizes?.base?.cellSize ?? 10;
        let activeFontSize = sizes?.base?.fontSize ?? 14;

        let cell = activeCellSize;
        let cols = 0;
        let rows = 0;

        // Parts of the plasma that never change for a given grid, worked out
        // once per resize instead of for every cell on every frame
        let colWave = new Float32Array(0);
        let rowWave = new Float32Array(0);
        let diagWave = new Float32Array(0);
        let shimmerFreq = new Float32Array(0);
        let shimmerPhase = new Float32Array(0);
        // Per frame: each blob's squared distance along each column and row
        let blobDx = [0, 1, 2].map(() => new Float32Array(0));
        let blobDy = [0, 1, 2].map(() => new Float32Array(0));

        // Every glyph drawn once into a small canvas of its own; copying
        // those is much cheaper than drawing text thousands of times a frame
        let sprites = [];
        let spriteH = 0;

        const pickSizes = () => {
            const w = window.innerWidth;
            const h = window.innerHeight;

            const bpMobile = breakpoints?.mobile ?? 640;
            const bpTablet = breakpoints?.tablet ?? 1024;

            // A phone turned sideways is as wide as a tablet, but should keep
            // the glyphs it has upright: a short, wide screen counts as a phone
            const isPhoneSideways = h <= 500 && w > h;

            const base = sizes?.base || {};
            const chosen =
                w < bpMobile || isPhoneSideways
                    ? sizes?.mobile
                    : w < bpTablet
                      ? sizes?.tablet
                      : sizes?.desktop;

            activeCellSize = chosen?.cellSize ?? base.cellSize ?? 10;
            activeFontSize = chosen?.fontSize ?? base.fontSize ?? 14;
        };

        const readGlyphColorFromCSS = () => {
            const styles = getComputedStyle(parent);

            const value = (styles.getPropertyValue(colorVar) || "").trim();
            if (value) return value;

            const mq = window.matchMedia
                ? window.matchMedia("(prefers-color-scheme: dark)")
                : null;
            const isDark = mq ? mq.matches : false;
            return isDark ? fallbackDark : fallbackLight;
        };

        let glyphColor = readGlyphColorFromCSS();

        const hash2 = (x, y) => {
            const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
            return s - Math.floor(s);
        };

        const buildSprites = () => {
            const font = `${activeFontSize}px ${fontFamily}`;
            ctx.font = font;
            spriteH = Math.ceil(activeFontSize * 1.4);

            sprites = glyphArr.map((ch) => {
                if (ch === " ") return null;

                const w = Math.ceil(ctx.measureText(ch).width) + 2;
                const sprite = document.createElement("canvas");
                sprite.width = Math.ceil(w * renderDpr);
                sprite.height = Math.ceil(spriteH * renderDpr);

                const sctx = sprite.getContext("2d");
                sctx.scale(renderDpr, renderDpr);
                sctx.font = font;
                sctx.textBaseline = "top";
                sctx.fillStyle = glyphColor;
                sctx.fillText(ch, 0, 0);

                return { image: sprite, w };
            });
        };

        const buildGrid = () => {
            cell = activeCellSize;
            const approxCells =
                Math.ceil(cssW / cell) * Math.ceil(cssH / cell);
            if (approxCells > maxCells) {
                cell = Math.ceil(cell * Math.sqrt(approxCells / maxCells));
            }

            cols = Math.ceil(cssW / cell);
            rows = Math.ceil(cssH / cell);

            colWave = new Float32Array(cols);
            for (let c = 0; c < cols; c++)
                colWave[c] = 0.35 * Math.sin((c / 6) * 0.85);

            rowWave = new Float32Array(rows);
            for (let r = 0; r < rows; r++)
                rowWave[r] = 0.35 * Math.sin((r / 6) * 0.78);

            diagWave = new Float32Array(cols + rows);
            for (let d = 0; d < cols + rows; d++)
                diagWave[d] = 0.3 * Math.sin((d / 6) * 0.55);

            shimmerFreq = new Float32Array(cols * rows);
            shimmerPhase = new Float32Array(cols * rows);
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const h = hash2(c, r);
                    shimmerFreq[r * cols + c] = 2.2 + h * 2.5;
                    shimmerPhase[r * cols + c] = h * 6.283;
                }
            }

            blobDx = blobDx.map(() => new Float32Array(cols));
            blobDy = blobDy.map(() => new Float32Array(rows));
        };

        // Sizes the canvas to its card and rebuilds whatever the new size,
        // breakpoint or colour invalidates. Returns whether anything changed.
        const ensureSize = () => {
            const rect = parent.getBoundingClientRect();

            const newCssW = Math.min(
                Math.max(1, Math.round(rect.width)),
                maxCanvasDim,
            );
            const newCssH = Math.min(
                Math.max(1, Math.round(rect.height)),
                maxCanvasDim,
            );

            let dpr = Math.min(
                Math.max(1, window.devicePixelRatio || 1),
                maxDpr,
                maxCanvasDim / newCssW,
                maxCanvasDim / newCssH,
                Math.sqrt(maxCanvasArea / (newCssW * newCssH)),
            );
            dpr = Math.max(1, dpr);

            const key = [
                newCssW,
                newCssH,
                dpr,
                activeCellSize,
                activeFontSize,
                glyphColor,
            ].join("|");
            if (key === layoutKey) return false;
            layoutKey = key;

            cssW = newCssW;
            cssH = newCssH;
            renderDpr = dpr;

            canvas.width = Math.max(1, Math.round(cssW * renderDpr));
            canvas.height = Math.max(1, Math.round(cssH * renderDpr));
            ctx.setTransform(renderDpr, 0, 0, renderDpr, 0, 0);

            buildSprites();
            buildGrid();
            return true;
        };

        // Draws rows firstRow..lastRow (exclusive) of the plasma at time now
        const render = (now, firstRow, lastRow) => {
            const t = (now / 1000) * speed + seed * 1000;

            const s1 = Math.sin(t * 0.9);
            const s2 = Math.sin(t * 1.3 + 1.7);
            const s3 = Math.sin(t * 0.6 + 3.1);

            const centers = [
                [
                    cols * (0.5 + 0.25 * Math.sin(t * 0.23)),
                    rows * (0.5 + 0.25 * Math.cos(t * 0.19)),
                ],
                [
                    cols * (0.5 + 0.3 * Math.sin(t * 0.17 + 2.0)),
                    rows * (0.5 + 0.3 * Math.cos(t * 0.21 + 2.0)),
                ],
                [
                    cols * (0.5 + 0.22 * Math.sin(t * 0.29 + 4.0)),
                    rows * (0.5 + 0.22 * Math.cos(t * 0.27 + 4.0)),
                ],
            ];
            for (let i = 0; i < 3; i++) {
                const [cx, cy] = centers[i];
                const dx = blobDx[i];
                const dy = blobDy[i];
                for (let c = 0; c < cols; c++) dx[c] = (c - cx) * (c - cx);
                for (let r = firstRow; r < lastRow; r++)
                    dy[r] = (r - cy) * (r - cy);
            }
            const [dx1, dx2, dx3] = blobDx;
            const [dy1, dy2, dy3] = blobDy;

            const k1 = 0.08;
            const k2 = k1 * 1.1;
            const k3 = k1 * 0.95;
            const last = glyphArr.length - 1;

            ctx.clearRect(
                0,
                firstRow * cell,
                cssW,
                (lastRow - firstRow) * cell,
            );

            for (let r = firstRow; r < lastRow; r++) {
                const y = r * cell;
                const rowBase = rowWave[r] * s2;

                for (let c = 0; c < cols; c++) {
                    const base =
                        colWave[c] * s1 + rowBase + diagWave[c + r] * s3;

                    const b =
                        1 / (1 + k1 * (dx1[c] + dy1[r])) +
                        0.9 / (1 + k2 * (dx2[c] + dy2[r])) +
                        0.8 / (1 + k3 * (dx3[c] + dy3[r]));

                    const i = r * cols + c;
                    const v =
                        base +
                        blobStrength * (b - 0.9) +
                        shimmerStrength *
                            Math.sin(t * shimmerFreq[i] + shimmerPhase[i]);

                    const n = Math.min(1, Math.max(0, (v + 1) * 0.5));
                    const sprite =
                        sprites[Math.min(last, Math.floor(n * glyphArr.length))];
                    if (!sprite) continue;

                    ctx.drawImage(sprite.image, c * cell, y, sprite.w, spriteH);
                }
            }
        };

        const renderStill = () => render(0, 0, rows);

        const drawFrame = (now) => {
            raf = requestAnimationFrame(drawFrame);

            // A little slack, so a 60 Hz screen does not drop to 20 frames
            // a second when a frame lands a hair early
            if (fps > 0 && now - lastFrameTime < 1000 / fps - 2) return;
            lastFrameTime = now;

            // Only the rows on (or just off) the screen: a card taller than
            // the screen never draws its hidden part
            const rect = canvas.getBoundingClientRect();
            const top = Math.max(0, -rect.top - VISIBLE_MARGIN);
            const bottom = Math.min(
                cssH,
                window.innerHeight - rect.top + VISIBLE_MARGIN,
            );
            if (bottom <= top) return;

            render(
                now,
                Math.floor(top / cell),
                Math.min(rows, Math.ceil(bottom / cell)),
            );
        };

        const start = () => {
            if (raf || prefersReduced || !isOnScreen || document.hidden) return;
            lastFrameTime = 0;
            raf = requestAnimationFrame(drawFrame);
        };
        const stop = () => {
            cancelAnimationFrame(raf);
            raf = 0;
        };

        const refresh = () => {
            pickSizes();
            // A resized canvas is blank; the running loop fills it again on
            // its next frame, a still one has to be drawn again here
            if (ensureSize() && prefersReduced) renderStill();
        };

        const mq = window.matchMedia
            ? window.matchMedia("(prefers-color-scheme: dark)")
            : null;
        const onSchemeChange = () => {
            glyphColor = readGlyphColorFromCSS();
            refresh();
        };
        if (mq) {
            if (mq.addEventListener)
                mq.addEventListener("change", onSchemeChange);
            else mq.addListener(onSchemeChange);
        }

        const onVis = () => (document.hidden ? stop() : start());

        // Animates only while the card is on screen
        const visibilityObserver = new IntersectionObserver(
            ([entry]) => {
                isOnScreen = entry.isIntersecting;
                if (isOnScreen) start();
                else stop();
            },
            { rootMargin: `${VISIBLE_MARGIN}px 0px` },
        );
        const resizeObserver = new ResizeObserver(refresh);

        window.addEventListener("resize", refresh);
        document.addEventListener("visibilitychange", onVis);
        visibilityObserver.observe(canvas);
        resizeObserver.observe(parent);

        refresh();
        if (prefersReduced) renderStill();

        return () => {
            stop();
            visibilityObserver.disconnect();
            resizeObserver.disconnect();
            window.removeEventListener("resize", refresh);
            document.removeEventListener("visibilitychange", onVis);
            if (mq) {
                if (mq.removeEventListener)
                    mq.removeEventListener("change", onSchemeChange);
                else mq.removeListener(onSchemeChange);
            }
        };
    }, [
        glyphArr,
        sizes,
        breakpoints,
        fontFamily,
        speed,
        fps,
        maxDpr,
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
