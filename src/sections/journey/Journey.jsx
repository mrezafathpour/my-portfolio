import { useEffect } from "react";
import { MyJourney } from "../../store/MyData";
import { GlyphPlasmaBackground } from "../../components/GlyphPlasmaBackground";
import "./Journey.css";

export default function Journey() {
    // Reveals the end of the timeline once it scrolls into view, then stops
    // watching instead of measuring it on every scroll
    useEffect(() => {
        const endBlock = document.getElementById("timeline-end");

        const observer = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting) return;

            endBlock.classList.add("visible");
            observer.disconnect();
        });

        observer.observe(endBlock);
        return () => observer.disconnect();
    }, []);

    return (
        <section id="Journey" className="journey-section">
            <div className="section-header">
                <h2>Journey</h2>
                <p>
                    A timeline of what I’ve been building, learning, and
                    focusing on
                </p>
            </div>
            <div className="wrapper">
                <div className="journey-timeline">
                    {MyJourney.map((entry, index) => (
                        <div className="timeline-item" key={index}>
                            <div
                                className="timeline-content"
                                style={{
                                    overflow: "hidden",
                                    position: "relative",
                                    isolation: "isolate",
                                }}
                            >
                                <div
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        zIndex: -1,
                                    }}
                                >
                                    <GlyphPlasmaBackground seed={index} />
                                </div>
                                <p className="timeline-date">{entry.date}</p>
                                <h3 className="timeline-title">
                                    {entry.title}
                                </h3>
                                <ul>
                                    {entry.description.map((line, i) => (
                                        <li key={i}>
                                            <p className="timeline-description">
                                                {line}
                                            </p>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="timeline-end" id="timeline-end">
                    <div className="end-line"></div>
                    <div className="end-text">
                        <span>The journey continues...</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
