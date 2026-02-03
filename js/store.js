/**
 * Data Store (LocalStorage Wrapper)
 */
const Store = {
    KEYS: {
        INVENTORY: 'fia_inventory',
        WEEKLY_RULES: 'fia_weekly_rules',
        DAILY_LOGS: 'fia_daily_logs',
        SETTINGS: 'fia_settings'
    },
    // Default Data
    DEFAULTS: {
        INVENTORY: [
            { id: '1', name: 'スマホ', category: 'digital', isDaily: true, sortOrder: 1 },
            { id: '2', name: '財布', category: 'essential', isDaily: true, sortOrder: 2 },
            { id: '3', name: '家の鍵', category: 'essential', isDaily: true, sortOrder: 3 },
            { id: '4', name: '学生証', category: 'essential', isDaily: true, sortOrder: 4 },
            { id: '5', name: 'ワイヤレスイヤホン', category: 'digital', isDaily: true, sortOrder: 5 },
            { id: '6', name: 'モバイルバッテリー', category: 'digital', isDaily: true, sortOrder: 6 },
            { id: '7', name: 'ハンカチ・ティッシュ', category: 'hygiene', isDaily: true, sortOrder: 7 },
            { id: '8', name: 'マスク', category: 'hygiene', isDaily: true, sortOrder: 8 },
            { id: '9', name: '筆記用具', category: 'study', isDaily: true, sortOrder: 9 },
            { id: '10', name: 'ノートPC', category: 'digital', isDaily: true, sortOrder: 10 },
            // Optional items (not daily by default, but in inventory)
            { id: '11', name: '関数電卓', category: 'study', isDaily: false, sortOrder: 11 },
            { id: '12', name: '実験着', category: 'study', isDaily: false, sortOrder: 12 },
            { id: '13', name: '英語参考書', category: 'study', isDaily: false, sortOrder: 13 },
            { id: '14', name: '折り畳み傘', category: 'other', isDaily: false, sortOrder: 14 },
            { id: '15', name: '水筒', category: 'food', isDaily: true, sortOrder: 15 },
        ],
        WEEKLY_RULES: [
            // Example: Tuesday (2) needs Function Calculator (11)
            { id: 'w1', weekday: 2, itemId: '11', enabled: true },
        ]
    },
    init: () => {
        if (!localStorage.getItem(Store.KEYS.INVENTORY)) {
            localStorage.setItem(Store.KEYS.INVENTORY, JSON.stringify(Store.DEFAULTS.INVENTORY));
        }
        if (!localStorage.getItem(Store.KEYS.WEEKLY_RULES)) {
            localStorage.setItem(Store.KEYS.WEEKLY_RULES, JSON.stringify(Store.DEFAULTS.WEEKLY_RULES));
        }
    },
    getInventory: () => {
        return JSON.parse(localStorage.getItem(Store.KEYS.INVENTORY) || '[]');
    },
    getWeeklyRules: () => {
        return JSON.parse(localStorage.getItem(Store.KEYS.WEEKLY_RULES) || '[]');
    },
    getDailyLog: (dateStr) => {
        const logs = JSON.parse(localStorage.getItem(Store.KEYS.DAILY_LOGS) || '{}');
        return logs[dateStr] || { date: dateStr, checked: [] };
    },
    saveDailyLog: (log) => {
        const logs = JSON.parse(localStorage.getItem(Store.KEYS.DAILY_LOGS) || '{}');
        logs[log.date] = log;
        localStorage.setItem(Store.KEYS.DAILY_LOGS, JSON.stringify(logs));
        // Cleanup old logs (keep last 7 days)
        // Implementation skipped for MVP simplicity
    },
    // Core Logic: Get Today's Items
    getTodaysItems: () => {
        const inventory = Store.getInventory();
        const rules = Store.getWeeklyRules();
        const weekday = Utils.getDayOfWeek();
        // 1. Get Daily Items
        let dailyItems = inventory.filter(i => i.isDaily);
        // 2. Get Weekly Rule Items for Today
        const todaysRules = rules.filter(r => r.weekday === weekday && r.enabled);
        const ruleItemIds = new Set(todaysRules.map(r => r.itemId));
        // 3. Merge
        // Add items from rules that are NOT already in dailyItems
        const extraItems = inventory.filter(i => ruleItemIds.has(i.id) && !i.isDaily);
        const allItems = [...dailyItems, ...extraItems];
        // 4. Sort
        return allItems.sort((a, b) => a.sortOrder - b.sortOrder);
    },
    // CRUD Operations for Inventory
    addItem: (name, category) => {
        const inventory = Store.getInventory();
        const newItem = {
            id: Utils.generateUUID(),
            name,
            category: category || 'other',
            isDaily: true, // Default to daily
            sortOrder: inventory.length + 1
        };
        inventory.push(newItem);
        localStorage.setItem(Store.KEYS.INVENTORY, JSON.stringify(inventory));
        return newItem;
    },
    deleteItem: (id) => {
        let inventory = Store.getInventory();
        inventory = inventory.filter(i => i.id !== id);
        localStorage.setItem(Store.KEYS.INVENTORY, JSON.stringify(inventory));
        // Also remove from rules
        let rules = Store.getWeeklyRules();
        rules = rules.filter(r => r.itemId !== id);
        localStorage.setItem(Store.KEYS.WEEKLY_RULES, JSON.stringify(rules));
    },
    updateItem: (item) => {
        let inventory = Store.getInventory();
        const index = inventory.findIndex(i => i.id === item.id);
        if (index > -1) {
            inventory[index] = item;
            localStorage.setItem(Store.KEYS.INVENTORY, JSON.stringify(inventory));
        }
    },
    // CRUD for Weekly Rules
    setWeeklyRule: (weekday, itemId, enabled) => {
        let rules = Store.getWeeklyRules();
        // Remove existing rule for this combination if exists
        rules = rules.filter(r => !(r.weekday === weekday && r.itemId === itemId));
        if (enabled) {
            rules.push({
                id: Utils.generateUUID(),
                weekday,
                itemId,
                enabled: true
            });
        }
        localStorage.setItem(Store.KEYS.WEEKLY_RULES, JSON.stringify(rules));
    },
    toggleCheck: (itemId, dateStr) => {
        const log = Store.getDailyLog(dateStr);
        const index = log.checked.indexOf(itemId);
        if (index > -1) {
            log.checked.splice(index, 1);
        } else {
            log.checked.push(itemId);
        }
        Store.saveDailyLog(log);
        return log; // Return updated log
    },
    resetDailyLog: (dateStr) => {
        const log = { date: dateStr, checked: [] };
        Store.saveDailyLog(log);
    },
    // reset all data
    resetAllData: () => {
        localStorage.clear();
        Store.init();
    }
};
window.Store = Store;
