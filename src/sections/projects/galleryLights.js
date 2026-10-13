// The gallery popup's background lights live in one DOM node that is created
// once and kept for the whole visit, so every popup shows the same lights.
// It waits hidden on the page and is moved into the popup while one is open.
let host = null;

export function getGalleryLightsHost() {
    if (!host) {
        host = document.createElement("div");
        host.className = "pg-lights";
        host.setAttribute("aria-hidden", "true");
        document.body.append(host);
    }
    return host;
}

export function moveGalleryLights(parent) {
    (parent || document.body).prepend(getGalleryLightsHost());
}
