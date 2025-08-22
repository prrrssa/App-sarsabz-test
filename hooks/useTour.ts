// hooks/useTour.ts
import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../hooks/useAuth';
import { TOUR_STEPS } from '../utils/tourSteps';

declare var introJs: any;

export const useTour = () => {
    const { user } = useAuth();
    const { tourCompletions, completeTour, loadingData } = useData();
    const location = useLocation();

    const startTour = useCallback(() => {
        if (!user) return;
        const intro = introJs();
        intro.setOptions({
            steps: TOUR_STEPS,
            nextLabel: 'بعدی',
            prevLabel: 'قبلی',
            doneLabel: 'پایان',
            exitOnOverlayClick: false,
            showStepNumbers: true,
        });
        intro.oncomplete(() => completeTour(user.id));
        intro.onexit(() => completeTour(user.id));
        intro.start();
    }, [user, completeTour]);

    useEffect(() => {
        if (!user || loadingData || tourCompletions[user.id]) {
            return;
        }

        // Delay to ensure all components are mounted, especially after navigation
        const timer = setTimeout(() => {
            startTour();
        }, 1000); // 1 second delay

        return () => clearTimeout(timer);
    }, [user, loadingData, tourCompletions, location.pathname, startTour]);

    return { startTour };
};
