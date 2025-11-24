import { useState, useEffect, useRef, useCallback } from "react";
import "./Projects.css";
const projects = [
    {
        id: 1,
        title: "Azar Park",
        description:
            "Azar Park is an intelligent urban parking management system that started it's first phase in Kashan city and now it's being adopted in Tabriz as well.",
        images: [
            process.env.PUBLIC_URL + "/images/projects/azar1.png",
            process.env.PUBLIC_URL + "/images/projects/azar2.png",
            process.env.PUBLIC_URL + "/images/projects/azar3.png",
        ],
    },
    {
        id: 2,
        title: "Kachar",
        description:
            "Kachar is an online shopping and service system in cars field. It is implemented as a multi vendor application.",
        images: [
            process.env.PUBLIC_URL + "/images/projects/car1.png",
            process.env.PUBLIC_URL + "/images/projects/car2.png",
            process.env.PUBLIC_URL + "/images/projects/car3.png",
        ],
    },
    {
        id: 3,
        title: "Birka",
        description:
            "Birka Market is an online shopping system, a mobile based application and website for consumer goods.",
        images: [
            process.env.PUBLIC_URL + "/images/projects/market1.png",
            process.env.PUBLIC_URL + "/images/projects/market2.png",
            process.env.PUBLIC_URL + "/images/projects/market3.png",
            process.env.PUBLIC_URL + "/images/projects/market4.png",
        ],
    },
    {
        id: 4,
        title: "Bilit",
        description:
            "Bilit (also known as Bilit.com) is the most experienced and reputable airline ticket reservation system and online purchase of charter, trains and buses.",
        images: [
            process.env.PUBLIC_URL + "/images/projects/bilit1.png",
            process.env.PUBLIC_URL + "/images/projects/bilit2.png",
            process.env.PUBLIC_URL + "/images/projects/bilit3.png",
            process.env.PUBLIC_URL + "/images/projects/bilit4.png",
        ],
    },
    {
        id: 5,
        title: "Hichhop",
        description:
            "Hichhop moved to other provinces of the country as well in order to expand the idea in other cities and hold free tours",
        images: [
            process.env.PUBLIC_URL + "/images/projects/safar1.png",
            process.env.PUBLIC_URL + "/images/projects/safar2.png",
            process.env.PUBLIC_URL + "/images/projects/safar3.png",
            process.env.PUBLIC_URL + "/images/projects/safar4.png",
        ],
    },
    {
        id: 6,
        title: "Alast",
        description:
            "Alast is a consultancy platform in accounting and law that works as a mobile application and web site.",
        images: [
            process.env.PUBLIC_URL + "/images/projects/consult1.png",
            process.env.PUBLIC_URL + "/images/projects/consult2.png",
            process.env.PUBLIC_URL + "/images/projects/consult3.png",
            process.env.PUBLIC_URL + "/images/projects/consult4.png",
        ],
    },
];

const getIsMobileDevice = () => {
    if (typeof navigator === "undefined") return false;
    const ua = navigator.userAgent || navigator.vendor || "";
    const isMobile = /Mobi|Android|iPhone|iPod/i.test(ua);
    const isTablet = /iPad|Tablet/i.test(ua);
    return isMobile && !isTablet;
};

export default function Projects() {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        setIsMobile(getIsMobileDevice());
    }, []);

    return (
        <section className="Projects" id="Projects">
            <div className="wrapper">
                <div className="section-header">
                    <h2>Projects</h2>
                    <p>Showcasing some of my accomplished projects</p>
                </div>
                <div className="projects-grid">
                    {projects.map((project) => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            isMobile={isMobile}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}

function ProjectCard({ project, isMobile }) {
    const [index, setIndex] = useState(0);
    const [phase, setPhase] = useState("idle"); // "idle" | "fading-out" | "fading-in"
    const [isPaused, setIsPaused] = useState(false);

    const nextIndexRef = useRef(null);
    const touchStartRef = useRef(null);
    const touchEndRef = useRef(null);
    const delayRef = useRef(null);

    // Random delay between 3–6 seconds per project (once)
    useEffect(() => {
        if (delayRef.current == null) {
            const randomMs = 3000 + Math.random() * 3000; // 3000–6000
            delayRef.current = randomMs;
        }
    }, []);

    // Start animated change: fade-out → change src → fade-in
    const startChangeImage = useCallback(
        (newIndex) => {
            if (project.images.length < 2) return;
            if (phase !== "idle") return; // avoid overlapping animations
            if (newIndex === index) return;

            nextIndexRef.current = newIndex;
            setPhase("fading-out");
        },
        [project.images.length, phase, index] // dependencies used *inside* the function
    );

    const nextImage = () => {
        const newIndex = (index + 1) % project.images.length;
        startChangeImage(newIndex);
    };

    const prevImage = () => {
        const newIndex = index === 0 ? project.images.length - 1 : index - 1;
        startChangeImage(newIndex);
    };

    // Dot click handler
    const handleDotClick = (dotIndex) => {
        startChangeImage(dotIndex);
    };

    // Auto-change (desktop / tablet only, not mobile)
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

    // Handle animation phases
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

    // Touch swipe support
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

        if (diff > 60) nextImage(); // swipe left → next
        else if (diff < -60) prevImage(); // swipe right → prev

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
            // pause auto-change on hover (desktop / tablet)
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
