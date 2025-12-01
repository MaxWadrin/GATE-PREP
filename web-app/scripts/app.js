document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    updateCountdown();
    renderSyllabus();
    updateCurrentStatus();
    renderRoadmap();
    loadErrors();
    setupEventListeners();

    // Load saved shift
    const savedShift = localStorage.getItem('gate_shift');
    if (savedShift) {
        document.getElementById('shift-select').value = savedShift;
        renderDailyPlan(savedShift);
    }

    renderRevisionDashboard('today'); // Default filter

    setInterval(updateCountdown, 60000);
}

// --- Dashboard Logic ---

function updateCountdown() {
    const examDate = new Date(GATE_DATA.examDate);
    const now = new Date();
    const diffTime = Math.abs(examDate - now);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    document.getElementById('days-left').textContent = diffDays;
}

function updateCurrentStatus() {
    let currentWeek = null;
    let totalTasks = 0;
    let completedTasks = 0;

    // 1. Try to find week by Date
    const now = new Date();
    // Assuming titles are like "WEEK 1 (Nov 30 - Dec 7)"
    // We can parse the dates or just rely on the order if we assume the user follows the schedule.
    // Let's rely on the 'first incomplete' logic as a fallback, but prioritize the date if possible.
    // Since parsing "Nov 30" is tricky without year, let's stick to the robust 'first incomplete' 
    // but ensure it defaults to the first week if nothing is found.

    GATE_DATA.schedule.forEach(week => {
        let weekCompleted = true;
        week.tasks.forEach((task) => {
            if (task.subtasks && task.subtasks.length > 0) {
                task.subtasks.forEach((sub, idx) => {
                    totalTasks++;
                    if (localStorage.getItem(`${task.id}_sub_${idx}`) === 'true') {
                        completedTasks++;
                    } else {
                        weekCompleted = false;
                    }
                });
            } else {
                totalTasks++;
                if (localStorage.getItem(task.id) === 'true') {
                    completedTasks++;
                } else {
                    weekCompleted = false;
                }
            }
        });

        // If we haven't found a current week yet, and this one is incomplete, it's the current one.
        if (!weekCompleted && !currentWeek) {
            currentWeek = week;
        }
    });

    // Fallback: If all weeks are complete, or none found, show the first one or the last one?
    // If all complete, show the last one.
    if (!currentWeek && GATE_DATA.schedule.length > 0) {
        // Check if all are actually completed
        if (completedTasks === totalTasks && totalTasks > 0) {
            currentWeek = GATE_DATA.schedule[GATE_DATA.schedule.length - 1];
        } else {
            currentWeek = GATE_DATA.schedule[0];
        }
    }

    if (currentWeek) {
        const titleEl = document.getElementById('current-week-title');
        const focusEl = document.getElementById('current-focus');
        if (titleEl) titleEl.textContent = currentWeek.title;
        if (focusEl) focusEl.textContent = currentWeek.focus;
    } else {
        console.error("No current week found!");
    }

    const percentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
    const pctEl = document.getElementById('completion-percentage');
    const fillEl = document.getElementById('progress-fill');
    if (pctEl) pctEl.textContent = `${percentage}%`;
    if (fillEl) fillEl.style.width = `${percentage}%`;
}

function renderRoadmap() {
    const container = document.getElementById('roadmap-timeline');
    if (!container) return;
    container.innerHTML = '';

    GATE_DATA.schedule.forEach((week, index) => {
        const item = document.createElement('div');
        item.className = `timeline-item ${index % 2 === 0 ? 'left' : 'right'}`;

        // Check if this week is active (partially completed or next up)
        // For simplicity, let's mark it active if it's the current week displayed on dashboard
        const currentTitle = document.getElementById('current-week-title').textContent;
        if (week.title === currentTitle) {
            item.classList.add('active');
        }

        item.innerHTML = `
            <div class="timeline-content">
                <span class="timeline-phase">${week.phase}</span>
                <span class="timeline-date">${week.title.split('(')[1].replace(')', '')}</span>
                <h3 class="timeline-title">${week.title.split('(')[0]}</h3>
                <p class="timeline-focus">🎯 ${week.focus}</p>
            </div>
        `;
        container.appendChild(item);
    });
}

