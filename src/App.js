import GradientLights from "./components/GradientLights";
import Intro from "./sections/intro/Intro";
import Skills from "./sections/skills/Skills";
import Journey from "./sections/journey/Journey";
import Contact from "./sections/contact/Contact";

const App = () => {
    return (
        <main className="App">
            <GradientLights />
            <Intro />
            <Skills />
            <Journey />
            <Contact />
        </main>
    );
};

export default App;
