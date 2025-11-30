import { useState, useEffect } from "react";
import { MyProjects } from "../../store/MyData";
import ProjectCard from "./ProjectCard";
import "./Projects.css";

const getIsMobileDevice = () => {
    if (typeof navigator === "undefined") return false;
    const ua = navigator.userAgent || navigator.vendor || "";
    const isMobile = /Mobi|Android|iPhone|iPod/i.test(ua);
    const isTablet = /iPad|Tablet/i.test(ua);
    return isMobile && !isTablet;
};

export default function Projects() {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        setIsMobile(getIsMobileDevice());
    }, []);

    useEffect(() => {
        MyProjects.forEach((p) => {
            p.images.forEach((src) => {
                const img = new Image();
                img.src = src;
            });
        });
    }, []);

    return (
        <section className="Projects" id="Projects">
            <div className="wrapper">
                <div className="section-header">
                    <h2>Projects</h2>
                    <p>Showcasing some of my accomplished projects</p>
                </div>
                <div className="projects-grid">
                    {MyProjects.map((project) => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            isMobile={isMobile}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
