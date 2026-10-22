import { useEffect, useState } from "react";
import useSmoothScroll, { SCROLL_DURATION } from "../../hooks/useSmoothScroll";
import "./Navbar.css";

const navLinks = ["Projects", "Skills", "Journey", "Contact"];

// The navbar hides while this section is on screen
const HIDDEN_IN_SECTION = "Contact";

// The fonts the links are measured with; the navbar waits until the browser
// has finished loading them, so it does not resize right after appearing
const NAV_FONTS = ['1rem "main-normal"', 'bold 1rem "main-bold"'];

// scrollDuration: how long (ms) the scroll to a section takes when a link is
// clicked, whatever the distance; the default is shared with the Contact
// section's links, so every in-page scroll moves at the same pace
export default function Navbar({ scrollDuration = SCROLL_DURATION }) {
    const [hidden, setHidden] = useState(false);
    const [activeSection, setActiveSection] = useState("Intro");
    const [fontsReady, setFontsReady] = useState(false);
    const { scrollToSection } = useSmoothScroll(scrollDuration);

    useEffect(() => {
        if (!document.fonts?.load) {
            setFontsReady(true);
            return;
        }

        let isCancelled = false;

        // Settles once every font has either loaded or failed, so the navbar
        // still shows (in the fallback font) if a font cannot be fetched
        Promise.allSettled(
            NAV_FONTS.map((font) => document.fonts.load(font))
        ).then(() => {
            if (!isCancelled) setFontsReady(true);
        });

        return () => {
            isCancelled = true;
        };
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            const doc = document.documentElement;
            const rawScroll = window.pageYOffset ?? doc.scrollTop;

            const viewportHeight = window.innerHeight;
            const docHeight = doc.scrollHeight;
            const maxScroll = docHeight - viewportHeight;
            const current = Math.max(0, Math.min(rawScroll, maxScroll));

            const isAtBottom = maxScroll - current <= 2;

            // The Contact section has its own links to every section, so the
            // navbar steps aside once that section reaches the middle of the
            // screen (where the scroll spy counts it as the current one)
            const contact = document.getElementById(HIDDEN_IN_SECTION);
            const isInContact =
                !!contact &&
                contact.getBoundingClientRect().top <= viewportHeight / 2;

            setHidden(isAtBottom || isInContact);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        window.addEventListener("resize", handleScroll);
        handleScroll();

        return () => {
            window.removeEventListener("scroll", handleScroll);
            window.removeEventListener("resize", handleScroll);
        };
    }, []);

    // Highlight the section that sits under the middle of the screen
    useEffect(() => {
        const handleScrollSpy = () => {
            const middle = window.innerHeight / 2;

            const current = navLinks.find((id) => {
                const section = document.getElementById(id);
                if (!section) return false;

                const rect = section.getBoundingClientRect();
                return rect.top <= middle && rect.bottom > middle;
            });

            setActiveSection(current ?? null);
        };

        window.addEventListener("scroll", handleScrollSpy, { passive: true });
        window.addEventListener("resize", handleScrollSpy);
        handleScrollSpy();

        return () => {
            window.removeEventListener("scroll", handleScrollSpy);
            window.removeEventListener("resize", handleScrollSpy);
        };
    }, []);

    const handleLinkClick = (e, label) => {
        e.preventDefault();
        scrollToSection(label);
    };

    if (!fontsReady) return null;

    return (
        <nav
            className={`nav-container${hidden ? " nav-hidden" : ""}`}
            // Out of reach for the keyboard and screen readers while hidden
            inert={hidden}
        >
            <div className="nav-inner">
                {navLinks.map((label, i) => (
                    <a
                        draggable="false"
                        key={label}
                        href={`#${label}`}
                        className={`nav-link disable-select ${
                            hidden ? "" : "fade-in-link"
                        } ${activeSection === label ? "is-active" : ""}`}
                        data-label={label}
                        aria-current={
                            activeSection === label ? "location" : undefined
                        }
                        style={{ animationDelay: `${i * 0.12}s` }}
                        onClick={(e) => handleLinkClick(e, label)}
                    >
                        {label}
                    </a>
                ))}
            </div>
        </nav>
    );
}
