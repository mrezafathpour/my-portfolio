import { useState, useEffect } from "react";
import { FiChevronLeft, FiChevronRight, FiMaximize2 } from "react-icons/fi";
import useSwipe from "./useSwipe";
import { prefersReducedMotion } from "./motion";

const AUTOPLAY_MS = 5000;

const getOffset = (i, active, count) => {
    let offset = (((i - active) % count) + count) % count;
    if (offset > count / 2) offset -= count;
    return offset;
};

const pad = (n) => String(n).padStart(2, "0");

// Photos already asked for, kept for the whole visit, so going back to a
// project does not ask for its photos again
const preloadedImages = new Set();

export default function ProjectCarousel({ projects, isGalleryOpen, onOpen }) {
    const [active, setActive] = useState(() =>
        Math.floor(Math.random() * projects.length)
    );
    const [isPaused, setIsPaused] = useState(false);
    const [autoplay, setAutoplay] = useState(() => !prefersReducedMotion());
    // Which way the last move went (1: forwards, -1: back) and which project
    // it left, so the text below can leave towards one side and the new
    // text come in from the other
    const [direction, setDirection] = useState(1);
    const [leaving, setLeaving] = useState(null);

    const count = projects.length;
    const isAutoplaying = autoplay && !isPaused && !isGalleryOpen && count > 1;

    const moveTo = (target, dir) => {
        if (target === active) return;

        setDirection(dir);
        setLeaving(active);
        setActive(target);
    };

    const goTo = (i) => {
        setAutoplay(false);

        const target = ((i % count) + count) % count;
        moveTo(target, Math.sign(getOffset(target, active, count)) || 1);
    };
    const next = () => goTo(active + 1);
    const prev = () => goTo(active - 1);

    const swipeHandlers = useSwipe(prev, next);

    useEffect(() => {
        if (!isAutoplaying) return;

        const timeout = setTimeout(() => {
            setDirection(1);
            setLeaving(active);
            setActive((active + 1) % count);
        }, AUTOPLAY_MS);

        return () => clearTimeout(timeout);
    }, [active, isAutoplaying, count]);

    // Loads the active project's photos ahead, so its gallery opens at once;
    // only the first time each project comes up, not on every visit
    useEffect(() => {
        projects[active].images.forEach((src) => {
            if (preloadedImages.has(src)) return;

            preloadedImages.add(src);
            const img = new Image();
            img.src = src;
        });
    }, [projects, active]);

    const handleKeyDown = (e) => {
        if (e.key === "ArrowRight") next();
        else if (e.key === "ArrowLeft") prev();
    };

    const handleSlideClick = (e, i) => {
        if (i === active) {
            setAutoplay(false);
            // detail is 0 when the click came from the keyboard (Enter/Space)
            onOpen(projects[i], e.detail === 0);
        } else {
            goTo(i);
        }
    };

    return (
        <div
            className={"pc" + (isAutoplaying ? " is-autoplaying" : "")}
            style={{
                "--pc-dir": direction,
                "--pc-autoplay": `${AUTOPLAY_MS}ms`,
            }}
            role="group"
            aria-roledescription="carousel"
            aria-label="Projects"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onKeyDown={handleKeyDown}
        >
            <div className="pc-stage" {...swipeHandlers}>
                {projects.map((project, i) => {
                    const offset = getOffset(i, active, count);
                    const distance = Math.abs(offset);
                    const isActive = offset === 0;

                    return (
                        <button
                            key={project.id}
                            type="button"
                            className={
                                "pc-slide" +
                                (isActive ? " is-active" : "") +
                                (distance > 1 ? " is-hidden" : "")
                            }
                            style={{
                                "--offset": offset,
                                "--distance": distance,
                            }}
                            tabIndex={distance > 1 ? -1 : 0}
                            aria-hidden={distance > 1}
                            aria-label={
                                isActive
                                    ? `Open ${project.title} gallery`
                                    : `Show ${project.title}`
                            }
                            onClick={(e) => handleSlideClick(e, i)}
                        >
                            <img
                                src={project.images[0]}
                                alt=""
                                className="disable-select"
                                draggable={false}
                            />
                            <span className="pc-slide-badge">
                                <FiMaximize2 aria-hidden="true" />
                                {project.images.length} shots
                            </span>
                        </button>
                    );
                })}
            </div>

            <div className="pc-info" aria-live={autoplay ? "off" : "polite"}>
                {projects.map((project, i) => (
                    <div
                        key={project.id}
                        className={
                            "pc-info-item" +
                            (i === active ? " is-active" : "") +
                            (i === leaving && i !== active ? " is-leaving" : "")
                        }
                        aria-hidden={i !== active}
                    >
                        <span className="pc-count">
                            {pad(i + 1)} / {pad(count)}
                        </span>
                        <h3 className="pc-title">{project.title}</h3>
                        <p className="pc-desc">{project.description}</p>
                    </div>
                ))}
            </div>

            <div className="pc-controls">
                <button
                    type="button"
                    className="pc-arrow"
                    aria-label="Previous project"
                    onClick={prev}
                >
                    <FiChevronLeft aria-hidden="true" />
                </button>
                <div className="pc-dots">
                    {projects.map((project, i) => (
                        <button
                            key={project.id}
                            type="button"
                            className={
                                "pc-dot" + (i === active ? " is-active" : "")
                            }
                            aria-label={`Show ${project.title}`}
                            aria-current={i === active}
                            onClick={() => goTo(i)}
                        />
                    ))}
                </div>
                <button
                    type="button"
                    className="pc-arrow"
                    aria-label="Next project"
                    onClick={next}
                >
                    <FiChevronRight aria-hidden="true" />
                </button>
            </div>
        </div>
    );
}
