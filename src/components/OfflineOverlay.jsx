import { useEffect, useState } from "react";

const OFFLINE_PAGE = `${process.env.PUBLIC_URL}/offline.html`;

// Sent by offline.html once it has confirmed the connection is back
const ONLINE_MESSAGE = "offline-page:online";

// The service worker only shows offline.html when a page fails to load. An
// app that is already open stays as it is when the connection drops, so this
// shows the same page over it, and takes it away again once back online.
// It needs the service worker in control: that is what serves the page from
// its cache while offline (so never on the dev server, which has none).
const canShowOfflinePage = () =>
    !navigator.onLine && Boolean(navigator.serviceWorker?.controller);

export default function OfflineOverlay() {
    const [isOffline, setIsOffline] = useState(canShowOfflinePage);

    useEffect(() => {
        const update = () => {
            if (canShowOfflinePage()) setIsOffline(true);
        };

        // A phone may lose the connection while the app is in the
        // background, without an "offline" event once it comes back
        const handleVisibility = () => {
            if (document.visibilityState === "visible") update();
        };

        const handleMessage = (event) => {
            if (
                event.origin === window.location.origin &&
                event.data === ONLINE_MESSAGE
            ) {
                setIsOffline(false);
            }
        };

        window.addEventListener("offline", update);
        document.addEventListener("visibilitychange", handleVisibility);
        window.addEventListener("message", handleMessage);

        return () => {
            window.removeEventListener("offline", update);
            document.removeEventListener("visibilitychange", handleVisibility);
            window.removeEventListener("message", handleMessage);
        };
    }, []);

    // The page underneath must not scroll behind the overlay
    useEffect(() => {
        if (!isOffline) return;

        const root = document.documentElement;
        const previous = root.style.overflow;
        root.style.overflow = "hidden";

        return () => {
            root.style.overflow = previous;
        };
    }, [isOffline]);

    if (!isOffline) return null;

    return (
        <iframe
            src={OFFLINE_PAGE}
            title="You're offline"
            style={{
                position: "fixed",
                inset: 0,
                width: "100%",
                height: "100%",
                border: 0,
                zIndex: "var(--z-offline)",
            }}
        />
    );
}
