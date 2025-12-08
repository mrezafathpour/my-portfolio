import { useEffect, useState, useRef, useCallback } from "react";
import "./Navbar.css";

const navLinks = ["Intro", "Projects", "Skills", "Journey"];

export default function Navbar({ handleIntro }) {
    const [hidden, setHidden] = useState(false);
    const [isCompactLayout, setIsCompactLayout] = useState(false);
    const [activeSection, setActiveSection] = useState("Intro");

    const underlineRef = useRef(null);
    const linksRef = useRef([]);
    const lastScrollRef = useRef(0);

    useEffect(() => {
        const checkLayout = () => {
            setIsCompactLayout(window.innerWidth <= 1024);
        };

        checkLayout();
        window.addEventListener("resize", checkLayout);
        return () => window.removeEventListener("resize", checkLayout);
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            const current = window.scrollY;
            const last = lastScrollRef.current;

            if (current > last && current > 60) {
                setHidden(true);
            } else {
                setHidden(false);
            }

            lastScrollRef.current = current;
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const moveUnderline = useCallback((linkEl) => {
        const underline = underlineRef.current;
        if (!underline || !linkEl) return;

        const container = linkEl.offsetParent;
        if (!container) return;
        const width = linkEl.offsetWidth;
        const offsetX = linkEl.offsetLeft;

        underline.style.width = `${width}px`;
        underline.style.transform = `translateX(${offsetX}px)`;
        underline.style.opacity = 1;
    }, []);

    const handleNavMouseLeave = useCallback(() => {
        if (isCompactLayout) return;
        const underline = underlineRef.current;
        if (underline) underline.style.opacity = 0;
    }, [isCompactLayout]);

    useEffect(() => {
        if (!isCompactLayout) return;

        const handleScrollSpy = () => {
            const viewportHeight = window.innerHeight;
            let bestId = activeSection;
            let bestRatio = 0;

            navLinks.forEach((id) => {
                const section = document.getElementById(id);
                if (!section) return;

                const rect = section.getBoundingClientRect();

                const visibleHeight =
                    Math.min(rect.bottom, viewportHeight) -
                    Math.max(rect.top, 0);

                const ratio =
                    visibleHeight > 0 ? visibleHeight / viewportHeight : 0;

                if (ratio > bestRatio) {
                    bestRatio = ratio;
                    bestId = id;
                }
            });

            if (bestRatio >= 0.7 && bestId !== activeSection) {
                setActiveSection(bestId);
            }
        };

        window.addEventListener("scroll", handleScrollSpy);
        handleScrollSpy();

        return () => window.removeEventListener("scroll", handleScrollSpy);
    }, [isCompactLayout, activeSection]);

    useEffect(() => {
        if (!isCompactLayout) return;

        const index = navLinks.indexOf(activeSection);
        if (index === -1) return;

        const linkEl = linksRef.current[index];
        if (linkEl) {
            moveUnderline(linkEl);
        }
    }, [activeSection, isCompactLayout, moveUnderline]);

    const handleLinkClick = (e, label, index) => {
        e.preventDefault();

        const target = document.querySelector(`#${label}`);
        if (target) {
            window.scrollTo({
                top: target.offsetTop - 80,
                behavior: "smooth",
            });
        }

        if (label === "Intro") {
            handleIntro();
        }

        if (isCompactLayout) {
            setActiveSection(label);
            const linkEl = linksRef.current[index];
            if (linkEl) moveUnderline(linkEl);
        }
    };

    return (
        <nav className={`nav-container${hidden ?  " nav-hidden" : ""}`}>
            <div className="nav-inner" onMouseLeave={handleNavMouseLeave}>
                <span className="hover-underline" ref={underlineRef}></span>
                {navLinks.map((label, i) => (
                    <a
                        draggable="false"
                        key={label}
                        href={`#${label}`}
                        className={`nav-link disable-select ${
                            hidden ? "" : "fade-in-link"
                        } ${
                            isCompactLayout && activeSection === label
                                ? "is-active"
                                : ""
                        }`}
                        style={{ animationDelay: `${i * 0.12}s` }}
                        ref={(el) => (linksRef.current[i] = el)}
                        onMouseEnter={
                            !isCompactLayout
                                ? (e) => moveUnderline(e.currentTarget)
                                : undefined
                        }
                        onClick={(e) => handleLinkClick(e, label, i)}
                    >
                        {label}
                    </a>
                ))}
            </div>
        </nav>
    );
}
