import { useState, useEffect, useRef, useCallback } from "react";

export default function ProjectCard({ project, isMobile }) {
    const [index, setIndex] = useState(0);
    const [phase, setPhase] = useState("idle");
    const [isPaused, setIsPaused] = useState(false);

    const nextIndexRef = useRef(null);
    const touchStartRef = useRef(null);
    const touchEndRef = useRef(null);
    const delayRef = useRef(null);

    useEffect(() => {
        if (delayRef.current == null) {
            const randomMs = 3000 + Math.random() * 3000;
            delayRef.current = randomMs;
        }
    }, []);

    const startChangeImage = useCallback(
        (newIndex) => {
            if (project.images.length < 2) return;
            if (phase !== "idle") return;
            if (newIndex === index) return;

            nextIndexRef.current = newIndex;
            setPhase("fading-out");
        },
        [project.images.length, phase, index]
    );

    const nextImage = () => {
        const newIndex = (index + 1) % project.images.length;
        startChangeImage(newIndex);
    };

    const prevImage = () => {
        const newIndex = index === 0 ? project.images.length - 1 : index - 1;
        startChangeImage(newIndex);
    };

    const handleDotClick = (dotIndex) => {
        startChangeImage(dotIndex);
    };

    useEffect(() => {
        if (isMobile) return;
        if (isPaused) return;
        if (phase !== "idle") return;
        if (project.images.length < 2) return;

        const delay = delayRef.current || 3000;
        const timeout = setTimeout(() => {
            const newIndex = (index + 1) % project.images.length;
            startChangeImage(newIndex);
        }, delay);

        return () => clearTimeout(timeout);
    }, [
        index,
        isMobile,
        isPaused,
        phase,
        project.images.length,
        startChangeImage,
    ]);

    const handleAnimationEnd = () => {
        if (phase === "fading-out") {
            if (nextIndexRef.current != null) {
                setIndex(nextIndexRef.current);
            }
            setPhase("fading-in");
        } else if (phase === "fading-in") {
            setPhase("idle");
        }
    };

    const onTouchStart = (e) => {
        touchStartRef.current = e.touches[0].clientX;
    };
    const onTouchMove = (e) => {
        touchEndRef.current = e.touches[0].clientX;
    };
    const onTouchEnd = () => {
        if (touchStartRef.current == null || touchEndRef.current == null)
            return;

        const diff = touchStartRef.current - touchEndRef.current;

        if (diff > 60) nextImage();
        else if (diff < -60) prevImage();

        touchStartRef.current = null;
        touchEndRef.current = null;
    };

    let imgClass = "project-image";
    if (phase === "fading-out") imgClass += " fade-out";
    else if (phase === "fading-in") imgClass += " fade-in";
    else imgClass += " shown";

    return (
        <div
            className="project-card"
            onMouseEnter={() => !isMobile && setIsPaused(true)}
            onMouseLeave={() => !isMobile && setIsPaused(false)}
        >
            <div
                className="project-image-wrapper"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                <img
                    key={project.images[index]}
                    src={project.images[index]}
                    alt={project.title}
                    className={"disable-select " + imgClass}
                    draggable={false}
                    onAnimationEnd={handleAnimationEnd}
                />
            </div>

            <div className="description">
                <h3 className="project-title">{project.title}</h3>
                <p className="project-desc">{project.description}</p>
            </div>
            <div className="dots">
                {project.images.map((_, i) => (
                    <span
                        key={i}
                        className={`dot ${i === index ? "active" : ""}`}
                        onClick={() => handleDotClick(i)}
                    />
                ))}
            </div>
        </div>
    );
}