// --- Shift Scheduler Engine ---

function calculateDailyQuota() {
    const examDate = new Date(GATE_DATA.examDate);
    const now = new Date();
    const diffTime = Math.max(1, Math.ceil((examDate - now) / (1000 * 60 * 60 * 24)));

    // Count total topics vs completed
    let totalTopics = 0;
    let completedTopics = 0;

    GATE_DATA.schedule.forEach(week => {
        week.tasks.forEach(task => {
            if (task.subtasks) {
                totalTopics += task.subtasks.length;
                task.subtasks.forEach((sub, idx) => {
                    if (localStorage.getItem(`${task.id}_sub_${idx}`) === 'true') completedTopics++;
                });
            } else {
                totalTopics++;
                if (localStorage.getItem(task.id) === 'true') completedTopics++;
            }
        });
    });

    const remaining = totalTopics - completedTopics;
    // Formula: ceil( (Remaining / Days) * 1.2 )
    let quota = Math.ceil((remaining / diffTime) * 1.2);
    return Math.max(3, Math.min(7, quota)); // Clamp between 3 and 7
}

function generateDailySchedule(quota) {
    const schedule = {
        overdue: [],
        t0: [],
        srs: [],
        newTopics: []
    };

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // 1. Collect SRS Items (Overdue & Due Today) & T0 Items
    GATE_DATA.schedule.forEach(week => {
        week.tasks.forEach(task => {
            // Check SRS Due Date
            const dueStr = localStorage.getItem(`${task.id}_due`);
            if (dueStr) {
                const dueDate = new Date(dueStr);
                dueDate.setHours(0, 0, 0, 0);

                if (dueDate < now) {
                    schedule.overdue.push(task);
                } else if (dueDate.getTime() === now.getTime()) {
                    schedule.srs.push(task);
                }
            }

            // Check T0 Status
            const srsData = JSON.parse(localStorage.getItem(`${task.id}_srs`));
            if (srsData && srsData.interval < 1) {
                // It's in the T0 phase
                schedule.t0.push(task);
            }
        });
    });

    // 2. Collect New Topics
    const currentWeek = getCurrentWeek();
    if (currentWeek) {
        currentWeek.tasks.forEach(task => {
            if (task.subtasks) {
                task.subtasks.forEach((sub, idx) => {
                    const subId = `${task.id}_sub_${idx}`;
                    if (localStorage.getItem(subId) !== 'true') {
                        schedule.newTopics.push({
                            id: subId,
                            title: sub,
                            parentTitle: task.title,
                            parentId: task.id,
                            isSubtask: true,
                            type: task.type
                        });
                    }
                });
            } else {
                if (localStorage.getItem(task.id) !== 'true') {
                    schedule.newTopics.push({
                        id: task.id,
                        title: task.title,
                        parentTitle: "",
                        isSubtask: false,
                        type: task.type
                    });
                }
            }
        });
    }

    return schedule;
}

