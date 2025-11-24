import { useEffect } from "react";
import "./Journey.css";

const ENTRIES = [
    {
        date: "Sep 2019",
        title: "Front-end Developer Trainee at TopUi",
        description: [
            "Researched and analyzed design patterns, best practices, and performance enhancement methods,",
            "Alongside studying SEO optimization techniques.",
            "Developed 20+ reusable components designed for widespread application across the platform.",
        ],
    },
    {
        date: "Mar 2020",
        title: "Building Multiple React Apps at Memaran Dade",
        description: [
            "Developed a modular component library utilizing React.js, enabling rapid prototyping and consistent UI elements across the application.",
            "This initiative not only reduced development time by 20%, but also facilitated efficient maintenance and updates, resulting in higher code quality and increased development velocity.",
            "Enhanced design and established intuitive websites, incorporating an optimized checkout page, while leveraging Google Analytics for meticulous analysis and subsequent enhancement of overall website visits and SEO ranking.",
            "Diagnosed and troubleshoot 4+ websites of the company's critical clients by deploying updated knowledge of the modern technologies and techniques in the industry.",
        ],
    },
    {
        date: "Dec 2021",
        title: "First Massive PWA Project at BerNet",
        description: [
            "Spearheaded the creation and development of an application utilizing cloud processing, offering diverse applications for iOS through PWA.\n",
            "Devised and executed enhancements to streamline cleanup procedures and enhance performance, resulting in a 3x acceleration of cloud computing processes through the implementation of WebRTC over VNC.\n",
            "Orchestrated the synchronization of application behavior across various operating systems on different devices, optimizing the performance of virtual applications through multifaceted actions.\n",
        ],
    },
    {
        date: "Apr 2023",
        title: "Shifting Toward Front-end Engineering at WebcentriQ",
        description: [
            "Led the refactoring of legacy code to incorporate modern ES6 features and enhance code readability. This effort improved collaboration among developers and contributed to enhanced code quality metrics.\n",
            "Actively identified opportunities for code improvement through rigorous code reviews, resulting in higher code quality and improved software maintainability. These practices led to more efficient bug resolution processes.\n",
            "Strategically improved complex code segments within a critical web application to optimize performance and align with industry best practices. These enhancements led to reduced load times and improved user satisfaction.\n",
        ],
    },
];

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
                    {ENTRIES.map((entry, index) => (
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
