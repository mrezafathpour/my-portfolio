import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Installed on an iPhone's home screen, 100vh (and svh) can be taller than
// what is actually visible, which pushed the bottom of the intro under the
// navbar. There the real visible height is measured instead (--app-height,
// used in Intro.css). In a browser tab svh is right, and stays steady while
// the toolbars slide in and out, so it is left to CSS.
const isInstalledApp =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;

if (isInstalledApp) {
    const setAppHeight = () =>
        document.documentElement.style.setProperty(
            "--app-height",
            `${window.innerHeight}px`
        );

    setAppHeight();
    window.addEventListener("resize", setAppHeight);
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);

// Shows public/offline.html when the app is opened without a connection. Only
// in production builds, so the dev server is never served from a cache.
if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register(`${process.env.PUBLIC_URL}/service-worker.js`)
            .catch(() => {});
    });
}
