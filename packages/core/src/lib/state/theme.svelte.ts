export class ThemeState {
    isDark = $state(false);

    constructor() {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('preferredTheme');
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.isDark = stored ? stored === 'dark' : prefersDark;
        }
    }

    toggle() {
        this.isDark = !this.isDark;
        if (typeof window !== 'undefined') {
            localStorage.setItem('preferredTheme', this.isDark ? 'dark' : 'light');
        }
    }
}

export const theme = new ThemeState();

