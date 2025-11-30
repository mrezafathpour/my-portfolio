import { useEffect, useState } from "react";
import Navbar from "../../components/navbar/Navbar";
import "./Intro.css";

const Intro = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [mode, setMode] = useState("title");

    const restartAnimation = () => {
        setIsVisible(false);
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setIsVisible(true);
            });
        });
    };

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
                    {wordIndex !== words.length - 1 && "\u00A0"}
                </div>
            );
        });
    };
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
