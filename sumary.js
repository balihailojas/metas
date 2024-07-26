document.addEventListener('DOMContentLoaded', () => {
    openDatabase();
    displaySummary();
});

function openDatabase() {
    const request = indexedDB.open('MetasVendedoresDB', 1);

    request.onsuccess = function(event) {
        db = event.target.result;
        displaySummary();
    };

    request.onerror = function(event) {
        console.error('Erro ao abrir o banco de dados:', event.target.errorCode);
    };
}

function displaySummary() {
    const summaryList = document.getElementById('summaryList');
    summaryList.innerHTML = '';

    getSellers((sellers) => {
        getDailyGoals((dailyGoals) => {
            sellers.forEach(seller => {
                const li = document.createElement('li');
                const totalAbsences = getTotalAbsences(seller.id, dailyGoals);
                const totalDays = getTotalDays(seller.id, dailyGoals);
                const percentageAchieved = calculatePercentageAchieved(totalAbsences, totalDays);
                li.innerHTML = `
                    <h3>${seller.name}</h3>
                    <p>Dias Trabalhados: ${totalDays}</p>
                    <p>Faltas Com Justificativas: ${getAbsences(seller.id, dailyGoals, true)}</p>
                    <p>Faltas Sem Justificativas: ${getAbsences(seller.id, dailyGoals, false)}</p>
                    <p>Percentual Alcançado: ${percentageAchieved.toFixed(2)}%</p>
                `;
                summaryList.appendChild(li);
            });
        });
    });
}

function getTotalAbsences(sellerId, dailyGoals) {
    return dailyGoals.filter(goal => goal.sellerId === sellerId && goal.justification).length;
}

function getTotalDays(sellerId, dailyGoals) {
    return dailyGoals.filter(goal => goal.sellerId === sellerId).length;
}

function getAbsences(sellerId, dailyGoals, withJustification) {
    return dailyGoals.filter(goal => goal.sellerId === sellerId && !!goal.justification === withJustification).length;
}

function calculatePercentageAchieved(totalAbsences, totalDays) {
    return (totalAbsences / totalDays) * 100;
}
