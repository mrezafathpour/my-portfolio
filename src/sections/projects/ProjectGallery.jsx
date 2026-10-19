import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { FiChevronLeft, FiChevronRight, FiGrid, FiX } from "react-icons/fi";
import useSwipe from "./useSwipe";
import { prefersReducedMotion } from "./motion";
import { moveGalleryLights } from "./galleryLights";

// Mosaic pattern: rows of wide + narrow tiles (alternating sides), with a
// hero + two stacked tiles when three are left and a full row for a single one.
const getTileLayout = (count) => {
    const tiles = [];
    let flip = false;

    while (tiles.length < count) {
        const remaining = count - tiles.length;

        if (remaining === 1) {
            tiles.push("full");
        } else if (remaining === 3) {
            tiles.push("hero", "small", "small");
        } else {
            if (flip) tiles.push("narrow", "wide");
            else tiles.push("wide", "narrow");
            flip = !flip;
        }
    }

    return tiles;
};

const shuffle = (items) => {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
};

export default function ProjectGallery({ project, onClose }) {
    // null shows the photo wall, a number shows that image full size
    const [index, setIndex] = useState(null);
    const [isClosing, setIsClosing] = useState(false);
    // Where a switch between the wall and a photo is heading (null: the
    // wall), while the view on show fades out; undefined when not switching
    const [switchingTo, setSwitchingTo] = useState(undefined);
    const isSwitching = switchingTo !== undefined;
    // Once a photo has been opened, the wall comes back without its entrance,
    // and every later view fades in instead
    const [hasViewed, setHasViewed] = useState(false);

    const dialogRef = useRef(null);
    const thumbsRef = useRef(null);

    // New random order every time the gallery opens
    const [images] = useState(() => shuffle(project.images));

    const count = images.length;
    const isViewing = index != null;
    const tiles = getTileLayout(count);

    const next = () => setIndex((current) => (current + 1) % count);
    const prev = () => setIndex((current) => (current - 1 + count) % count);

    // Closing and switching views play their exit first (see Projects.css)
    // and only then actually happen: handleAnimationEnd
    const close = () => {
        if (isClosing) return;

        if (prefersReducedMotion()) dialogRef.current?.close();
        else setIsClosing(true);
    };

    const showView = (target) => {
        setIndex(target);
        setHasViewed(true);
    };

    // target: a photo's index, or null for the wall
    const switchView = (target) => {
        if (isSwitching || isClosing) return;

        if (prefersReducedMotion()) showView(target);
        else setSwitchingTo(target);
    };

    const openImage = (i) => switchView(i);
    const backToGrid = () => switchView(null);

    const handleAnimationEnd = (e) => {
        if (e.animationName === "pgFadeOut" && e.target === e.currentTarget) {
            dialogRef.current?.close();
        } else if (
            e.animationName === "pgViewOut" &&
            isSwitching &&
            !isClosing
        ) {
            showView(switchingTo);
            setSwitchingTo(undefined);
        }
    };

    const swipeHandlers = useSwipe(prev, next);

    // Layout effect so the popup never paints a frame without its lights
    useLayoutEffect(() => {
        const dialog = dialogRef.current;
        if (dialog && !dialog.open) dialog.showModal();
        moveGalleryLights(dialog);

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = previousOverflow;
            moveGalleryLights(null);
        };
    }, []);

    // The header lines up with the left and right edges of what is shown under
    // it: the photo wall, or the opened photo (whose size depends on the screen)
    useLayoutEffect(() => {
        const dialog = dialogRef.current;
        const content = dialog?.querySelector(".pg-image, .pg-grid");
        if (!content) return;

        const update = () => {
            // offsetWidth, not the bounding box: the photo scales up while
            // it animates in, and the header should match its final size
            const width = content.offsetWidth;
            if (width) {
                dialog.style.setProperty("--pg-content-width", `${width}px`);
            }
        };

        const observer = new ResizeObserver(update);
        observer.observe(content);
        update();

        return () => observer.disconnect();
    }, [index]);

    // The clicked tile/button unmounts on view change; keep focus in the dialog
    useEffect(() => {
        dialogRef.current?.focus();
    }, [isViewing]);

    useEffect(() => {
        if (index == null) return;

        const thumb = thumbsRef.current?.children[index];
        thumb?.scrollIntoView({ block: "nearest", inline: "center" });
    }, [index]);

    const handleKeyDown = (e) => {
        if (!isViewing) return;

        if (e.key === "ArrowRight") next();
        else if (e.key === "ArrowLeft") prev();
    };

    const handleCancel = (e) => {
        e.preventDefault();

        if (isViewing) backToGrid();
        else close();
    };

    // A click on any empty part of the popup steps back: to the wall from a
    // photo, or out of the gallery from the wall. Clicks on what is shown
    // (buttons, photos, the title and the description) do not.
    const handleBackdropClick = (e) => {
        if (e.target.closest("button, img, .pg-heading, .pg-desc")) return;

        if (isViewing) backToGrid();
        else close();
    };

    const closeButton = (
        <button
            type="button"
            className="pg-btn"
            aria-label="Close gallery"
            onClick={close}
        >
            <FiX aria-hidden="true" />
        </button>
    );

    return (
        <dialog
            ref={dialogRef}
            className={
                "pg" +
                (isViewing ? " is-viewing" : "") +
                (hasViewed ? " has-viewed" : "") +
                (isClosing ? " is-closing" : "") +
                (isSwitching ? " is-switching" : "")
            }
            style={{ "--pg-count": count }}
            tabIndex={-1}
            aria-label={`${project.title} gallery`}
            onClose={onClose}
            onCancel={handleCancel}
            onKeyDown={handleKeyDown}
            onAnimationEnd={handleAnimationEnd}
            onClick={handleBackdropClick}
        >
            {isViewing ? (
                <div key="photo" className="pg-view pg-view-photo">
                    <header className="pg-header">
                        <div className="pg-heading">
                            <h3 className="pg-title">{project.title}</h3>
                        </div>
                        <div className="pg-actions">
                            <button
                                type="button"
                                className="pg-btn"
                                aria-label="Back to all photos"
                                onClick={backToGrid}
                            >
                                <FiGrid aria-hidden="true" />
                            </button>
                            {closeButton}
                        </div>
                    </header>

                    <div className="pg-stage" {...swipeHandlers}>
                        <img
                            key={images[index]}
                            src={images[index]}
                            alt={`${project.title} screenshot ${index + 1}`}
                            className="pg-image disable-select"
                            draggable={false}
                        />
                        {count > 1 && (
                            <>
                                <button
                                    type="button"
                                    className="pg-btn pg-arrow pg-arrow-prev"
                                    aria-label="Previous image"
                                    onClick={prev}
                                >
                                    <FiChevronLeft aria-hidden="true" />
                                </button>
                                <button
                                    type="button"
                                    className="pg-btn pg-arrow pg-arrow-next"
                                    aria-label="Next image"
                                    onClick={next}
                                >
                                    <FiChevronRight aria-hidden="true" />
                                </button>
                            </>
                        )}
                    </div>

                    <footer className="pg-footer">
                        <div className="pg-thumbs" ref={thumbsRef}>
                            {images.map((src, i) => (
                                <button
                                    key={src}
                                    type="button"
                                    className={
                                        "pg-thumb" +
                                        (i === index ? " is-active" : "")
                                    }
                                    aria-label={`Show image ${i + 1}`}
                                    aria-current={i === index}
                                    onClick={() => setIndex(i)}
                                >
                                    <img src={src} alt="" draggable={false} />
                                </button>
                            ))}
                        </div>
                    </footer>
                </div>
            ) : (
                <div key="wall" className="pg-view pg-view-wall">
                    <header className="pg-header">
                        <div className="pg-heading">
                            <h3 className="pg-title">{project.title}</h3>
                            <span className="pg-count">{count} photos</span>
                        </div>
                        <div className="pg-actions">{closeButton}</div>
                    </header>

                    <div className="pg-wall">
                        <div className="pg-grid">
                            {images.map((src, i) => (
                                <button
                                    key={src}
                                    type="button"
                                    className={`pg-tile pg-tile-${tiles[i]}`}
                                    style={{ "--i": i }}
                                    aria-label={`Open image ${i + 1}`}
                                    onClick={() => openImage(i)}
                                >
                                    <img
                                        src={src}
                                        alt=""
                                        className="disable-select"
                                        draggable={false}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    <footer className="pg-footer">
                        <p className="pg-desc">{project.description}</p>
                    </footer>
                </div>
            )}
        </dialog>
    );
}