function renderDailyPlan(shiftKey) {
    const container = document.getElementById('daily-plan-card');
    const windowsList = document.getElementById('study-windows-list');
    const tasksList = document.getElementById('daily-tasks-list');

    if (!shiftKey) {
        container.style.display = 'none';
        return;
    }

    const pattern = GATE_DATA.shiftPatterns[shiftKey];
    if (!pattern) return;

    container.style.display = 'block';

    // Check for Off-Day
    const settings = DB.getSettings();
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const isOffDay = today === settings.weekOffDay;

    // Render Windows
    windowsList.innerHTML = pattern.windows.map(win => `
        <div class="window-item">
            <span class="window-time">${win.time}</span>
            <span class="window-focus">${win.focus} Focus</span>
        </div>
    `).join('');

    // Off-Day Banner
    if (isOffDay) {
        const banner = document.createElement('div');
        banner.style.cssText = 'background: rgba(16, 185, 129, 0.2); color: #34d399; padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem; text-align: center; font-weight: bold; border: 1px solid rgba(16, 185, 129, 0.3);';
        banner.innerHTML = `🌿 RECOVERY MODE (${today}) - SRS Only, No New Topics`;
        // Insert after header
        const header = container.querySelector('.card-header');
        if (header.nextSibling) {
            container.insertBefore(banner, header.nextSibling);
        } else {
            container.appendChild(banner);
        }
    }

    // Generate Schedule
    let quota = calculateDailyQuota();
    if (isOffDay) quota = 0; // Force 0 new topics on off days

    const dailyQueue = generateDailySchedule(quota);

    // Fill Slots
    // Helper to pop from queue
    const popTask = (priority) => {
        // On Off-Day, strictly prioritize SRS and T0, ignore 'new' unless user forces it? 
        // Let's just follow the queue which will be empty of new topics if quota is 0.

        if (priority === 't0' && dailyQueue.t0.length > 0) return { ...dailyQueue.t0.shift(), tag: 'T0 Recall' };
        if (priority === 'srs' && dailyQueue.overdue.length > 0) return { ...dailyQueue.overdue.shift(), tag: 'OVERDUE' };
        if (priority === 'srs' && dailyQueue.srs.length > 0) return { ...dailyQueue.srs.shift(), tag: 'SRS Review' };
        if (priority === 'new' && dailyQueue.newTopics.length > 0) return { ...dailyQueue.newTopics.shift(), tag: 'New Topic' };

        // Fallbacks
        if (dailyQueue.overdue.length > 0) return { ...dailyQueue.overdue.shift(), tag: 'OVERDUE' };
        if (dailyQueue.t0.length > 0) return { ...dailyQueue.t0.shift(), tag: 'T0 Recall' };
        if (dailyQueue.newTopics.length > 0) return { ...dailyQueue.newTopics.shift(), tag: 'New Topic' };
        if (dailyQueue.srs.length > 0) return { ...dailyQueue.srs.shift(), tag: 'SRS Review' };

        return null;
    };

    tasksList.innerHTML = pattern.slots.map((slot, index) => {
        const task = popTask(slot.priority);

        let displayTitle = slot.name;
        let displaySubtitle = slot.duration;
        let taskId = `daily_slot_${index}`;
        let isChecked = false;
        let onclickHandler = "";
        let tag = "";

        if (task) {
            displayTitle = task.title;
            displaySubtitle = `${slot.name} • ${task.parentTitle || ''} • ${slot.duration}`;
            taskId = task.id;
            tag = task.tag;
            isChecked = localStorage.getItem(taskId) === 'true';

            if (task.isSubtask) {
                onclickHandler = `toggleSubtask('${task.id}', '${task.parentId}', this, event)`;
            } else {
                onclickHandler = `toggleTask('${task.id}', this, event)`;
            }
        } else {
            displaySubtitle = `${slot.name} • ${slot.duration}`;
            onclickHandler = `toggleDailyTask('${taskId}', this)`;
            isChecked = localStorage.getItem(taskId) === 'true';
            tag = "Free Slot";
        }

        return `
        <div class="daily-task-item ${isChecked ? 'completed' : ''}" onclick="${onclickHandler}">
            <input type="checkbox" class="task-checkbox" ${isChecked ? 'checked' : ''}>
            <div class="daily-task-info">
                <div style="display:flex; flex-direction:column;">
                    <span class="daily-task-type">
                        ${displayTitle} 
                        <span style="font-size:0.7rem; background:var(--accent-primary); padding:2px 6px; border-radius:4px; margin-left:8px;">${tag}</span>
                    </span>
                    <span class="daily-task-duration" style="font-size:0.8rem;">${displaySubtitle}</span>
                </div>
            </div>
        </div>
    `}).join('');

    updateDailyProgress();
}

// --- Helper Functions ---

function getCurrentWeek() {
    let currentWeek = null;
    let totalTasks = 0;
    let completedTasks = 0;

    // Logic similar to updateCurrentStatus but returns the object
    // 1. Try to find week by Date (Optional enhancement for later)

    // 2. Find first incomplete week
    for (const week of GATE_DATA.schedule) {
        let weekCompleted = true;
        week.tasks.forEach((task) => {
            if (task.subtasks && task.subtasks.length > 0) {
                task.subtasks.forEach((sub, idx) => {
                    if (localStorage.getItem(`${task.id}_sub_${idx}`) !== 'true') {
                        weekCompleted = false;
                    }
                });
            } else {
                if (localStorage.getItem(task.id) !== 'true') {
                    weekCompleted = false;
                }
            }
        });

        if (!weekCompleted) {
            return week;
        }
    }

    // Default to last week if all done, or first if none started
    return GATE_DATA.schedule[GATE_DATA.schedule.length - 1] || GATE_DATA.schedule[0];
}

