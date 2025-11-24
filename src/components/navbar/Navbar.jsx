import { useEffect, useState, useRef } from "react";
import "./Navbar.css";

export default function Navbar({ handleIntro }) {
    const [hidden, setHidden] = useState(false);
    const [lastScroll, setLastScroll] = useState(0);
    const underlineRef = useRef(null);
    const linksRef = useRef([]);

    // Hide on scroll
    useEffect(() => {
        function handleScroll() {
            const current = window.scrollY;
            if (current > lastScroll && current > 60) {
                setHidden(true);
            } else {
                setHidden(false);
            }
            setLastScroll(current);
        }
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [lastScroll]);

    // Moving neon underline
    useEffect(() => {
        const underline = underlineRef.current;
        const links = linksRef.current;

        function moveUnderline(link) {
            const rect = link.getBoundingClientRect();
            const left = link.offsetLeft;
            underline.style.width = `${rect.width}px`;
            underline.style.left = `${left}px`;
            underline.style.opacity = 1;
        }

        links.forEach((link) => {
            link.addEventListener("mouseenter", () => moveUnderline(link));
        });

        const nav = document.querySelector(".nav-inner");
        nav.addEventListener("mouseleave", () => {
            underline.style.opacity = 0;
        });

        window.addEventListener("resize", () => {
            underline.style.opacity = 0;
        });
    }, []);

    // Smooth scrolling
    useEffect(() => {
        const links = linksRef.current;

        links.forEach((link) => {
            link.addEventListener("click", (e) => {
                e.preventDefault();
                const target = document.querySelector(
                    link.getAttribute("href")
                );
                if (!target) return;

                window.scrollTo({
                    top: target.offsetTop - 80,
                    behavior: "smooth",
                });
            });
        });
    }, []);

    const navLinks = ["Intro", "Skills", "Projects", "Journey"];

    return (
        <nav className={`nav-container ${hidden ? "nav-hidden" : ""}`}>
            <div className="nav-inner">
                <span className="hover-underline" ref={underlineRef}></span>
                {navLinks.map((label, i) => (
                    <a
                        key={i}
                        href={`#${label}`}
                        className={`nav-link ${hidden ? "" : "fade-in-link"}`}
                        style={{ animationDelay: `${i * 0.12}s` }}
                        ref={(el) => (linksRef.current[i] = el)}
                        onClick={() => label === "Intro" && handleIntro()}
                    >
                        {label}
                    </a>
                ))}
            </div>
        </nav>
    );
}
