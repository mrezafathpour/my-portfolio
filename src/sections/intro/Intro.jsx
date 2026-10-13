import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from "react";
import Navbar from "../../components/navbar/Navbar";
import { useNavigation } from "../../features/navigation/NavigationContext";
import { MyIntro } from "../../store/MyData";
import "./Intro.css";

// The description's timing is tuned for desktop, where a line holds at least
// this many letters. The reveal moves at a fixed number of letters per second,
// so on a narrow screen (far fewer letters per line) it would race through the
// lines and light up a couple of words at once. Its pace is therefore slowed
// in proportion to how many letters fit on a line, down to a minimum.
const DESCRIPTION_SPEED = 3;

// Seconds from the start of one description sentence to the start of the next
const DESCRIPTION_SENTENCE_GAP = 3;
const REFERENCE_LETTERS_PER_LINE = 45;
const MIN_DESCRIPTION_PACE = 0.5;

// Tablets fit almost as many letters on a line as a desktop (their text is
// smaller), so the rule above barely slows them. From the breakpoint where
// Intro.css shrinks the text, the pace is therefore capped as well.
const SMALL_TEXT_QUERY = "(max-width: 1024px)";
const SMALL_TEXT_MAX_PACE = 0.75;

// Each letter fades in and then sharpens from a blur, which leaves a soft
// trail behind the reveal. On narrow lines that trail is shortened much more
// steeply than the pace, so it covers a word or two instead of a line or two.
const FADE_DURATION = 0.25;
const BLUR_DURATION = 1;
const TRAIL_FALLOFF = 3;

const Intro = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [titleMode, setTitleMode] = useState(true);
    const [descriptionPace, setDescriptionPace] = useState(1);
    const descriptionRef = useRef(null);
    const { setHandleIntro } = useNavigation();

    const restartAnimation = useCallback(() => {
        setIsVisible(false);
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setIsVisible(true);
            });
        });
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
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

    // Measured once each time the description is shown, before it is painted
    // and while its letters are still hidden
    useLayoutEffect(() => {
        if (titleMode) return;

        const sentence = descriptionRef.current;
        const letterWidth = sentence
            ?.querySelector("span")
            ?.getBoundingClientRect().width;
        if (!letterWidth) return;

        const lettersPerLine = sentence.clientWidth / letterWidth;
        const maxPace = window.matchMedia(SMALL_TEXT_QUERY).matches
            ? SMALL_TEXT_MAX_PACE
            : 1;
        setDescriptionPace(
            Math.min(
                maxPace,
                Math.max(
                    MIN_DESCRIPTION_PACE,
                    lettersPerLine / REFERENCE_LETTERS_PER_LINE
                )
            )
        );
    }, [titleMode]);

    const animateText = (text, startDelay, speed, trailScale = 1) => {
        const baseStartDelay =
            typeof startDelay === "number" && !Number.isNaN(startDelay)
                ? startDelay + 0.5
                : 0.5;

        const baseSpeed =
            typeof speed === "number" && !Number.isNaN(speed) ? speed : 1;

        const fade = FADE_DURATION * trailScale;
        const blur = BLUR_DURATION * trailScale;

        const words = text.split(" ");
        let globalIndex = 0;

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
                            transition: `opacity ${fade}s ease ${delay}s, filter ${blur}s ease ${delay}s`,
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

    // Must keep the same identity between renders: it is registered in the
    // navigation context below, and a new function on every render would make
    // that effect re-register it each time, re-rendering this component in an
    // endless loop ("Maximum update depth exceeded")
    const handleIntroductionClick = useCallback(() => {
        setTitleMode((mode) => !mode);
        restartAnimation();
    }, [restartAnimation]);

    useEffect(() => {
        setHandleIntro(() => handleIntroductionClick);

        return () => setHandleIntro(null);
    }, [handleIntroductionClick, setHandleIntro]);

    // Slower letters need the later sentences to start later by the same
    // factor, so the sentences still follow each other without overlapping
    const descriptionSpeed = DESCRIPTION_SPEED * descriptionPace;
    const descriptionTrail = descriptionPace ** TRAIL_FALLOFF;

    return (
        <>
            <Navbar />
            <section className="intro-section" id="Intro">
                <div className="wrapper">
                    {titleMode && (
                        <h1
                            className="disable-select"
                        >
                            <div className="sentence-wrapper">
                                <span className="sentence">
                                    {animateText(MyIntro.greeting)}
                                </span>
                                <span className="sentence profession">
                                    {animateText(MyIntro.profession, 1)}
                                </span>
                            </div>
                        </h1>
                    )}
                    {!titleMode && (
                        <div
                            className="sentence-wrapper"
                        >
                            {MyIntro.description.map((sentence, i) => (
                                <code
                                    key={i}
                                    className="sentence disable-select description"
                                    ref={i === 0 ? descriptionRef : undefined}
                                >
                                    {animateText(
                                        sentence,
                                        (i * DESCRIPTION_SENTENCE_GAP) /
                                            descriptionPace,
                                        descriptionSpeed,
                                        descriptionTrail
                                    )}
                                </code>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </>
    );
};

export default Intro;
