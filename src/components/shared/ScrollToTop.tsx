import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop component that resets window scroll position on route changes.
 * Place this inside BrowserRouter.
 */
export function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        // Check if user prefers reduced motion
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        window.scrollTo({
            top: 0,
            left: 0,
            behavior: prefersReducedMotion ? 'auto' : 'smooth'
        });
    }, [pathname]);

    return null;
}
