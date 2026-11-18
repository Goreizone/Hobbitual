// 1. STATE MANAGEMENT


let currentDate = new Date();

let habits = JSON.parse(localStorage.getItem('habits')) || [
    { id: 1, name: 'Sketching', completedDates: [] }
];

let selectedHabitId = habits.length > 0 ? habits[0].id : null;
let progressChart = null;
let yearlyChart = null;

// 2. DOM ELEMENTS

const monthDisplay = document.getElementById('current-month');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');

const habitInput = document.getElementById('habit-input');
const addHabitBtn = document.getElementById('add-hobby');
const habitListEl = document.getElementById('habit-list');

const monthlyStatsEl = document.getElementById('monthly-stats');

const prevYearBtn = document.getElementById('prev-year');
const nextYearBtn = document.getElementById('next-year');

// 3. DATA MANAGEMENT

function saveData() {
    localStorage.setItem('habits', JSON.stringify(habits));
}

// Prevent hobby names from being interpreted as HTML
function escapeHTML(text) {
    return String(text).replace(/[&<>"']/g, character => {
        const entities = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };

        return entities[character];
    });
}

// 4. HOBBY MANAGEMENT

function renderHabits() {
    habitListEl.innerHTML = '';

    habits.forEach(habit => {
        const li = document.createElement('li');

        li.className = `habit-item ${
            habit.id === selectedHabitId ? 'active' : ''
        }`;

        li.innerHTML = `
            <span class="habit-name">${escapeHTML(habit.name)}</span>
            <button class="delete-btn" title="Delete hobby">&times;</button>
        `;

        // Select hobby
        li.addEventListener('click', (e) => {
            if (e.target.closest('.delete-btn'))
                return;

            selectedHabitId = habit.id;

            renderHabits();
            renderMonthlyOverview();
            renderYearlyComparison();
        });

        // Rename hobby by double-clicking its name
        li.querySelector('.habit-name').addEventListener('dblclick', (e) => {
            e.stopPropagation();

            const newName = prompt('Enter the new hobby name:', habit.name);

            if (newName === null)
                return;

            const trimmedName = newName.trim();

            if (!trimmedName) {
                alert('Hobby name cannot be empty.');
                return;
            }

            habit.name = trimmedName;

            saveData();
            renderHabits();
            renderProgressChart();
            renderMatrixTracker();
        });

        // Delete hobby
        li.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.stopPropagation();

            const confirmDelete = confirm(`Are you sure you want to delete "${habit.name}"?`);

            if (!confirmDelete)
                return;

            habits = habits.filter(h => h.id !== habit.id);

            if (selectedHabitId === habit.id) {
                selectedHabitId = habits.length > 0
                    ? habits[0].id
                    : null;
            }

            saveData();

            renderHabits();
            renderProgressChart();
            renderMonthlyOverview();
            renderMatrixTracker();
            renderYearlyComparison();
        });

        habitListEl.appendChild(li);
    });
}


// Add hobby
function addHabit() {

    // Get the hobby name first
    const name = habitInput.value.trim();

    if (!name)
        return;

    // Check if hobby already exists
    const alreadyExists = habits.some(habit =>
        habit.name.toLowerCase() === name.toLowerCase()
    );

    if (alreadyExists) {
        alert('This hobby already exists!');
        return;
    }

    const newHabit = {
        id: Date.now(),
        name: name,
        completedDates: []
    };

    habits.push(newHabit);

    selectedHabitId = newHabit.id;
    habitInput.value = '';

    saveData();

    renderHabits();
    renderProgressChart();
    renderMonthlyOverview();
    renderMatrixTracker();
    renderYearlyComparison();
}

// 5. DAILY PROGRESS GRAPH