function getNextIncompleteTask(type) {
    const currentWeek = getCurrentWeek();
    if (!currentWeek) return null;

    // Map plan types to syllabus types
    // "Concept Learning" -> "concept"
    // "Practice" -> "concept" (or specific practice tasks if they existed)
    // "PYQ" -> "pyq"
    // "SRS Reviews" -> handled separately

    let targetType = type.toLowerCase();
    if (type === "Concept Learning" || type === "Practice") targetType = "concept";
    if (type === "PYQ") targetType = "pyq";

    // Find incomplete task of this type
    for (const task of currentWeek.tasks) {
        if (task.type === targetType || (targetType === 'concept' && task.type === 'concept')) {
            if (task.subtasks && task.subtasks.length > 0) {
                for (let i = 0; i < task.subtasks.length; i++) {
                    const subId = `${task.id}_sub_${i}`;
                    if (localStorage.getItem(subId) !== 'true') {
                        return {
                            id: subId,
                            title: task.subtasks[i],
                            parentTitle: task.title,
                            parentId: task.id,
                            isSubtask: true,
                            elementId: subId // For finding DOM element
                        };
                    }
                }
            } else {
                if (localStorage.getItem(task.id) !== 'true') {
                    return {
                        id: task.id,
                        title: task.title,
                        parentTitle: "",
                        isSubtask: false,
                        elementId: task.id
                    };
                }
            }
        }
    }

    updateDailyProgress();
}

window.toggleDailyTask = function (taskId, element) {
    if (event.target.type !== 'checkbox') {
        const checkbox = element.querySelector('.task-checkbox');
        checkbox.checked = !checkbox.checked;
    }

    const checkbox = element.querySelector('.task-checkbox');
    const isChecked = checkbox.checked;

    if (isChecked) {
        element.classList.add('completed');
        localStorage.setItem(taskId, 'true');
    } else {
        element.classList.remove('completed');
        localStorage.removeItem(taskId);
    }

    updateDailyProgress();
};

function updateDailyProgress() {
    const tasks = document.querySelectorAll('.daily-task-item');
    const completed = document.querySelectorAll('.daily-task-item.completed');

    const total = tasks.length;
    const done = completed.length;
    const percentage = total === 0 ? 0 : Math.round((done / total) * 100);

    document.getElementById('daily-progress-text').textContent = `${done}/${total} Completed`;
    document.getElementById('daily-progress-fill').style.width = `${percentage}%`;
}

// --- SRS Engine 2.0 ---

// --- SRS Engine 2.0 (SM-2 Algorithm) ---

function calculateNextReview(topicId, quality) {
    // quality: 0=Forgot, 1=Hard, 2=Good, 3=Easy
    // Map to SM-2 scale (0-5)
    // We use: 0->0, 1->3, 2->4, 3->5
    const qMap = { 0: 0, 1: 3, 2: 4, 3: 5 };
    const q = qMap[quality];

    const topic = DB.getTopic(topicId);
    if (!topic) return;

    let { interval, easeFactor, history } = topic.srs;

    // Defaults if missing
    if (!interval) interval = 0;
    if (!easeFactor) easeFactor = 2.5;
    if (!history) history = [];

    // SM-2 Logic
    if (q < 3) {
        // Failed/Forgot
        interval = 1; // Reset to 1 day
        // Ease factor doesn't change on failure in standard SM-2, but we can penalize slightly
        easeFactor = Math.max(1.3, easeFactor - 0.2);
    } else {
        // Success
        if (interval === 0) {
            interval = 1;
        } else if (interval === 1) {
            interval = 6;
        } else {
            interval = Math.round(interval * easeFactor);
        }

        // Update Ease Factor: EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
        easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
        if (easeFactor < 1.3) easeFactor = 1.3;
    }

    // Update Topic
    const now = Date.now();
    const nextReview = now + (interval * 24 * 60 * 60 * 1000);

    DB.updateTopic(topicId, {
        status: q < 3 ? 'learning' : 'srs_active', // Demote if failed
        srs: {
            interval,
            easeFactor,
            lastReview: now,
            nextReview,
            history: [...history, { date: now, quality: q }]
        }
    });

    return new Date(nextReview);
}

