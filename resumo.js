document.addEventListener('DOMContentLoaded', () => {
    loadSummaryData();
});

function loadSummaryData() {
    const summaryResults = document.getElementById('summaryResults');
    summaryResults.innerHTML = '';

    const totalGoal = parseFloat(localStorage.getItem('totalGoal')) || 0;
    const workingDays = parseInt(localStorage.getItem('workingDays')) || 0;
    const sellers = JSON.parse(localStorage.getItem('sellers')) || [];
    const dailyGoals = JSON.parse(localStorage.getItem('dailyGoals')) || {};
    const absences = JSON.parse(localStorage.getItem('absences')) || [];
    const sales = JSON.parse(localStorage.getItem('sales')) || {};

    sellers.forEach(seller => {
        const totalSales = Object.values(sales[seller] || {}).reduce((sum, value) => sum + value, 0);
        const workedDays = workingDays - absences.filter(a => a.seller === seller && !a.justification).length;
        const justifiedAbsences = absences.filter(a => a.seller === seller && a.justification).length;
        const unjustifiedAbsences = absences.filter(a => a.seller === seller && !a.justification).length;
        const goalPercentage = (totalSales / totalGoal) * 100;

        summaryResults.innerHTML += `
            <div>
                <h3>${seller}</h3>
                <p>Dias Trabalhados: ${workedDays}</p>
                <p>Faltas Com Justificativas: ${justifiedAbsences}</p>
                <p>Faltas Sem Justificativas: ${unjustifiedAbsences}</p>
                <p>Percentual Alcançado: ${goalPercentage.toFixed(2)}%</p>
            </div>
        `;
    });
}
