const KEY_LOG = "eating_log_v2"; // Changed version to separate from user's sample if any
const KEY_STATE = "eating_state_v2";

// DOM Elements
const els = {
    statusText: document.getElementById("statusText"),
    statusIndicator: document.getElementById("statusIndicator"),
    timerDial: document.getElementById("timerDial"),
    startBtn: document.getElementById("startBtn"),
    activeControls: document.getElementById("activeControls"),
    endBtn: document.getElementById("endBtn"),
    amountInput: document.getElementById("amountInput"),
    totalTime: document.getElementById("totalTime"),
    logList: document.getElementById("logList"),
    clearBtn: document.getElementById("clearBtn")
};

let timerInterval = null;

// Helpers
function pad(n) { return String(n).padStart(2, "0"); }
function fmtTime(d) {
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function todayKey(d = new Date()) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Storage
function loadLog() {
    try { return JSON.parse(localStorage.getItem(KEY_LOG)) ?? []; }
    catch { return []; }
}
function saveLog(log) {
    localStorage.setItem(KEY_LOG, JSON.stringify(log));
}
function loadState() {
    const s = localStorage.getItem(KEY_STATE);
    return s ? new Date(s) : null;
}
function saveState(d) {
    localStorage.setItem(KEY_STATE, d.toISOString());
}
function clearState() {
    localStorage.removeItem(KEY_STATE);
}

// Logic
function getDurationMinutes(start, end) {
    return Math.max(0, Math.round((end - start) / 60000));
}

function updateTimerDisplay() {
    const start = loadState();
    if (start) {
        const diff = Date.now() - start.getTime();
        const totalSeconds = Math.floor(diff / 1000);
        const m = Math.floor(totalSeconds / 60);
        const s = totalSeconds % 60;
        els.timerDial.textContent = `${pad(m)}:${pad(s)}`;
    } else {
        els.timerDial.textContent = "00:00";
    }
}

function render() {
    const start = loadState();
    const log = loadLog();
    const tk = todayKey();

    // Timer State
    if (start) {
        els.statusIndicator.classList.add("status-active");
        els.statusText.textContent = "食事中...";
        els.startBtn.classList.add("hidden");
        els.activeControls.classList.remove("hidden");

        // Start interval if not running
        if (!timerInterval) {
            timerInterval = setInterval(updateTimerDisplay, 1000);
        }
        updateTimerDisplay();
    } else {
        els.statusIndicator.classList.remove("status-active");
        els.statusText.textContent = "待機中";
        els.startBtn.classList.remove("hidden");
        els.activeControls.classList.add("hidden");
        els.timerDial.textContent = "00:00";
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }

    // List & Total
    const todayLog = log.filter(x => x.day === tk);
    const totalMin = todayLog.reduce((sum, x) => sum + x.minutes, 0);

    // Animate total change
    els.totalTime.textContent = totalMin;

    els.logList.innerHTML = "";
    if (todayLog.length === 0) {
        els.logList.innerHTML = `<li style="justify-content:center; color:#b2bec3;">まだ記録がありません</li>`;
    } else {
        // Show newest first
        [...todayLog].reverse().forEach(entry => {
            const li = document.createElement("li");

            const amountBadge = entry.amount ? `<span class="badge">${entry.amount}</span>` : "";

            li.innerHTML = `
        <div class="log-details">
          <span class="log-time">${entry.startTime} - ${entry.endTime}</span>
          ${amountBadge}
        </div>
        <span class="log-duration">${entry.minutes}分</span>
      `;
            els.logList.appendChild(li);
        });
    }
}

// Events
els.startBtn.addEventListener("click", () => {
    if (loadState()) return;
    saveState(new Date());
    render();
});

els.endBtn.addEventListener("click", () => {
    const start = loadState();
    if (!start) return;

    const end = new Date();
    const minutes = getDurationMinutes(start, end);
    const amount = els.amountInput.value;

    if (confirm(`食事を終了しますか？\n時間: ${minutes}分\n量: ${amount}`)) {
        const entry = {
            day: todayKey(start),
            startTime: fmtTime(start),
            endTime: fmtTime(end),
            minutes: minutes,
            amount: amount
        };

        const log = loadLog();
        log.push(entry);
        saveLog(log);
        clearState();
        render();
    }
});

els.clearBtn.addEventListener("click", () => {
    if (confirm("今日の記録を全て削除しますか？\n（取り消せません）")) {
        localStorage.removeItem(KEY_LOG);
        localStorage.removeItem(KEY_STATE); // Also reset current state? user said "clear all". maybe better to keep state if eating?
        // User code says remove both.
        clearState();
        render();
    }
});

// Init
render();