function renderProgressChart() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthName = currentDate.toLocaleString('default', {
        month: 'long'
    });

    monthDisplay.textContent = `${monthName} ${year}`;

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const labels = Array.from(
        { length: daysInMonth },
        (_, i) => i + 1
    );

    const dailyCompletions = labels.map(day => {
        const dateString =
            `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        return habits.reduce((total, habit) => {
            return total + (
                habit.completedDates.includes(dateString) ? 1 : 0
            );
        }, 0);
    });

    const canvas = document.getElementById('progress-chart');

    if (progressChart) {
        progressChart.destroy();
    }

    progressChart = new Chart(canvas, {
        type: 'line',

        data: {
            labels: labels,

            datasets: [{
                label: 'Hobbies Completed',
                data: dailyCompletions,
                borderColor: '#4caf50',
                backgroundColor: 'rgba(76, 175, 80, 0.15)',
                fill: true,
                tension: 0.3
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        color: 'white'
                    },
                    title: {
                        display: true,
                        text: 'Completed Hobbies',
                        color: 'white'
                    },
                    grid: {
                        color: '#444'
                    }
                },

                x: {
                    ticks: {
                        stepSize: 1,
                        color: 'white'
                    },
                    title: {
                        display: true,
                        text: 'Day of the Month',
                        color: 'white'
                    },
                    grid: {
                        color: '#444'
                    }
                }
            },

            plugins: {
                legend: {
                    labels: {
                        color: 'white'
                    }
                }
            }
        }
    });
}

// 6. TRACKING

function toggleDate(habitId, dateString) {
    const habit = habits.find(h => h.id === habitId);

    if (!habit)
        return;

    const index = habit.completedDates.indexOf(dateString);

    if (index > -1) {
        // Remove completion
        habit.completedDates.splice(index, 1);
    }
    else{
        // Add completion
        habit.completedDates.push(dateString);
    }

    saveData();

    // Update all affected sections
    renderProgressChart();
    renderMonthlyOverview();
    renderMatrixTracker();
    renderYearlyComparison();
}

// 7. MONTH NAVIGATION

function changeMonth(amount) {
    // Set date to 1 first to avoid skipping months
    currentDate.setDate(1);

    currentDate.setMonth(currentDate.getMonth() + amount);

    renderProgressChart();
    renderMonthlyOverview();
    renderMatrixTracker();
    renderYearlyComparison();
}

prevMonthBtn.addEventListener('click', () => {
    changeMonth(-1);
});

nextMonthBtn.addEventListener('click', () => {
    changeMonth(1);
});

// 8. MONTHLY OVERVIEW

function renderMonthlyOverview() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Get currently selected hobby
    const activeHabit = habits.find(h => h.id === selectedHabitId);

    let totalCheckIns = 0;
    let activeDaysSet = new Set();

    // Only count dates belonging to the selected hobby
    if (activeHabit) {
        activeHabit.completedDates.forEach(dateStr => {
            const [dYear, dMonth] = dateStr.split('-').map(Number);

            if (dYear === year && dMonth - 1 === month) {
                totalCheckIns++;
                activeDaysSet.add(dateStr);
            }
        });
    }

    const completionRate = activeHabit ? Math.round((totalCheckIns / daysInMonth) * 100) : 0;

    monthlyStatsEl.innerHTML = `
        <div class="stat-card">
            <h3>Selected Hobby</h3>
            <p>${activeHabit ? escapeHTML(activeHabit.name) : 'None'}</p>
        </div>

        <div class="stat-card">
            <h3>Active Days</h3>
            <p>${activeDaysSet.size} / ${daysInMonth}</p>
        </div>

        <div class="stat-card">
            <h3>Monthly Consistency</h3>
            <p>${completionRate}%</p>
        </div>
    `;
}

// 9. YEAR NAVIGATION

function changeYear(amount) {
    currentDate.setFullYear(currentDate.getFullYear() + amount);

    renderProgressChart();
    renderMonthlyOverview();
    renderMatrixTracker();
    renderYearlyComparison();
}

prevYearBtn.addEventListener('click', () => {
    changeYear(-1);
});

nextYearBtn.addEventListener('click', () => {
    changeYear(1);
});

// 10. YEARLY COMPARISON

function renderYearlyComparison() {
    const yearlyGridEl = document.getElementById('yearly-grid');
    const comparisonYearEl = document.getElementById('comparison-year');

    const currentYear = currentDate.getFullYear();
    const activeMonthIndex = currentDate.getMonth();

    // Get currently selected hobby
    const activeHabit = habits.find(h => h.id === selectedHabitId);

    comparisonYearEl.textContent = currentYear;
    yearlyGridEl.innerHTML = '';

    const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    monthNames.forEach((name, index) => {
        const daysInThisMonth = new Date(currentYear, index + 1, 0).getDate();

        let monthCheckIns = 0;

        // Only count the selected hobby
        if (activeHabit) {
            activeHabit.completedDates.forEach(dateStr => {
                const [dYear, dMonth] = dateStr.split('-').map(Number);

                if (dYear === currentYear && dMonth - 1 === index) {
                    monthCheckIns++;
                }
            });
        }

        const isCurrent = index === activeMonthIndex;

        const card = document.createElement('div');

        card.className = `month-card ${isCurrent ? 'current-month' : ''}`;

        card.innerHTML = `
            <div class="month-name">${name}</div>
            <div class="month-stats-val">${monthCheckIns} / ${daysInThisMonth}</div>
            <div class="month-subtext">check-ins</div>
        `;

        yearlyGridEl.appendChild(card);
    });

    renderYearlyChart();
}

function renderYearlyChart() {
    const year = currentDate.getFullYear();

    const selectedHabit = habits.find(habit =>
        habit.id === selectedHabitId
    );

    const months = [
        'Jan', 'Feb', 'Mar', 'Apr',
        'May', 'Jun', 'Jul', 'Aug',
        'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const monthlyCompletions = months.map((month, index) => {
        if (!selectedHabit)
            return 0;

        const monthNumber = String(index + 1).padStart(2, '0');
        const prefix = `${year}-${monthNumber}`;

        return selectedHabit.completedDates.filter(date =>
            date.startsWith(prefix)
        ).length;
    });

    const canvas = document.getElementById('yearly-chart');

    if (yearlyChart) {
        yearlyChart.destroy();
    }

    yearlyChart = new Chart(canvas, {
        type: 'line',

        data: {
            labels: months,

            datasets: [{
                label: 'Monthly Check-ins',
                data: monthlyCompletions,
                borderColor: '#4caf50',
                backgroundColor: 'rgba(76, 175, 80, 0.15)',
                fill: true,
                tension: 0.3
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            scales: {
                y: {
                    min: 0,
                    max: 31,
                    ticks: {
                        stepSize: 1,
                        autoSkip: false,
                        color: 'white'
                    },
                    title: {
                        display: true,
                        text: 'Number of Check-ins',
                        color: 'white'
                    },
                    grid: {
                        color: '#444'
                    }
                },
                x: {
                    ticks: {
                        color: 'white'
                    },
                    title: {
                        display: true,
                        text: 'Month',
                        color: 'white'
                    },
                    grid: {
                        color: '#444'
                    }
                }
            },

            layout: {
                padding: {
                    top: 50
                }
            },

            plugins: {
                legend: {
                    labels: {
                        color: 'white'
                    }
                }
            }
        }
    });
}

// 11. MATRIX OVERVIEW

function renderMatrixTracker() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const headerRow = document.getElementById('table-header-row');
    const tableBody = document.getElementById('table-body');

    const totalCells = habits.length * daysInMonth;

    const completedCells = habits.reduce((total, habit) => {
        return total + habit.completedDates.filter(dateStr => {
            const [dYear, dMonth] = dateStr.split('-').map(Number);

            return dYear === year && dMonth - 1 === month;
        }).length;
    }, 0);

    document.getElementById('matrix-progress').textContent =
        `Total Completed: ${completedCells}/${totalCells}`;

    if (!headerRow || !tableBody)
        return;

    // Build table header
    let headerHTML = '<th>HABIT</th>';

    const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    for (let day = 1; day <= daysInMonth; day++) {
        const dayOfWeek = new Date(year, month, day).getDay();

        headerHTML += `
            <th>
                ${day}
                <br>
                <span style="font-size:0.75rem; color:#888;">
                    ${weekdays[dayOfWeek]}
                </span>
            </th>
        `;
    }

    headerRow.innerHTML = headerHTML;

    // Build hobby rows
    let bodyHTML = '';

    habits.forEach(habit => {
        bodyHTML += '<tr>';

        bodyHTML += `
            <td>${escapeHTML(habit.name)}</td>
        `;

        // Build date cells
        for (let day = 1; day <= daysInMonth; day++) {
            const dateString =
                `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            const isCompleted = habit.completedDates.includes(dateString);

            bodyHTML += `
                <td
                    class="check-cell ${isCompleted ? 'completed' : ''}"
                    onclick="toggleDate(${habit.id}, '${dateString}')"
                >
                    ${isCompleted ? '✓' : ''}
                </td>
            `;
        }

        bodyHTML += '</tr>';
    });

    tableBody.innerHTML = bodyHTML;
}

// 12. TAB SWITCHING

const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');

        // Remove active classes
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        // Activate selected tab
        btn.classList.add('active');

        document
            .getElementById(`${targetTab}-tab`)
            .classList.add('active');
    });
});

// 13. EVENT LISTENERS

addHabitBtn.addEventListener('click', addHabit);

habitInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        addHabit();
    }
});

// 14. INITIAL RENDER

renderHabits();
renderProgressChart();
renderMonthlyOverview();
renderMatrixTracker();
renderYearlyComparison();
renderYearlyChart();