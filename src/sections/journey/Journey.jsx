import { useEffect } from "react";
import { MyJourney } from "../../store/MyData";
import "./Journey.css";

export default function Journey() {
    useEffect(() => {
        const endBlock = document.getElementById("timeline-end");

        function onScroll() {
            const rect = endBlock.getBoundingClientRect();
            const windowHeight = window.innerHeight;

            if (rect.top < windowHeight - 1) {
                endBlock.classList.add("visible");
            }
        }

        window.addEventListener("scroll", onScroll);

        // run once in case it's already visible
        onScroll();

        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <section id="Journey" className="journey-section">
            <div className="wrapper">
                <div className="section-header">
                    <h2>Journey</h2>
                    <p>
                        A timeline of what I’ve been building, learning, and
                        focusing on
                    </p>
                </div>

                <div className="journey-timeline">
                    {MyJourney.map((entry, index) => (
                        <div className="timeline-item" key={index}>
                            <div className="timeline-content">
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
