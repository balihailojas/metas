const dbName = 'MetasVendedoresDB';
const dbVersion = 1; // Versão do banco de dados
let db;

document.addEventListener('DOMContentLoaded', () => {
    openDatabase();
    updateSellerList();
    displayCalendar();
    displayDailyGoals();
});

function openDatabase() {
    const request = indexedDB.open(dbName, dbVersion);

    request.onupgradeneeded = function(event) {
        db = event.target.result;

        if (!db.objectStoreNames.contains('vendedores')) {
            db.createObjectStore('vendedores', { keyPath: 'id', autoIncrement: true });
        }

        if (!db.objectStoreNames.contains('metasDiarias')) {
            db.createObjectStore('metasDiarias', { keyPath: 'data' });
        }
    };

    request.onsuccess = function(event) {
        db = event.target.result;
        loadFromIndexedDB();
    };

    request.onerror = function(event) {
        console.error('Erro ao abrir o banco de dados:', event.target.errorCode);
    };
}

function setMonthlyGoal() {
    const totalGoal = parseFloat(document.getElementById('totalGoal').value);
    const workingDays = calculateWorkingDays();
    const dailyGoals = generateDailyGoals(totalGoal, workingDays);
    saveToIndexedDB();
    document.getElementById('sellerSection').style.display = 'block';
    document.getElementById('resultsSection').style.display = 'block';
    displayCalendar();
    displayDailyGoals();
}

function addSeller() {
    const sellerName = document.getElementById('sellerName').value.trim();
    if (sellerName) {
        const seller = { name: sellerName };
        addSellerToIndexedDB(seller);
        document.getElementById('sellerName').value = '';
        updateSellerList();
        displayCalendar();
        displayDailyGoals();
    }
}

function addSellerToIndexedDB(seller) {
    const transaction = db.transaction(['vendedores'], 'readwrite');
    const objectStore = transaction.objectStore('vendedores');
    objectStore.add(seller);
}

function updateSellerList() {
    const sellerList = document.getElementById('sellerList');
    sellerList.innerHTML = '';
    getSellers((sellers) => {
        sellers.forEach(seller => {
            const li = document.createElement('li');
            li.innerHTML = `
                ${seller.name}
                <button onclick="removeSeller(${seller.id})">
                    <i class="fas fa-times"></i>
                </button>
            `;
            sellerList.appendChild(li);
        });
        updateAbsentSellerSelect();
    });
}

function removeSeller(id) {
    const transaction = db.transaction(['vendedores'], 'readwrite');
    const objectStore = transaction.objectStore('vendedores');
    objectStore.delete(id);
    transaction.oncomplete = function() {
        updateSellerList();
        displayCalendar();
        displayDailyGoals();
        saveToIndexedDB();
    };
}

function updateAbsentSellerSelect() {
    const absentSellerSelect = document.getElementById('absentSeller');
    getSellers((sellers) => {
        absentSellerSelect.innerHTML = '';
        sellers.forEach(seller => {
            const option = document.createElement('option');
            option.value = seller.id;
            option.textContent = seller.name;
            absentSellerSelect.appendChild(option);
        });
    });
}

function registerAbsence() {
    const absenceDate = document.getElementById('absenceDate').value;
    const absentSellerId = document.getElementById('absentSeller').value;
    const justification = document.getElementById('justification').value.trim();

    getSellerById(absentSellerId, (seller) => {
        if (seller) {
            const absence = { date: absenceDate, seller: seller.name, justification };
            addAbsenceToIndexedDB(absence);
            adjustDailyGoals(absentSellerId, absenceDate, justification);
            saveToIndexedDB();
            displayCalendar();
            displayDailyGoals();
            calculateBalance();
        } else {
            alert('Vendedor não encontrado.');
        }
    });
}

function addAbsenceToIndexedDB(absence) {
    const transaction = db.transaction(['metasDiarias'], 'readwrite');
    const objectStore = transaction.objectStore('metasDiarias');
    objectStore.put(absence);
}

function getSellers(callback) {
    const transaction = db.transaction(['vendedores'], 'readonly');
    const objectStore = transaction.objectStore('vendedores');
    const request = objectStore.getAll();

    request.onsuccess = function(event) {
        callback(event.target.result);
    };

    request.onerror = function(event) {
        console.error('Erro ao ler vendedores:', event.target.errorCode);
    };
}

function getSellerById(id, callback) {
    const transaction = db.transaction(['vendedores'], 'readonly');
    const objectStore = transaction.objectStore('vendedores');
    const request = objectStore.get(id);

    request.onsuccess = function(event) {
        callback(event.target.result);
    };

    request.onerror = function(event) {
        console.error('Erro ao ler vendedor:', event.target.errorCode);
    };
}

function getDailyGoals(callback) {
    const transaction = db.transaction(['metasDiarias'], 'readonly');
    const objectStore = transaction.objectStore('metasDiarias');
    const request = objectStore.getAll();

    request.onsuccess = function(event) {
        callback(event.target.result);
    };

    request.onerror = function(event) {
        console.error('Erro ao ler metas diárias:', event.target.errorCode);
    };
}

function saveToIndexedDB() {
    // Save function implemented in specific use cases above
}

function loadFromIndexedDB() {
    getSellers((sellers) => {
        // Initialize sellers list
    });
    getDailyGoals((dailyGoals) => {
        // Initialize daily goals
    });
}
