/**
 * Main Application Logic
 */

const App = {
    state: {
        currentView: 'view-daily',
        today: Utils.getTodayDateString(),
        items: [],
        checkedIds: new Set()
    },

    init: () => {
        console.log('App Initializing...');
        Store.init();

        // DOM Elements
        App.dom = {
            dateDisplay: document.getElementById('date-display'),
            progressBar: document.getElementById('progress-bar'),
            dailyList: document.getElementById('daily-list'),
            missingList: document.getElementById('missing-list'),
            views: document.querySelectorAll('.view'),
            navBtns: document.querySelectorAll('.nav-btn'),
            dailyEmpty: document.getElementById('daily-empty'),
            missingEmpty: document.getElementById('missing-empty'),
            btnReset: document.getElementById('btn-daily-reset'),
            btnResetData: document.getElementById('btn-reset-data'),
            toast: document.getElementById('toast')
        };

        // Initial Data Load
        App.loadData();

        // Event Listeners
        App.attachListeners();

        // Render
        App.renderHeader();
        App.renderDailyList(); // Also updates progress

        console.log('App Initialized');
    },

    loadData: () => {
        App.state.items = Store.getTodaysItems();
        const log = Store.getDailyLog(App.state.today);
        App.state.checkedIds = new Set(log.checked);
    },

    attachListeners: () => {
        // Navigation
        App.dom.navBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Find target ID either on the button or its parent
                const targetId = btn.getAttribute('data-target') || btn.closest('.nav-btn').getAttribute('data-target');
                if (targetId) App.navigate(targetId);
            });
        });

        // Reset Button
        App.dom.btnReset.addEventListener('click', () => {
            if (confirm('今日のチェックをリセットしますか？')) {
                Store.resetDailyLog(App.state.today);
                App.showToast('リセットしました');
                App.loadData();
                App.renderDailyList();
                App.renderMissingList(); // Update missing/success state
            }
        });

        // Data Reset Button
        App.dom.btnResetData.addEventListener('click', () => {
            if (confirm('全てのデータを初期状態に戻しますか？')) {
                Store.resetAllData();
                location.reload();
            }
        });
    },

    navigate: (viewId) => {
        // Update View
        App.dom.views.forEach(view => {
            view.classList.remove('active');
            if (view.id === viewId) view.classList.add('active');
        });

        // Update Nav Buttons
        App.dom.navBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-target') === viewId) btn.classList.add('active');
        });

        App.state.currentView = viewId;

        // Specific actions on navigate
        if (viewId === 'view-missing') {
            App.renderMissingList();
        }
    },

    renderHeader: () => {
        App.dom.dateDisplay.textContent = Utils.formatDateForDisplay();
    },

    renderDailyList: () => {
        const list = App.dom.dailyList;
        list.innerHTML = '';

        if (App.state.items.length === 0) {
            App.dom.dailyEmpty.classList.remove('hidden');
            return;
        } else {
            App.dom.dailyEmpty.classList.add('hidden');
        }

        App.state.items.forEach(item => {
            const isChecked = App.state.checkedIds.has(item.id);
            const card = document.createElement('div');
            card.className = `item-card ${isChecked ? 'checked' : ''}`;
            card.onclick = () => App.toggleItem(item.id);

            card.innerHTML = `
                <div class="checkbox"></div>
                <div class="item-name">${item.name}</div>
                ${item.category ? `<div class="item-tag">${App.getCategoryIcon(item.category)}</div>` : ''}
            `;
            list.appendChild(card);
        });

        App.updateProgress();
    },

    renderMissingList: () => {
        const list = App.dom.missingList;
        list.innerHTML = '';

        const missingItems = App.state.items.filter(item => !App.state.checkedIds.has(item.id));

        if (missingItems.length === 0) {
            App.dom.missingEmpty.classList.remove('hidden');
        } else {
            App.dom.missingEmpty.classList.add('hidden');

            missingItems.forEach(item => {
                const card = document.createElement('div');
                card.className = 'item-card';
                // Clicking in missing list also checks it
                card.onclick = () => {
                    App.toggleItem(item.id);
                    App.renderMissingList(); // Re-render this list to remove it
                }

                card.innerHTML = `
                    <div class="checkbox"></div>
                    <div class="item-name">${item.name}</div>
                     ${item.category ? `<div class="item-tag">${App.getCategoryIcon(item.category)}</div>` : ''}
                `;
                list.appendChild(card);
            });
        }
    },

    toggleItem: (itemId) => {
        const log = Store.toggleCheck(itemId, App.state.today);
        App.state.checkedIds = new Set(log.checked);

        // Re-render Daily List (just update classes for performance ideally, but re-render is fine for MVP)
        App.renderDailyList();

        // If we are in missing view, we might not want to interactively remove immediately to avoid jumps, 
        // but for now re-rendering missing list on toggle is safest logic.
        if (App.state.currentView === 'view-missing') {
            // Optional: Add checking animation delay
        }
    },

    updateProgress: () => {
        const total = App.state.items.length;
        const checked = App.state.checkedIds.size;
        const percent = total === 0 ? 0 : (checked / total) * 100;

        App.dom.progressBar.style.width = `${percent}%`;
    },

    getCategoryIcon: (category) => {
        // Simple mapping
        const map = {
            'digital': '📱',
            'essential': '🔑',
            'hygiene': '😷',
            'study': '✏️',
            'food': '🍙',
            'other': '📦'
        };
        return map[category] || '';
    },

    showToast: (msg) => {
        const toast = App.dom.toast;
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 2000);
    },

    // --- Management Features ---

    openModal: (modalId) => {
        // Using a simple prompt/alert flow for MVP instead of full modal to save code size
        // Real implementation would toggle a modal div
        if (modalId === 'item-editor') {
            App.renderItemEditor();
        }
    },

    renderItemEditor: () => {
        // Temporarily hijack the main view to show editor
        const settingsView = document.getElementById('view-settings');
        // Clear current settings content to show standard editor (re-render settings will fix this on back)
        window.alert("簡易編集モード：アイテムの追加と削除ができます");

        const action = window.prompt("操作を選択してください:\n1: アイテム追加\n2: アイテム削除", "1");

        if (action === "1") {
            const name = window.prompt("アイテム名を入力してください:");
            if (name) {
                Store.addItem(name);
                App.showToast("アイテムを追加しました");
                App.renderSettings(); // Refresh settings view
            }
        } else if (action === "2") {
            // Simple deletion by name for MVP (ID selection is hard in prompt)
            const name = window.prompt("削除するアイテム名を入力してください:");
            if (name) {
                const inventory = Store.getInventory();
                const item = inventory.find(i => i.name === name);
                if (item) {
                    Store.deleteItem(item.id);
                    App.showToast("削除しました");
                    App.renderSettings();
                } else {
                    alert("見つかりませんでした");
                }
            }
        }
    },

    // Better implementation: Render the settings view with actual UI
    renderSettings: () => {
        const container = document.getElementById('view-settings');

        // Weekday Selector Logic
        const weekdayContainer = document.getElementById('settings-weekday-selector');
        weekdayContainer.innerHTML = '';
        const dayNames = ['日', '月', '火', '水', '木', '金', '土'];

        // Determine selected weekday for editing (default to today)
        if (typeof App.state.editingWeekday === 'undefined') {
            App.state.editingWeekday = Utils.getDayOfWeek();
        }

        dayNames.forEach((name, idx) => {
            const btn = document.createElement('button');
            btn.className = `btn-secondary ${App.state.editingWeekday === idx ? 'active-day' : ''}`;
            btn.style.width = '40px';
            btn.style.height = '40px';
            btn.style.margin = '2px';
            btn.textContent = name;
            btn.onclick = () => {
                App.state.editingWeekday = idx;
                App.renderSettings(); // Re-render to show rules for this day
            };
            weekdayContainer.appendChild(btn);
        });

        // Item List for Settings (Toggle Daily / Toggle Weekly for selected day)
        // We will inject a list into settings-group
        let listContainer = document.getElementById('settings-item-list');
        if (!listContainer) {
            listContainer = document.createElement('div');
            listContainer.id = 'settings-item-list';
            container.querySelector('.settings-group:nth-of-type(2)').appendChild(listContainer);
        }
        listContainer.innerHTML = '<h4>' + dayNames[App.state.editingWeekday] + '曜日の持ち物設定</h4>';

        const inventory = Store.getInventory();
        const rules = Store.getWeeklyRules();

        inventory.forEach(item => {
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.justifyContent = 'space-between';
            row.style.padding = '8px';
            row.style.borderBottom = '1px solid #eee';

            // Check if item is enabled for this weekday
            // 1. Is it a Daily item?
            // 2. Is there a rule enabling it?

            const isDaily = item.isDaily;
            const hasRule = rules.some(r => r.weekday === App.state.editingWeekday && r.itemId === item.id && r.enabled);
            const isEffective = isDaily || hasRule;

            row.innerHTML = `
                <span>${item.name} <span style="font-size:0.8em; color:#888;">${isDaily ? '(毎日)' : ''}</span></span>
                <input type="checkbox" ${isEffective ? 'checked' : ''} ${isDaily ? 'disabled' : ''}>
            `;

            const checkbox = row.querySelector('input');
            checkbox.onchange = (e) => {
                if (isDaily) return; // Cannot disable daily item via weekly rule (simplification)
                Store.setWeeklyRule(App.state.editingWeekday, item.id, e.target.checked);
                App.showToast('設定を保存しました');
            };

            listContainer.appendChild(row);
        });

        // Add "New Item" button in Settings
        let addBtn = document.getElementById('btn-add-item-settings');
        if (!addBtn) {
            const div = document.createElement('div');
            div.innerHTML = '<br><button id="btn-add-item-settings" class="btn-primary full-width">＋ 新しいアイテムを登録</button>';
            container.querySelector('.settings-group:nth-of-type(1)').appendChild(div);
            addBtn = div.querySelector('button');
            addBtn.onclick = () => {
                const name = prompt('アイテム名:');
                if (name) {
                    Store.addItem(name);
                    App.renderSettings();
                    App.showToast('追加しました');
                }
            }
        }
    }
};

// Start
document.addEventListener('DOMContentLoaded', () => {
    App.init();
    // Hook into renderSettings when viewing settings
    const settingBtn = document.getElementById('nav-settings');
    settingBtn.addEventListener('click', () => {
        App.renderSettings();
    });
});

window.app = App; // Expose for debugging/event handlers
