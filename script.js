const tempElem = document.getElementById('temperature');
const humElem = document.getElementById('humidity');

let tempChart = null;
let humChart = null;

const bufferedTempLabels = [];
const bufferedTempData = [];
const bufferedHumLabels = [];
const bufferedHumData = [];

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
                    title: { display: true},
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
                    title: { display: true,
                        padding: { top: 10}
                     },
                    ticks: { maxRotation: 45, minRotation: 45 }
                }
            }
        }
    });
}

let lastTempTimestamp = null;
let lastHumTimestamp = null;

async function fetchCSVAndUpdate() {
    try {
        const response = await fetch("sensor_data.csv");
        const csvText = await response.text();
        const lines = csvText.trim().split("\n");

        const tempLabels = tempChart ? tempChart.data.labels : bufferedTempLabels;
        const tempData = tempChart ? tempChart.data.datasets[0].data : bufferedTempData;

        const humLabels = humChart ? humChart.data.labels : bufferedHumLabels;
        const humData = humChart ? humChart.data.datasets[0].data : bufferedHumData;

        for (let i = 1; i < lines.length; i++) { 
            const parts = lines[i].split(",");
            if (parts.length < 3) continue;

            const timestamp = parts[0];
            const temperature = parseFloat(parts[1]);
            const humidity = parseFloat(parts[2]);

            if (!isNaN(temperature) && timestamp !== lastTempTimestamp) {
                tempLabels.push(timestamp);
                tempData.push(temperature);
                lastTempTimestamp = timestamp;
                if (tempLabels.length > 20) {
                    tempLabels.shift();
                    tempData.shift();
                }
            }

            if (!isNaN(humidity) && timestamp !== lastHumTimestamp) {
                humLabels.push(timestamp);
                humData.push(humidity);
                lastHumTimestamp = timestamp;
                if (humLabels.length > 20) {
                    humLabels.shift();
                    humData.shift();
                }
            }
        }

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
