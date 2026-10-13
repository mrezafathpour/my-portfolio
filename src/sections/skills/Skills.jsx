import { useCallback, useEffect, useRef, useState } from "react";
import {
    SiCss,
    SiGit,
    SiHtml5,
    SiJavascript,
    SiJest,
    SiMui,
    SiNextdotjs,
    SiPwa,
    SiPython,
    SiReact,
    SiReactquery,
    SiRedux,
    SiSass,
    SiTypescript,
    SiWebpack,
} from "react-icons/si";
import { TbHierarchy2 } from "react-icons/tb";
import { SKILLS } from "../../store/MyData";
import "./Skills.css";

// Logo and brand colour per skill name in MyData. Entries without a colour
// (black logos, or no brand at all) take the text colour so they stay visible
// in both light and dark mode, and the deep purples get a lighter shade for
// dark mode (darkColor). An unlisted skill gets the generic icon.
const SKILL_LOGOS = {
    HTML: { Icon: SiHtml5, color: "#e34f26" },
    CSS: { Icon: SiCss, color: "#663399", darkColor: "#a57fdb" },
    JavaScript: { Icon: SiJavascript, color: "#f7df1e" },
    TypeScript: { Icon: SiTypescript, color: "#3178c6" },
    "React.": { Icon: SiReact, color: "#61dafb" },
    "Next.js": { Icon: SiNextdotjs },
    Git: { Icon: SiGit, color: "#f05032" },
    "React Redux": { Icon: SiRedux, color: "#764abc", darkColor: "#a585e0" },
    PWA: { Icon: SiPwa, color: "#5a0fc8", darkColor: "#a06bf5" },
    "React Query": { Icon: SiReactquery, color: "#ff4154" },
    OOP: { Icon: TbHierarchy2 },
    "Material UI": { Icon: SiMui, color: "#007fff" },
    "Jest.js": { Icon: SiJest, color: "#c21325" },
    Webpack: { Icon: SiWebpack, color: "#8dd6f9" },
    SASS: { Icon: SiSass, color: "#cc6699" },
    Python: { Icon: SiPython, color: "#3776ab" },
};
const DEFAULT_LOGO = { Icon: TbHierarchy2 };

const randomCubicBezier = () => {
    const x1 = Math.random();
    const x2 = Math.random();
    const y1 = Math.random() * 2 - 0.5;
    const y2 = Math.random() * 2 - 0.5;

    const fx = (v) => Number(v.toFixed(2));

    return `cubic-bezier(${fx(x1)},${fx(y1)},${fx(x2)},${fx(y2)})`;
};

const randomAnimConfig = () => ({
    duration: Math.random() * 2 + 1,
    easing: randomCubicBezier(),
});

const Skills = () => {
    const skillsRef = useRef(null);
    const [animatedSkills, setAnimatedSkills] = useState({});
    const [displayLevels, setDisplayLevels] = useState({});
    const [replayCounts, setReplayCounts] = useState({});

    // Latest run per skill; an older or cancelled run stops counting
    const runTokensRef = useRef({});

    const [animConfig, setAnimConfig] = useState(() => {
        const config = {};
        SKILLS.forEach((skill) => {
            config[skill.name] = randomAnimConfig();
        });
        return config;
    });

    // Mirror of animConfig for the counter, so a re-rolled config does not
    // recreate animateSkill (and with it the scroll observer)
    const animConfigRef = useRef(animConfig);

    const animateSkill = useCallback(
        (skillName) => {
            const token = (runTokensRef.current[skillName] ?? 0) + 1;
            runTokensRef.current[skillName] = token;

            setAnimatedSkills((prev) => ({
                ...prev,
                [skillName]: true,
            }));

            const config = animConfigRef.current[skillName];
            const durationMs = (config?.duration ?? 1.5) * 1000;

            const skillData = SKILLS.find((s) => s.name === skillName);
            const target = skillData?.level ?? 0;

            const start = performance.now();

            const step = (now) => {
                if (runTokensRef.current[skillName] !== token) return;

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
        },
        []
    );

    // Empties the bar instantly (a fresh fill element, so it does not animate
    // backwards) and then fills it up again with a new random speed and easing
    const replaySkill = (skillName) => {
        const token = (runTokensRef.current[skillName] ?? 0) + 1;
        runTokensRef.current[skillName] = token;

        const config = randomAnimConfig();
        animConfigRef.current = {
            ...animConfigRef.current,
            [skillName]: config,
        };
        setAnimConfig((prev) => ({ ...prev, [skillName]: config }));

        setAnimatedSkills((prev) => ({ ...prev, [skillName]: false }));
        setDisplayLevels((prev) => ({ ...prev, [skillName]: 0 }));
        setReplayCounts((prev) => ({
            ...prev,
            [skillName]: (prev[skillName] ?? 0) + 1,
        }));

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                if (runTokensRef.current[skillName] !== token) return;
                animateSkill(skillName);
            });
        });
    };

    const handleSkillKeyDown = (e, skillName) => {
        if (e.key !== "Enter" && e.key !== " ") return;

        e.preventDefault();
        replaySkill(skillName);
    };

    useEffect(() => {
        const observerTarget = skillsRef.current;
        if (!observerTarget) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;

                    const skillName = entry.target.dataset.skillName;
                    if (!skillName) return;

                    animateSkill(skillName);

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
            runTokensRef.current = {};
            observer.disconnect();
        };
    }, [animateSkill]);

    return (
        <section className="skills-section" ref={skillsRef} id="Skills">
            <div className="section-header">
                <h2>My Skills</h2>
                <p>Latest update of my programming skills (est)</p>
            </div>
            <div className="wrapper">
                <div className="skills-container">
                    {SKILLS.map((skill) => {
                        const cfg = animConfig[skill.name] || {};
                        const currentValue = displayLevels[skill.name] ?? 0;
                        const { Icon, color, darkColor } =
                            SKILL_LOGOS[skill.name] || DEFAULT_LOGO;

                        return (
                            <div
                                key={skill.name}
                                className="skill-item disable-select"
                                data-skill-name={skill.name}
                                role="button"
                                tabIndex={0}
                                title="Replay"
                                onClick={() => replaySkill(skill.name)}
                                onKeyDown={(e) =>
                                    handleSkillKeyDown(e, skill.name)
                                }
                            >
                                <span
                                    className="skill-logo"
                                    style={{
                                        "--skill-color": color,
                                        "--skill-color-dark":
                                            darkColor ?? color,
                                    }}
                                >
                                    <Icon aria-hidden="true" />
                                </span>

                                <div className="skill-body">
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
                                            key={replayCounts[skill.name] ?? 0}
                                            className="skill-fill"
                                            style={{
                                                width: animatedSkills[
                                                    skill.name
                                                ]
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
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default Skills;
