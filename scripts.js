let totalGoal = 0;
let workingDays = 0;
let sellers = [];
let dailyGoals = {}; // { 'YYYY-MM-DD': { seller1: goal, seller2: goal, ... }, ... }
let absences = []; // { date: 'YYYY-MM-DD', seller: 'sellerName', justification: 'justification' }
let sales = {}; // { 'sellerName': { 'YYYY-MM-DD': amount, ... }, ... }

document.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
    updateSellerList();
    displayCalendar();
    displayDailyGoals();
});

function setMonthlyGoal() {
    totalGoal = parseFloat(document.getElementById('totalGoal').value);
    workingDays = calculateWorkingDays();
    dailyGoals = generateDailyGoals();
    saveToLocalStorage();
    document.getElementById('sellerSection').style.display = 'block';
    document.getElementById('absenceSection').style.display = 'block';
    displayCalendar();
    displayDailyGoals();
}

function addSeller() {
    const sellerName = document.getElementById('sellerName').value.trim();
    if (sellerName && !sellers.includes(sellerName)) {
        sellers.push(sellerName);
        sales[sellerName] = {};
        dailyGoals = generateDailyGoals();
        document.getElementById('sellerName').value = '';
        updateSellerList();
        displayCalendar();
        displayDailyGoals();
        saveToLocalStorage();
    }
}

function removeSeller(sellerName) {
    sellers = sellers.filter(seller => seller !== sellerName);
    Object.keys(dailyGoals).forEach(date => {
        delete dailyGoals[date][sellerName];
    });
    absences = absences.filter(absence => absence.seller !== sellerName);
    delete sales[sellerName];
    updateSellerList();
    displayCalendar();
    displayDailyGoals();
    saveToLocalStorage();
}