// Wrapper to handle the old 'task' object if passed, or direct ID
window.reviewTask = function (taskId, quality) {
    // In v2, taskId is the DB ID.
    // If called from old UI, it might be a task object.
    // We need to ensure we are working with DB IDs.

    // For now, let's assume taskId is the DB ID.
    // If it's from the old daily plan, we might need to map it.
    // But since we migrated, the IDs should match if we used the same generation logic.
    // However, the daily plan uses 'gate_schedule' structure which is separate from 'DB.topics'.
    // We need to link them.

    // CRITICAL: The Daily Plan currently uses 'GATE_DATA.schedule' (static JS) + localStorage.
    // The Syllabus Tracker uses 'DB.topics' (dynamic LS).
    // We need to bridge this.

    // For Phase 2, we should primarily operate on DB.topics.
    // If reviewTask is called from the Revision Dashboard (which reads from DB in v2?), it works.
    // Let's update renderRevisionDashboard to read from DB first.

    calculateNextReview(taskId, quality);

    // Refresh views
    renderRevisionDashboard();
    renderSyllabus(); // Update table status
};

function renderRevisionDashboard(filterType = 'today', filterDate = null) {
    const container = document.getElementById('revision-list');
    container.innerHTML = '';

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Fetch from DB
    const allTopics = DB.getAllTopics();
    let dueRevisions = [];

    allTopics.forEach(topic => {
        if (!topic.srs.nextReview) return;

        const dueDate = new Date(topic.srs.nextReview);
        const dueDay = new Date(dueDate);
        dueDay.setHours(0, 0, 0, 0);

        let include = false;

        if (filterType === 'today') {
            include = dueDay <= now;
        } else if (filterType === 'tomorrow') {
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            include = dueDay.getTime() === tomorrow.getTime();
        } else if (filterType === 'date' && filterDate) {
            const selected = new Date(filterDate);
            selected.setHours(0, 0, 0, 0);
            include = dueDay.getTime() === selected.getTime();
        } else if (filterType === 'all') {
            include = true;
        }

        if (include) {
            dueRevisions.push({ topic, dueDate });
        }
    });

    // Sort
    dueRevisions.sort((a, b) => a.dueDate - b.dueDate);

    if (dueRevisions.length === 0) {
        let msg = 'No revisions due today. Keep grinding!';
        if (filterType === 'tomorrow') msg = 'No revisions scheduled for tomorrow.';
        container.innerHTML = `<p class="empty-state">${msg}</p>`;
        return;
    }

    dueRevisions.forEach(item => {
        container.appendChild(createRevisionCard(item));
    });
}

function createRevisionCard(item) {
    const div = document.createElement('div');
    div.className = 'revision-item';
    const dateStr = item.dueDate.toLocaleDateString();

    // Badge for T0 or Interval
    const interval = item.topic.srs.interval;
    const badge = interval <= 1 ? '<span style="background:#ff9800; color:white; padding:2px 6px; border-radius:4px; font-size:0.7rem; margin-left:8px;">⚡ T0/T1</span>' : '';

    div.innerHTML = `
        <div class="rev-info">
            <h4>${item.topic.name} <span style="font-size:0.8rem; color:var(--text-secondary)">(${item.topic.subject})</span> ${badge}</h4>
            <span class="rev-method" style="margin-right: 0.5rem;">Due: ${dateStr}</span>
            <div class="srs-actions">
                <button onclick="reviewTask('${item.topic.id}', 0)">Forgot</button>
                <button onclick="reviewTask('${item.topic.id}', 1)">Hard</button>
                <button onclick="reviewTask('${item.topic.id}', 2)">Good</button>
                <button onclick="reviewTask('${item.topic.id}', 3)">Easy</button>
            </div>
        </div>
    `;
    return div;
}

