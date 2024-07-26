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
    populateSellerDropdown();
});

function setMonthlyGoal() {
    totalGoal = parseFloat(document.getElementById('totalGoal').value);
    workingDays = calculateWorkingDays();
    dailyGoals = generateDailyGoals();
    saveToLocalStorage();
    document.getElementById('sellerSection').style.display = 'block';
    displayCalendar();
}

function showDailyGoals() {
    document.getElementById('sellerSection').style.display = 'block';
    displayCalendar();
}

function addSeller() {
    const sellerName = document.getElementById('sellerName').value.trim();
    if (sellerName && !sellers.includes(sellerName)) {
        sellers.push(sellerName);
        sales[sellerName] = {};
        dailyGoals = generateDailyGoals();
        document.getElementById('sellerName').value = '';
        updateSellerList();
        populateSellerDropdown();
        displayCalendar();
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
    saveToLocalStorage();
}

function updateSellerList() {
    const sellerList = document.getElementById('sellerList');
    sellerList.innerHTML = '';
    sellers.forEach(seller => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${seller}</span>
            <button onclick="removeSeller('${seller}')">
                <i class="fas fa-trash-alt"></i> X
            </button>
        `;
        sellerList.appendChild(li);
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
                            <strong>${seller}</strong>
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
    const absentSeller = document.getElementById('absentSeller').value.trim();
    const justification = document.getElementById('justification').value.trim();

    if (absenceDate && absentSeller) {
        absences.push({
            date: absenceDate,
            seller: absentSeller,
            justification: justification || null
        });

        document.getElementById('absenceDate').value = '';
        document.getElementById('absentSeller').value = '';
        document.getElementById('justification').value = '';
        saveToLocalStorage();
    }
}

function populateSellerDropdown() {
    const absentSellerSelect = document.getElementById('absentSeller');
    absentSellerSelect.innerHTML = '<option value="" disabled selected>Selecione o vendedor</option>';

    sellers.forEach(seller => {
        const option = document.createElement('option');
        option.value = seller;
        option.textContent = seller;
        absentSellerSelect.appendChild(option);
    });
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

    document.getElementById('totalGoal').value = totalGoal;
    updateSellerList();
    populateSellerDropdown();
    displayCalendar();
}

function formatCurrency(amount) {
    return amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