function updateSellerList() {
    const sellerList = document.getElementById('sellerList');
    const absentSellerSelect = document.getElementById('absentSeller');
    sellerList.innerHTML = '';
    absentSellerSelect.innerHTML = '<option value="" disabled selected>Selecione o vendedor</option>';
    
    sellers.forEach(seller => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${seller}</span>
            <button onclick="removeSeller('${seller}')">
                <i class="fas fa-times"></i>
            </button>
        `;
        sellerList.appendChild(li);

        // Adiciona opção ao select
        const option = document.createElement('option');
        option.value = seller;
        option.textContent = seller;
        absentSellerSelect.appendChild(option);
    });
}

function displayCalendar() {
    const calendarContainer = document.getElementById('calendarContainer');
    calendarContainer.innerHTML = '';
    
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    let date = firstDay;

    while (date <= lastDay) {
        if (date.getDay() !== 0) { // Exclui domingos
            const dateString = date.toISOString().split('T')[0];
            const dayCell = document.createElement('div');
            dayCell.className = 'calendar-day';
            dayCell.innerHTML = `
                <div><strong>${date.getDate()}</strong></div>
                <div>Data: ${dateString}</div>
                <div>
                    ${sellers.map(seller => `
                        <div>
                            <div><strong>${seller}</strong></div>
                            <div>Meta Diária: ${formatCurrency(dailyGoals[dateString]?.[seller] || 0)}</div>
                            <div>Meta Alcançada: <input type="number" value="${sales[seller]?.[dateString] || 0}" onchange="updateSales('${seller}', '${dateString}', this.value)"></div>
                        </div>
                    `).join('')}
                </div>
            `;
            calendarContainer.appendChild(dayCell);
        }
        date.setDate(date.getDate() + 1);
    }
}

function updateSales(seller, date, value) {
    if (!sales[seller]) sales[seller] = {};
    sales[seller][date] = parseFloat(value);
    saveToLocalStorage();
}

function calculateWorkingDays() {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    let workingDaysCount = 0;
    for (let date = firstDay; date <= lastDay; date.setDate(date.getDate() + 1)) {
        if (date.getDay() !== 0) { // Exclui domingos
            workingDaysCount++;
        }
    }
    return workingDaysCount;
}

function generateDailyGoals() {
    const dailyGoals = {};
    const numSellers = sellers.length;
    const dailyGoalAmount = totalGoal / workingDays / numSellers;

    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    let date = firstDay;

    while (date <= lastDay) {
        if (date.getDay() !== 0) { // Exclui domingos
            const dateString = date.toISOString().split('T')[0];
            dailyGoals[dateString] = {};

            sellers.forEach(seller => {
                dailyGoals[dateString][seller] = dailyGoalAmount;
            });
        }
        date.setDate(date.getDate() + 1);
    }

    return dailyGoals;
}

function registerAbsence() {
    const absenceDate = document.getElementById('absenceDate').value;
    const absentSeller = document.getElementById('absentSeller').value;
    const justification = document.getElementById('justification').value.trim();

    if (sellers.includes(absentSeller)) {
        absences.push({ date: absenceDate, seller: absentSeller, justification });
        adjustDailyGoals(absentSeller, absenceDate, justification);
        saveToLocalStorage();
        displayCalendar();
        displayDailyGoals();
        calculateBalance();
    } else {
        alert('Vendedor não encontrado.');
    }
}

function adjustDailyGoals(seller, date, justification) {
    const numSellers = sellers.length;
    const missedGoal = dailyGoals[date]?.[seller] || 0;

    if (justification) {
        // Falta com justificativa
        delete dailyGoals[date][seller];
        sellers.forEach(otherSeller => {
            if (otherSeller !== seller) {
                dailyGoals[date][otherSeller] = (dailyGoals[date][otherSeller] || 0) + missedGoal / (numSellers - 1);
            }
        });
    } else {
        // Falta sem justificativa
        delete dailyGoals[date][seller];

        // Diluição da meta do dia
        sellers.forEach(otherSeller => {
            if (otherSeller !== seller) {
                dailyGoals[date][otherSeller] = (dailyGoals[date][otherSeller] || 0) + missedGoal / (numSellers - 1);
            }
        });

        // Redistribuir a meta faltante para os outros dias
        const remainingDays = Object.keys(dailyGoals).filter(d => d >= date && d !== date && !absences.some(a => a.date === d && a.seller === seller)).length;
        const dailyAdjustment = missedGoal / remainingDays;

        Object.keys(dailyGoals).forEach(d => {
            if (d > date && !absences.some(a => a.date === d && a.seller === seller)) {
                dailyGoals[d][seller] = (dailyGoals[d][seller] || 0) + dailyAdjustment;
            }
        });
    }
}

function calculateBalance() {
    const balanceResults = document.getElementById('balanceResults');
    balanceResults.innerHTML = '';

    const monthlyGoalPerSeller = totalGoal / sellers.length;

    sellers.forEach(seller => {
        const workedDays = Object.keys(dailyGoals).filter(date => sales[seller]?.[date] > 0).length;
        const absencesCount = absences.filter(absence => absence.seller === seller).length;

        const totalGoalForSeller = workedDays * (totalGoal / workingDays / sellers.length);
        const totalAchievedForSeller = Object.values(sales[seller] || {}).reduce((a, b) => a + b, 0);
        const idealMonthlyGoal = monthlyGoalPerSeller;
        const percentageAchieved = (totalAchievedForSeller / idealMonthlyGoal) * 100;

        balanceResults.innerHTML += `
            <div><strong>Nome do Vendedor:</strong> ${seller}</div>
            <div><strong>Dias Trabalhados:</strong> ${workedDays}</div>
            <div><strong>Faltas:</strong> ${absencesCount}</div>
            <div><strong>Meta Ideal Mensal:</strong> ${formatCurrency(idealMonthlyGoal)}</div>
            <div><strong>Meta Alcançada:</strong> ${formatCurrency(totalAchievedForSeller)}</div>
            <div><strong>Percentual da Meta Ideal Alcançada:</strong> ${percentageAchieved.toFixed(2)}%</div>
            <hr>
        `;
    });
}

function formatCurrency(value) {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

function saveToLocalStorage() {
    localStorage.setItem('totalGoal', totalGoal);
    localStorage.setItem('workingDays', workingDays);
    localStorage.setItem('sellers', JSON.stringify(sellers));
    localStorage.setItem('dailyGoals', JSON.stringify(dailyGoals));
    localStorage.setItem('absences', JSON.stringify(absences));
    localStorage.setItem('sales', JSON.stringify(sales));
}

function loadFromLocalStorage() {
    totalGoal = parseFloat(localStorage.getItem('totalGoal')) || 0;
    workingDays = parseInt(localStorage.getItem('workingDays')) || 0;
    sellers = JSON.parse(localStorage.getItem('sellers')) || [];
    dailyGoals = JSON.parse(localStorage.getItem('dailyGoals')) || {};
    absences = JSON.parse(localStorage.getItem('absences')) || [];
    sales = JSON.parse(localStorage.getItem('sales')) || {};
}
