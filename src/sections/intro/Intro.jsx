import { useEffect, useState } from "react";
import Navbar from "../../components/navbar/Navbar";
import "./Intro.css";

const Intro = () => {
    // Controls whether the text animation should be active (triggered by IntersectionObserver)
    const [isVisible, setIsVisible] = useState(false);

    // Toggles between main title and description mode
    // "title" | "description"
    const [mode, setMode] = useState("title");

    /**
     * Helper to re-trigger the letter animation:
     * - We briefly set isVisible to false, then true on the next frames
     * - This forces the CSS transitions on opacity/blur to run again
     */
    const restartAnimation = () => {
        setIsVisible(false);
        // Two RAFs to ensure the DOM updates with the invisible state
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setIsVisible(true);
            });
        });
    };

    /**
     * IntersectionObserver:
     * - Watches the #Intro section
     * - When at least 50% is in view the first time, it sets isVisible to true
     * - Then disconnects so it doesn't re-trigger when scrolling back
     */
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect(); // Only fire once
                }
            },
            { threshold: 0.5 }
        );

        const introSection = document.getElementById("Intro");
        if (introSection) observer.observe(introSection);

        return () => {
            if (introSection) observer.unobserve(introSection);
        };
    }, []);

    /**
     * animateText
     *
     * text       → string to animate
     * startDelay → base delay (in seconds) before any letter starts animating
     * speed      → speed multiplier (larger = faster total reveal)
     *
     * The function:
     * - splits text into words and characters
     * - wraps each character in a <span> with its own staggered transition delay
     */
    const animateText = (text, startDelay, speed) => {
        const baseStartDelay =
            typeof startDelay === "number" && !Number.isNaN(startDelay)
                ? startDelay + 0.5
                : 0.5; // seconds

        const baseSpeed =
            typeof speed === "number" && !Number.isNaN(speed) ? speed : 1;

        const words = text.split(" ");
        let globalIndex = 0; // used to keep increasing delay across the whole sentence

        return words.map((word, wordIndex) => {
            const letters = word.split("").map((char, charIndex) => {
                const index = globalIndex++;
                const delay = baseStartDelay + (index * 0.05) / baseSpeed;

                return (
                    <span
                        key={`${wordIndex}-${charIndex}`}
                        style={{
                            display: "inline-block",
                            opacity: isVisible ? 1 : 0,
                            filter: isVisible ? "blur(0)" : "blur(6px)",
                            transition: `opacity 0.25s ease ${delay}s, filter 1s ease ${delay}s`,
                        }}
                    >
                        {char}
                    </span>
                );
            });

            return (
                <div
                    key={wordIndex}
                    style={{
                        display: "flex",
                    }}
                >
                    {letters}
                    {/* Add a non-breaking space between words */}
                    {wordIndex !== words.length - 1 && "\u00A0"}
                </div>
            );
        });
    };

    /**
     * Click handlers to toggle between title and description modes
     * and restart the text animation each time.
     */
    const handleTitleClick = () => {
        setMode("description");
        restartAnimation();
    };

    const handleDescriptionClick = () => {
        setMode("title");
        restartAnimation();
    };

    return (
        <>
            <Navbar
                handleIntro={
                    mode === "title" ? handleTitleClick : handleDescriptionClick
                }
            />
            <section className="intro-section" id="Intro">
                <div className="wrapper">
                    {mode === "title" && (
                        <h1
                            className="disable-select"
                            onClick={handleTitleClick}
                        >
                            <div className="sentence-wrapper">
                                <span className="sentence">
                                    {animateText("Hey, I'm Mohammadreza")}
                                </span>
                                <span className="sentence profession">
                                    {animateText("A Front-end Developer", 1)}
                                </span>
                            </div>
                        </h1>
                    )}
                    {mode === "description" && (
                        <div
                            className="sentence-wrapper"
                            onClick={handleDescriptionClick}
                        >
                            <code className="sentence disable-select description">
                                {animateText(
                                    "As an innovative and creative developer, I am passionate about crafting exceptional digital experiences, leveraging my deep expertise in front-end development.",
                                    0,
                                    3
                                )}
                            </code>
                            <code className="sentence disable-select description">
                                {animateText(
                                    "With a robust portfolio showcasing years of accomplishments, I have consistently delivered impactful projects that combine functionality & design.",
                                    3,
                                    3
                                )}
                            </code>
                            <code className="sentence disable-select description">
                                {animateText(
                                    "I thrive on turning complex ideas into intuitive, engaging interfaces that leave a lasting impression.",
                                    6,
                                    3
                                )}
                            </code>
                        </div>
                    )}
                </div>
            </section>
        </>
    );
};

export default Intro;
