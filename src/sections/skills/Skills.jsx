import { useEffect, useRef, useState } from "react";
import "./Skills.css";

const SKILLS = [
    { name: "HTML", level: 90 },
    { name: "CSS", level: 95 },
    { name: "JavaScript", level: 80 },
    { name: "TypeScript", level: 60 },
    { name: "React.", level: 85 },
    { name: "Next.js", level: 75 },
    { name: "Git", level: 65 },
    { name: "React Redux", level: 70 },
    { name: "PWA", level: 90 },
    { name: "React Query", level: 50 },
    { name: "OOP", level: 20 },
    { name: "Material UI", level: 35 },
    { name: "Jest.js", level: 65 },
    { name: "Webpack", level: 55 },
    { name: "SASS", level: 80 },
    { name: "Python", level: 75 },
];

const randomCubicBezier = () => {
    const x1 = Math.random();
    const x2 = Math.random();
    const y1 = Math.random() * 2 - 0.5;
    const y2 = Math.random() * 2 - 0.5;

    const fx = (v) => Number(v.toFixed(2));

    return `cubic-bezier(${fx(x1)},${fx(y1)},${fx(x2)},${fx(y2)})`;
};

const Skills = () => {
    const skillsRef = useRef(null);
    const [animatedSkills, setAnimatedSkills] = useState({});
    const [displayLevels, setDisplayLevels] = useState({});

    const [animConfig] = useState(() => {
        const config = {};
        SKILLS.forEach((skill) => {
            const duration = Math.random() * 2 + 1;
            const easing = randomCubicBezier();
            config[skill.name] = { duration, easing };
        });
        return config;
    });

    useEffect(() => {
        const observerTarget = skillsRef.current;
        if (!observerTarget) return;

        let isCancelled = false;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;

                    const skillName = entry.target.dataset.skillName;
                    if (!skillName) return;

                    setAnimatedSkills((prev) => ({
                        ...prev,
                        [skillName]: true,
                    }));

                    const config = animConfig[skillName];
                    const durationMs = (config?.duration ?? 1.5) * 1000;


                    const skillData = SKILLS.find((s) => s.name === skillName);
                    const target = skillData?.level ?? 0;

                    const start = performance.now();

                    const step = (now) => {
                        if (isCancelled) return;

                        const elapsed = now - start;
                        const progress = Math.min(elapsed / durationMs, 1);
                        const value = Math.round(target * progress);

                        setDisplayLevels((prev) => ({
                            ...prev,
                            [skillName]: value,
                        }));

                        if (progress < 1) {
                            requestAnimationFrame(step);
                        }
                    };

                    requestAnimationFrame(step);

                    observer.unobserve(entry.target);
                });
            },
            {
                threshold: 0.25,
            }
        );

        const skillElements =
            observerTarget.querySelectorAll("[data-skill-name]");
        skillElements.forEach((el) => observer.observe(el));

        return () => {
            isCancelled = true;
            observer.disconnect();
        };
    }, [animConfig]);

    return (
        <section className="skills-section" ref={skillsRef} id="Skills">
            <div className="wrapper">
                <div className="section-header">
                    <h2>My Skills</h2>
                    <p>Latest update of my programming skills</p>
                </div>

                <div className="skills-container">
                    {SKILLS.map((skill) => {
                        const cfg = animConfig[skill.name] || {};
                        const currentValue = displayLevels[skill.name] ?? 0;

                        return (
                            <div
                                key={skill.name}
                                className="skill-item"
                                data-skill-name={skill.name}
                            >
                                <div className="skill-header">
                                    <span className="skill-name">
                                        {skill.name}
                                    </span>
                                    <span className="skill-level">
                                        {currentValue}%
                                    </span>
                                </div>

                                <div className="skill-bar">
                                    <div
                                        className="skill-fill"
                                        style={{
                                            width: animatedSkills[skill.name]
                                                ? `${skill.level}%`
                                                : "0%",
                                            transitionProperty: "width",
                                            transitionDuration: `${
                                                cfg.duration || 1.5
                                            }s`,
                                            transitionTimingFunction:
                                                cfg.easing || "ease-out",
                                        }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default Skills;
