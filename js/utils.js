/**
 * Utility Functions
 */
const Utils = {
    // Generate a simple UUID-like string
    generateUUID: () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },
    // Get current date string in YYYY-MM-DD format
    getTodayDateString: () => {
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const d = String(today.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    },
    // Get number of current day (0=Sun, 1=Mon, ..., 6=Sat)
    getDayOfWeek: () => {
        return new Date().getDay();
    },
    // Format date for display (e.g., "12/16 (月)")
    formatDateForDisplay: () => {
        const today = new Date();
        const m = today.getMonth() + 1;
        const d = today.getDate();
        const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
        const dayName = dayNames[today.getDay()];
        return `${m}/${d} (${dayName})`;
    }
};
window.Utils = Utils;
