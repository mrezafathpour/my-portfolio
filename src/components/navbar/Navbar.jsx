import { useEffect, useState } from "react";
import { useNavigation } from "../../features/navigation/NavigationContext";
import "./Navbar.css";

const navLinks = ["Intro", "Projects", "Skills", "Journey"];

// The fonts the links are measured with; the navbar waits until the browser
// has finished loading them, so it does not resize right after appearing
const NAV_FONTS = ['1rem "main-normal"', 'bold 1rem "main-bold"'];

export default function Navbar() {
    const [hidden, setHidden] = useState(false);
    const [activeSection, setActiveSection] = useState("Intro");
    const [fontsReady, setFontsReady] = useState(false);
    const { handleIntro } = useNavigation();

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

            setHidden(isAtBottom);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
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

        const target = document.querySelector(`#${label}`);
        if (target) {
            window.scrollTo({
                top: target.getBoundingClientRect().top + window.scrollY,
                behavior: "smooth",
            });
        }

        if (label === "Intro" && handleIntro) {
            handleIntro();
        }
    };

    if (!fontsReady) return null;

    return (
        <nav className={`nav-container${hidden ? " nav-hidden" : ""}`}>
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
