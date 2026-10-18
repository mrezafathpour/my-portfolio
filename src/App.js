import GradientLights from "./components/GradientLights";
import OfflineOverlay from "./components/OfflineOverlay";
import Intro from "./sections/intro/Intro";
import Skills from "./sections/skills/Skills";
import Projects from "./sections/projects/Projects";
import Journey from "./sections/journey/Journey";
import Contact from "./sections/contact/Contact";
import { NavigationProvider } from "./features/navigation/NavigationContext";
const App = () => {
    return (
        <NavigationProvider>
            <main className="App">
                <GradientLights />
                <Intro />
                <Projects />
                <Skills />
                <Journey />
                <Contact />
            </main>
            <OfflineOverlay />
        </NavigationProvider>
    );
};

export default App;
