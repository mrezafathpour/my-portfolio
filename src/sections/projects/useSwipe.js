import { useRef } from "react";

export default function useSwipe(onPrev, onNext, threshold = 40) {
    const startRef = useRef(null);
    const swipedRef = useRef(false);

    return {
        onPointerDown: (e) => {
            startRef.current = e.clientX;
            swipedRef.current = false;
        },
        onPointerUp: (e) => {
            if (startRef.current == null) return;

            const diff = e.clientX - startRef.current;
            startRef.current = null;
            if (Math.abs(diff) < threshold) return;

            swipedRef.current = true;
            if (diff < 0) onNext();
            else onPrev();
        },
        onPointerCancel: () => {
            startRef.current = null;
        },
        onClickCapture: (e) => {
            if (!swipedRef.current) return;

            swipedRef.current = false;
            e.stopPropagation();
            e.preventDefault();
        },
    };
}
