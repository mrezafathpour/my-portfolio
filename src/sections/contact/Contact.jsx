import { useEffect, useRef, useState } from "react";
import useSmoothScroll from "../../hooks/useSmoothScroll";
import "./Contact.css";
import {
    FiArrowUp,
    FiArrowUpRight,
    FiCheck,
    FiCopy,
    FiGlobe,
    FiMail,
} from "react-icons/fi";
import { FaLinkedin, FaGithub } from "react-icons/fa";
import { MyIntro } from "../../store/MyData";
import packageInfo from "../../../package.json";

const EMAIL = "mrezafathpour@gmail.com";

const contactLinks = [
    {
        href: `mailto:${EMAIL}`,
        icon: FiMail,
        label: "Email",
    },
    {
        href: "https://github.com/mrezafathpour",
        icon: FaGithub,
        label: "GitHub",
    },
    {
        href: "https://www.linkedin.com/in/mohammadreza-fathpour-3885761b3/",
        icon: FaLinkedin,
        label: "LinkedIn",
    },
    {
        href: "https://mrezafathpour.github.io/my-portfolio",
        icon: FiGlobe,
        label: "Website",
    },
];

// The same sections the navbar links to
const sectionLinks = ["Intro", "Projects", "Skills", "Journey"];

// How long (ms) the copy button says "Copied" before turning back
const COPIED_DURATION = 2000;

const isMailLink = (href) => href.startsWith("mailto:");

export default function Contact() {
    // The same scroll, at the same pace, as the navbar's links
    const { scrollToY, scrollToSection } = useSmoothScroll();
    const sectionRef = useRef(null);
    const copiedTimerRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);
    const [copied, setCopied] = useState(false);

    // The section's parts rise into place the first time it scrolls into view
    useEffect(() => {
        const section = sectionRef.current;
        if (!section || !("IntersectionObserver" in window)) {
            setIsVisible(true);
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.15 }
        );

        observer.observe(section);
        return () => observer.disconnect();
    }, []);

    useEffect(() => () => clearTimeout(copiedTimerRef.current), []);

    // Copies the address; where the clipboard is not available (an insecure
    // page, an old browser) the mail app opens instead
    const copyEmail = async () => {
        try {
            await navigator.clipboard.writeText(EMAIL);
            setCopied(true);
            clearTimeout(copiedTimerRef.current);
            copiedTimerRef.current = setTimeout(
                () => setCopied(false),
                COPIED_DURATION
            );
        } catch {
            window.location.href = `mailto:${EMAIL}`;
        }
    };

    // Without the section the link falls back to a plain jump to its anchor
    const handleSectionClick = (e, id) => {
        if (scrollToSection(id)) e.preventDefault();
    };

    const scrollToTop = () => scrollToY(0);

    return (
        <section
            ref={sectionRef}
            className={`contact-section${isVisible ? " is-visible" : ""}`}
            id="Contact"
        >
            <div className="section-header">
                <h2>Contact</h2>
                <p>Let's turn your next idea into something real</p>
            </div>
            <div className="wrapper contact-inner">
                {/* ---------- Call to action ---------- */}
                <div className="contact-cta contact-reveal">
                    <div className="contact-cta-text">
                        <p className="contact-eyebrow">Get in touch</p>
                        <h2 className="contact-title">
                            Have an idea? Let's build it{" "}
                            <span className="contact-shine">together</span>.
                        </h2>
                        <p className="contact-lead">
                            Whether it's a new project, a collaboration or
                            just a hello, my inbox is always open.
                        </p>
                    </div>

                    <div className="contact-cta-actions">
                        <a
                            href={`mailto:${EMAIL}`}
                            className="contact-button contact-button-primary"
                        >
                            Say hello
                            <FiArrowUpRight aria-hidden="true" />
                        </a>
                        <button
                            type="button"
                            className={`contact-button contact-button-ghost${
                                copied ? " is-copied" : ""
                            }`}
                            onClick={copyEmail}
                            aria-label={`Copy email address ${EMAIL}`}
                        >
                            <span className="contact-email">{EMAIL}</span>
                            {copied ? (
                                <FiCheck aria-hidden="true" />
                            ) : (
                                <FiCopy aria-hidden="true" />
                            )}
                        </button>
                        {/* Announces the copy to screen readers */}
                        <span className="contact-sr-only" aria-live="polite">
                            {copied ? "Email address copied" : ""}
                        </span>
                    </div>
                </div>

                {/* ---------- Brand, sections and links ---------- */}
                <div className="contact-grid">
                    <div className="contact-brand contact-reveal">
                        <span className="contact-logo disable-select">
                            {"</ MR >"}
                        </span>
                        <p className="contact-brand-text">
                            {MyIntro.profession} crafting fast, accessible
                            and delightful experiences for the web.
                        </p>
                    </div>

                    <nav
                        className="contact-column contact-sections contact-reveal"
                        aria-label="Sections"
                    >
                        <h3 className="contact-heading">Navigate</h3>
                        <ul className="contact-list">
                            {sectionLinks.map((id) => (
                                <li key={id}>
                                    <a
                                        href={`#${id}`}
                                        className="contact-link"
                                        onClick={(e) =>
                                            handleSectionClick(e, id)
                                        }
                                    >
                                        {id}
                                    </a>
                                </li>
                            ))}
                            <li>
                                <button
                                    type="button"
                                    className="contact-link contact-top"
                                    onClick={scrollToTop}
                                >
                                    Back to top
                                </button>
                            </li>
                        </ul>
                    </nav>

                    <div className="contact-column contact-reveal">
                        <h3 className="contact-heading">Connect</h3>
                        <ul className="contact-list">
                            {contactLinks.map(({ href, icon: Icon, label }) => (
                                <li key={label}>
                                    <a
                                        href={href}
                                        target={
                                            isMailLink(href)
                                                ? undefined
                                                : "_blank"
                                        }
                                        rel={
                                            isMailLink(href)
                                                ? undefined
                                                : "noreferrer"
                                        }
                                        className="contact-link contact-social"
                                    >
                                        <span className="contact-social-icon">
                                            <Icon aria-hidden="true" />
                                        </span>
                                        {label}
                                        <FiArrowUpRight
                                            className="contact-social-arrow"
                                            aria-hidden="true"
                                        />
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* ---------- Copyright ---------- */}
                <div className="contact-bottom contact-reveal">
                    <p className="contact-copyright">
                        © {new Date().getFullYear()}{" "}
                        <strong>Mohammadreza Fathpour</strong>. Designed &
                        developed with care.
                    </p>
                    <span className="contact-version">
                        v{packageInfo.version}
                    </span>
                </div>
            </div>

            {/* A giant faded signature closing the page */}
            <div className="contact-signature disable-select" aria-hidden="true">
                Mohammadreza
            </div>
        </section>
    );
}
