document.addEventListener('DOMContentLoaded', () => {
    displaySummary();
});

function displaySummary() {
    const summaryResults = document.getElementById('summaryResults');
    summaryResults.innerHTML = '';

    const totalGoal = parseFloat(localStorage.getItem('totalGoal')) || 0;
    const sellers = JSON.parse(localStorage.getItem('sellers')) || [];
    const absences = JSON.parse(localStorage.getItem('absences')) || [];
    const sales = JSON.parse(localStorage.getItem('sales')) || {};

    const monthlyGoalPerSeller = totalGoal / sellers.length;

    sellers.forEach(seller => {
        const workedDays = Object.keys(sales[seller] || {}).length;
        const absencesCount = absences.filter(absence => absence.seller === seller).length;
        const justifiedAbsencesCount = absences.filter(absence => absence.seller === seller && absence.justification).length;
        const unjustifiedAbsencesCount = absencesCount - justifiedAbsencesCount;

        const totalAchievedForSeller = Object.values(sales[seller] || {}).reduce((a, b) => a + b, 0);
        const percentageAchieved = (totalAchievedForSeller / monthlyGoalPerSeller) * 100;

        summaryResults.innerHTML += `
            <div><strong>Nome do Vendedor:</strong> ${seller}</div>
            <div><strong>Dias Trabalhados:</strong> ${workedDays}</div>
            <div><strong>Faltas Com Justificativas:</strong> ${justifiedAbsencesCount}</div>
            <div><strong>Faltas Sem Justificativas:</strong> ${unjustifiedAbsencesCount}</div>
            <div><strong>Percentual Alcançado:</strong> ${percentageAchieved.toFixed(2)}%</div>
            <hr>
        `;
    });
}