window.reviewTask = function (taskId, quality) {
    const task = findTaskById(taskId);
    if (task) {
        calculateNextReview(task, quality);
        // Refresh current view
        const activeBtn = document.querySelector('.filter-btn.active');
        const filterType = activeBtn ? activeBtn.dataset.filter : 'today';
        const filterDate = document.getElementById('revision-date-filter').value;
        renderRevisionDashboard(filterType, filterDate);
    }
};

function findTaskById(id) {
    for (const week of GATE_DATA.schedule) {
        const task = week.tasks.find(t => t.id === id);
        if (task) return task;
    }
}

const checkbox = element.querySelector('.task-checkbox');
const isChecked = checkbox ? checkbox.checked : false;

if (isChecked) {
    element.classList.add('completed');
    localStorage.setItem(subId, 'true');
} else {
    element.classList.remove('completed');
    localStorage.removeItem(subId);
}

// Check if all subtasks for this parent are done
const parentTask = findTaskById(parentTaskId);
if (parentTask && parentTask.subtasks) {
    let allDone = true;
    parentTask.subtasks.forEach((sub, idx) => {
        if (localStorage.getItem(`${parentTaskId}_sub_${idx}`) !== 'true') {
            allDone = false;
        }
    });

    if (allDone) {
        // Initialize with T0 (0.5 interval)
        if (!localStorage.getItem(`${parentTaskId}_srs`)) {
            const t0Stats = {
                interval: GATE_DATA.srsConfig.t0Interval,
                ease: GATE_DATA.srsConfig.defaultEase,
                reps: 0
            };
            localStorage.setItem(`${parentTaskId}_srs`, JSON.stringify(t0Stats));

            const dueDate = new Date();
            dueDate.setHours(dueDate.getHours() + 12); // Due in 12 hours
            localStorage.setItem(`${parentTaskId}_due`, dueDate.toISOString());
        }
    }
}

updateCurrentStatus();
updateDailyProgress();
renderRevisionDashboard();
};

function toggleTask(taskId, element, event) {
    if (event.target.type !== 'checkbox' && !event.target.closest('.srs-actions')) {
        const checkbox = element.querySelector('.task-checkbox');
        checkbox.checked = !checkbox.checked;
    }

    const checkbox = element.querySelector('.task-checkbox');
    const isChecked = checkbox.checked;

    if (isChecked) {
        element.classList.add('completed');
        localStorage.setItem(taskId, 'true');

        // Initialize T0 if not exists
        if (!localStorage.getItem(`${taskId}_srs`)) {
            const t0Stats = {
                interval: GATE_DATA.srsConfig.t0Interval,
                ease: GATE_DATA.srsConfig.defaultEase,
                reps: 0
            };
            localStorage.setItem(`${taskId}_srs`, JSON.stringify(t0Stats));

            const dueDate = new Date();
            dueDate.setHours(dueDate.getHours() + 12); // Due in 12 hours
            localStorage.setItem(`${taskId}_due`, dueDate.toISOString());
        }
    } else {
        element.classList.remove('completed');
        localStorage.removeItem(taskId);
        localStorage.removeItem(`${taskId}_srs`);
        localStorage.removeItem(`${taskId}_due`);
    }

    updateCurrentStatus();
    renderRevisionDashboard();
}

// --- Error Log Logic ---

function setupEventListeners() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(`${btn.dataset.tab}-view`).classList.add('active');
        });
    });

    document.getElementById('shift-select').addEventListener('change', (e) => {
        const shift = e.target.value;
        localStorage.setItem('gate_shift', shift);
        renderDailyPlan(shift);
    });

    document.getElementById('error-form').addEventListener('submit', (e) => {
        e.preventDefault();
        addError();
    });

    // SRS Filter Listeners
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filterType = btn.dataset.filter;
            const filterDate = document.getElementById('revision-date-filter').value;
            renderRevisionDashboard(filterType, filterDate);
        });
    });

    document.getElementById('revision-date-filter').addEventListener('change', (e) => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        // No button active when date selected, or maybe add a visual indicator
        renderRevisionDashboard('date', e.target.value);
    });
}

