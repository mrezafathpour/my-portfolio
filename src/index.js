import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);

// Shows public/offline.html when the app is opened without a connection. Only
// in production builds, so the dev server is never served from a cache.
if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register(`${process.env.PUBLIC_URL}/sw.js`)
            .catch(() => {});
    });
}
