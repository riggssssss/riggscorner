import { create } from 'zustand';

type Section = 'home' | 'about' | 'work' | 'contact';

interface NavigationState {
    activeSection: Section;
    setActiveSection: (section: Section) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
    activeSection: 'home',
    setActiveSection: (section) => set({ activeSection: section }),
}));