function addError() {
    const date = document.getElementById('error-date').value;
    const topic = document.getElementById('error-topic').value;
    const type = document.getElementById('error-type').value;
    const reason = document.getElementById('error-reason').value;
    const retestDate = document.getElementById('error-retest-date').value;

    const error = {
        id: Date.now(),
        date,
        topic,
        type,
        reason,
        retestDate,
        status: 'pending'
    };

    const errors = JSON.parse(localStorage.getItem('gate_errors') || '[]');
    errors.unshift(error);
    localStorage.setItem('gate_errors', JSON.stringify(errors));

    renderError(error);
    document.getElementById('error-form').reset();
}

function loadErrors() {
    const errors = JSON.parse(localStorage.getItem('gate_errors') || '[]');
    const container = document.getElementById('error-list');
    container.innerHTML = '';
    errors.forEach(renderError);
}

function renderError(error) {
    const container = document.getElementById('error-list');
    const card = document.createElement('div');
    card.className = 'error-card';

    const retestDateObj = new Date(error.retestDate);
    const now = new Date();
    const isDue = now >= retestDateObj;

    card.innerHTML = `
        <div class="error-header">
            <span class="error-topic">${error.topic}</span>
            <span class="error-type">${error.type}</span>
        </div>
        <div class="error-details">
            <p><strong>Date:</strong> ${error.date}</p>
            <p><strong>Reason:</strong> ${error.reason}</p>
        </div>
        <div class="retest-info">
            <span class="retest-date">Retest: ${error.retestDate}</span>
            <span class="retest-status" style="color: ${isDue ? 'var(--accent-success)' : 'var(--text-secondary)'}">
                ${isDue ? 'READY TO RETEST' : 'WAITING'}
            </span>
        </div>
    `;
    container.prepend(card);
}

// --- Feedback System ---

function loadFeedback() {
    const comments = JSON.parse(localStorage.getItem('gate_feedback') || '[]');
    const container = document.getElementById('feedback-list');
    container.innerHTML = '';

    comments.forEach((comment, index) => {
        const div = document.createElement('div');
        div.className = 'feedback-item';
        div.style.cssText = 'background:var(--bg-primary); padding:1rem; border-radius:8px; margin-bottom:0.5rem; border-left: 3px solid var(--accent-warning); display:flex; justify-content:space-between; align-items:center;';

        div.innerHTML = `
            <div>
                <span style="font-size:0.8rem; color:var(--text-secondary);">${new Date(comment.date).toLocaleString()}</span>
                <p style="margin-top:0.5rem;">${comment.text}</p>
            </div>
            <button onclick="deleteFeedback(${index})" style="background:none; border:none; color:var(--accent-danger); cursor:pointer; font-size:1.2rem;">&times;</button>
        `;
        container.prepend(div);
    });
}

document.getElementById('feedback-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('feedback-input');
    const text = input.value.trim();
    if (!text) return;

    const comments = JSON.parse(localStorage.getItem('gate_feedback') || '[]');
    comments.push({
        text: text,
        date: new Date().toISOString()
    });

    localStorage.setItem('gate_feedback', JSON.stringify(comments));
    input.value = '';
    loadFeedback();
});

window.deleteFeedback = function (index) {
    const comments = JSON.parse(localStorage.getItem('gate_feedback') || '[]');
    comments.splice(index, 1);
    localStorage.setItem('gate_feedback', JSON.stringify(comments));
    loadFeedback();
};

window.copyFeedback = function () {
    const comments = JSON.parse(localStorage.getItem('gate_feedback') || '[]');
    if (comments.length === 0) {
        alert("No comments to copy!");
        return;
    }

    const textToCopy = "Here is my feedback on the app:\n\n" + comments.map(c => `- ${c.text}`).join('\n');

    navigator.clipboard.writeText(textToCopy).then(() => {
        alert("Feedback copied to clipboard! Paste it in the chat.");
    }).catch(err => {
        console.error('Failed to copy: ', err);
        alert("Failed to copy automatically. Please manually copy the text.");
    });
};

// Initialize Feedback
loadFeedback();
