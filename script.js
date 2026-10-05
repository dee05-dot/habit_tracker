document.addEventListener('DOMContentLoaded', () => {

    // FAQ Accordion Toggle
    const faqButtons = document.querySelectorAll('.faq-question');
    if (faqButtons.length > 0) {
        faqButtons.forEach(button => {
            button.addEventListener('click', () => {
                const faqItem = button.parentElement;
                document.querySelectorAll('.faq-item').forEach(item => {
                    if (item !== faqItem) item.classList.remove('active');
                });
                faqItem.classList.toggle('active');
            });
        });
    }

    // Add Habit Button Navigation
    const addHabitBtn = document.getElementById('addHabitBtn');
    if (addHabitBtn) {
        addHabitBtn.addEventListener('click', () => {
            window.location.href = 'home.html';
        });
    }
    const tasksContainer = document.getElementById('tasksContainer');
    if (!tasksContainer) return; // Exit dashboard logic if running on landing page

    // Data Store
    let tasksData = JSON.parse(localStorage.getItem('habit_tracker_tasks')) || {};
    let selectedDateStr = getFormattedDate(new Date());
    let currentDatePointer = new Date();

    function saveData() {
        localStorage.setItem('habit_tracker_tasks', JSON.stringify(tasksData));
    }

    function getFormattedDate(dateObj) {
        return dateObj.toISOString().split('T')[0];
    }

    // Right Sidebar Navigation
    const navButtons = document.querySelectorAll('.nav-icon-btn');
    const views = document.querySelectorAll('.view-section');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetView = btn.getAttribute('data-view');

            navButtons.forEach(b => b.classList.remove('active'));
            views.forEach(v => v.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(targetView).classList.add('active');

            if (targetView === 'view-calendar') renderCalendar();
            if (targetView === 'view-report') renderYearlyReport();
        });
    });

    // Date Strip Header
    function renderDateStrip() {
        const dateStrip = document.getElementById('dateStrip');
        if (!dateStrip) return;
        dateStrip.innerHTML = '';

        for (let i = -3; i <= 3; i++) {
            const d = new Date(currentDatePointer);
            d.setDate(d.getDate() + i);

            const dateStr = getFormattedDate(d);
            const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
            const dayNum = d.getDate();

            const pill = document.createElement('div');
            pill.className = `date-pill ${dateStr === selectedDateStr ? 'active' : ''}`;
            pill.innerHTML = `
                <div class="day-name">${dayName}</div>
                <div class="day-num">${dayNum}</div>
            `;

            pill.addEventListener('click', () => {
                selectedDateStr = dateStr;
                renderDateStrip();
                renderDailyTasks();
            });

            dateStrip.appendChild(pill);
        }

        const readableDate = new Date(selectedDateStr).toLocaleDateString('en-US', {
            weekday: 'long', month: 'short', day: 'numeric', year: 'numeric'
        });
        document.getElementById('selectedDateText').innerText = readableDate;
    }

    document.getElementById('prevDateBtn')?.addEventListener('click', () => {
        currentDatePointer.setDate(currentDatePointer.getDate() - 1);
        renderDateStrip();
    });

    document.getElementById('nextDateBtn')?.addEventListener('click', () => {
        currentDatePointer.setDate(currentDatePointer.getDate() + 1);
        renderDateStrip();
    });

    // Daily Task Display & Interactions
    function renderDailyTasks() {
        tasksContainer.innerHTML = '';
        const daysTasks = tasksData[selectedDateStr] || [];

        if (daysTasks.length === 0) {
            tasksContainer.innerHTML = `
                <div class="empty-state">
                    <p>No habits or tasks set for this day yet.</p>
                    <button class="add-btn-primary" id="centerAddBtn">+ Add Task</button>
                </div>
            `;
            document.getElementById('centerAddBtn').onclick = openTaskModal;
        } else {
            const listEl = document.createElement('div');
            listEl.className = 'task-list';

            daysTasks.forEach((task, index) => {
                const item = document.createElement('div');
                item.className = `task-item ${task.completed ? 'completed' : ''}`;
                item.innerHTML = `
                    <div class="task-left">
                        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} data-index="${index}">
                        <span class="task-title">${task.title}</span>
                    </div>
                    <button class="delete-btn" data-index="${index}">&times;</button>
                `;
                listEl.appendChild(item);
            });

            tasksContainer.appendChild(listEl);

            const bottomBtn = document.createElement('button');
            bottomBtn.className = 'add-btn-primary add-btn-bottom';
            bottomBtn.innerText = '+ Add Task';
            bottomBtn.onclick = openTaskModal;
            tasksContainer.appendChild(bottomBtn);

            // Bind checkbox & delete events
            listEl.querySelectorAll('.task-checkbox').forEach(cb => {
                cb.addEventListener('change', (e) => {
                    const idx = e.target.getAttribute('data-index');
                    tasksData[selectedDateStr][idx].completed = e.target.checked;
                    saveData();
                    renderDailyTasks();
                });
            });

            listEl.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const idx = e.target.getAttribute('data-index');
                    tasksData[selectedDateStr].splice(idx, 1);
                    if (tasksData[selectedDateStr].length === 0) delete tasksData[selectedDateStr];
                    saveData();
                    renderDailyTasks();
                });
            });
        }
    }

    // Modal Operations
    const modal = document.getElementById('taskModal');
    const taskInput = document.getElementById('taskInput');

    function openTaskModal() {
        taskInput.value = '';
        modal.classList.add('open');
        taskInput.focus();
    }

    document.getElementById('cancelTaskBtn')?.addEventListener('click', () => {
        modal.classList.remove('open');
    });

    document.getElementById('saveTaskBtn')?.addEventListener('click', () => {
        const title = taskInput.value.trim();
        if (!title) return;

        if (!tasksData[selectedDateStr]) tasksData[selectedDateStr] = [];
        tasksData[selectedDateStr].push({ title, completed: false });

        saveData();
        modal.classList.remove('open');
        renderDailyTasks();
    });

    // Monthly Calendar View
    let calendarDate = new Date();

    function renderCalendar() {
        const year = calendarDate.getFullYear();
        const month = calendarDate.getMonth();

        const monthNames = ["January", "February", "March", "April", "May", "June", 
                            "July", "August", "September", "October", "November", "December"];
        document.getElementById('calendarMonthYear').innerText = `${monthNames[month]} ${year}`;

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const grid = document.getElementById('calendarGrid');
        grid.innerHTML = '';

        for (let i = 0; i < firstDay; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'cal-day-cell empty';
            grid.appendChild(emptyCell);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const formattedDay = String(day).padStart(2, '0');
            const formattedMonth = String(month + 1).padStart(2, '0');
            const dateKey = `${year}-${formattedMonth}-${formattedDay}`;

            const dayTasks = tasksData[dateKey] || [];
            const completedCount = dayTasks.filter(t => t.completed).length;
            const pendingCount = dayTasks.filter(t => !t.completed).length;

            const cell = document.createElement('div');
            cell.className = 'cal-day-cell';
            cell.innerHTML = `
                <div class="cal-day-num">${day}</div>
                <div class="cal-stats">
                    <span class="stat-tag done">✓ ${completedCount} done</span>
                    <span class="stat-tag pending">⏳ ${pendingCount} pend</span>
                </div>
            `;
            grid.appendChild(cell);
        }
    }

    document.getElementById('prevMonthBtn')?.addEventListener('click', () => {
        calendarDate.setMonth(calendarDate.getMonth() - 1);
        renderCalendar();
    });

    document.getElementById('nextMonthBtn')?.addEventListener('click', () => {
        calendarDate.setMonth(calendarDate.getMonth() + 1);
        renderCalendar();
    });

    // Yearly Report View
    function renderYearlyReport() {
        let total = 0;
        let completed = 0;

        Object.values(tasksData).forEach(dayList => {
            dayList.forEach(t => {
                total++;
                if (t.completed) completed++;
            });
        });

        const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

        document.getElementById('totalHabitsStat').innerText = total;
        document.getElementById('completedHabitsStat').innerText = completed;
        document.getElementById('completionRateStat').innerText = `${rate}%`;

        const chart = document.getElementById('barChart');
        chart.innerHTML = '';
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        months.forEach((m, idx) => {
            const height = total > 0 ? Math.min(100, Math.max(15, (completed * (idx + 1)) % 100)) : 10;
            const bar = document.createElement('div');
            bar.className = 'chart-bar-item';
            bar.innerHTML = `
                <div class="bar-fill" style="height: ${height}%;"></div>
                <span class="bar-label">${m}</span>
            `;
            chart.appendChild(bar);
        });
    }

    // Stopwatch Controls
    let timerInterval = null;
    let secondsElapsed = 0;

    const timerDisplay = document.getElementById('timerDisplay');
    const startStopBtn = document.getElementById('startStopBtn');
    const resetTimerBtn = document.getElementById('resetTimerBtn');

    function formatTimer(s) {
        const hrs = String(Math.floor(s / 3600)).padStart(2, '0');
        const mins = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
        const secs = String(s % 60).padStart(2, '0');
        return `${hrs}:${mins}:${secs}`;
    }

    startStopBtn?.addEventListener('click', () => {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
            startStopBtn.innerText = 'Start';
            startStopBtn.classList.remove('secondary');
            startStopBtn.classList.add('start');
        } else {
            timerInterval = setInterval(() => {
                secondsElapsed++;
                timerDisplay.innerText = formatTimer(secondsElapsed);
            }, 1000);
            startStopBtn.innerText = 'Pause';
            startStopBtn.classList.remove('start');
            startStopBtn.classList.add('secondary');
        }
    });

    resetTimerBtn?.addEventListener('click', () => {
        clearInterval(timerInterval);
        timerInterval = null;
        secondsElapsed = 0;
        timerDisplay.innerText = '00:00:00';
        startStopBtn.innerText = 'Start';
        startStopBtn.classList.remove('secondary');
        startStopBtn.classList.add('start');
    });

    // Initial Dashboard Render
    renderDateStrip();
    renderDailyTasks();
});