import { useState } from "react";
import { createPortal } from "react-dom";
import { MyProjects } from "../../store/MyData";
import GradientLights from "../../components/GradientLights";
import ProjectCarousel from "./ProjectCarousel";
import ProjectGallery from "./ProjectGallery";
import { getGalleryLightsHost } from "./galleryLights";
import "./Projects.css";

export default function Projects() {
    const [galleryProject, setGalleryProject] = useState(null);
    const [lightsHost] = useState(getGalleryLightsHost);

    // A closing popup hands focus back to whatever had it when it opened.
    // Keyboard users need that (and the slide's focus outline) to keep their
    // place; for mouse and touch it only leaves a stray outline on the slide,
    // so the slide lets go of focus up front and there is nothing to hand back.
    const openGallery = (project, byKeyboard) => {
        if (!byKeyboard) document.activeElement?.blur();
        setGalleryProject(project);
    };

    return (
        <section className="Projects" id="Projects">
            <div className="section-header">
                <h2>Projects</h2>
                <p>Showcasing some of my accomplished projects</p>
            </div>
            <div className="wrapper">
                <ProjectCarousel
                    projects={MyProjects}
                    isGalleryOpen={galleryProject != null}
                    onOpen={openGallery}
                />
            </div>
            {/* {createPortal(<GradientLights fadeDuration={0} />, lightsHost)} */}
            {galleryProject && (
                <ProjectGallery
                    key={galleryProject.id}
                    project={galleryProject}
                    onClose={() => setGalleryProject(null)}
                />
            )}
        </section>
    );
}
