const tempElem = document.getElementById('temperature');
const humElem = document.getElementById('humidity');
const userEmailElem = document.getElementById("userEmail");
const currentUser = localStorage.getItem("currentUser");
const currentUserRaw = localStorage.getItem("currentUser");

if (currentUser) {
  const currentUser = JSON.parse(currentUserRaw);
  userEmailElem.textContent = `Connecté en tant que : ${currentUser.name}`;
} else {
  window.location.href = "connexion.html";
}


function logout() {
  localStorage.removeItem("currentUser");
  window.location.href = "connexion.html";
}

let tempChart = null;
let humChart = null;

const bufferedTempLabels = [];
const bufferedTempData = [];
const bufferedHumLabels = [];
const bufferedHumData = [];

let lastLineCount = 0; 

function createCharts() {
    const chartsSection = document.getElementById('chartsSection');
    if (chartsSection) chartsSection.style.display = 'block';

    const ctxTemp = document.getElementById('chartTemp').getContext('2d');
    const ctxHum = document.getElementById('chartHum').getContext('2d');

    tempChart = new Chart(ctxTemp, {
        type: 'line',
        data: {
            labels: bufferedTempLabels.slice(),
            datasets: [{
                label: 'Température (°C)',
                data: bufferedTempData.slice(),
                borderColor: 'red',
                borderWidth: 2,
                tension: 0.4,
                fill: false,
            }]
        },
        options: {
            responsive: true,
            animation: false,
            scales: {
                y: {
                    beginAtZero: false,
                    title: { display: true, text: 'Température (°C)' }
                },
                x: {
                    title: { display: true },
                    ticks: { maxRotation: 45, minRotation: 45 }
                }
            }
        }
    });

    humChart = new Chart(ctxHum, {
        type: 'line',
        data: {
            labels: bufferedHumLabels.slice(),
            datasets: [{
                label: 'Humidité (%)',
                data: bufferedHumData.slice(),
                borderColor: 'blue',
                borderWidth: 2,
                tension: 0.4,
                fill: false,
            }]
        },
        options: {
            responsive: true,
            animation: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Humidité (%)' }
                },
                x: {
                    title: { display: true, padding: { top: 10 } },
                    ticks: { maxRotation: 45, minRotation: 45 }
                }
            }
        }
    });
}

async function fetchCSVAndUpdate() {
    try {
        const response = await fetch("sensor_data.csv", { cache: "no-store" });
        const csvText = await response.text();
        const lines = csvText.trim().split("\n");

        const tempLabels = tempChart ? tempChart.data.labels : bufferedTempLabels;
        const tempData = tempChart ? tempChart.data.datasets[0].data : bufferedTempData;

        const humLabels = humChart ? humChart.data.labels : bufferedHumLabels;
        const humData = humChart ? humChart.data.datasets[0].data : bufferedHumData;

        for (let i = lastLineCount + 1; i < lines.length; i++) {
            const parts = lines[i].split(",");
            if (parts.length < 4) continue;

            const timestamp = parts[0];
            const value = parseFloat(parts[1]);
            const type = parts[2]; 

            if (type === "temperature" && !isNaN(value)) {
                tempLabels.push(timestamp);
                tempData.push(value);
                if (tempLabels.length > 20) {
                    tempLabels.shift();
                    tempData.shift();
                }
            }

            if (type === "humidity" && !isNaN(value)) {
                humLabels.push(timestamp);
                humData.push(value);
                if (humLabels.length > 20) {
                    humLabels.shift();
                    humData.shift();
                }
            }
        }

        lastLineCount = lines.length - 1;

        if (tempData.length > 0) tempElem.textContent = `${tempData[tempData.length - 1]} °C`;
        if (humData.length > 0) humElem.textContent = `${humData[humData.length - 1]} %`;

        if ((!tempChart || !humChart) && (bufferedTempData.length > 0 || bufferedHumData.length > 0)) {
            createCharts();
        }

        if (tempChart) tempChart.update();
        if (humChart) humChart.update();

    } catch (error) {
        console.error("Erreur CSV:", error);
    }
}

setInterval(fetchCSVAndUpdate, 1000);
fetchCSVAndUpdate();