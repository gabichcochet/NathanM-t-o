const tempElem = document.getElementById('temperature');
const humElem = document.getElementById('humidity');

const ctx = document.getElementById('chartTemp').getContext('2d');
const chart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [], 
        datasets: [
            {
                label: 'Température (°C)',
                data: [],
                borderColor: 'red',
                borderWidth: 2,
                tension: 0.4,
                fill: false,
                yAxisID: 'yTemp'
            },
            {
                label: 'Humidité (%)',
                data: [],
                borderColor: 'blue',
                borderWidth: 2,
                tension: 0.4,
                fill: false,
                yAxisID: 'yHum'
            }
        ]
    },
    options: {
        responsive: true,
        animation: false,
        interaction: {
            mode: 'index',
            intersect: false
        },
        stacked: false,
        scales: {
            yTemp: {
                type: 'linear',
                position: 'left',
                title: { display: true, text: 'Température (°C)' }
            },
            yHum: {
                type: 'linear',
                position: 'right',
                title: { display: true, text: 'Humidité (%)' },
                grid: { drawOnChartArea: false }
            },
            x: {
                title: { display: true, text: 'Derniers points' },
                ticks: { maxRotation: 45, minRotation: 45 }
            }
        }
    }
});

async function fetchCSVAndUpdate() {
    try {
        const response = await fetch("sensor_data.csv");
        const csvText = await response.text();
        const lines = csvText.trim().split("\n");

        for (let i = 1; i < lines.length; i++) { 
            const parts = lines[i].split(",");
            if (parts.length < 3) continue; 

            const timestamp = parts[0];
            const temperature = parseFloat(parts[1]);
            const humidity = parseFloat(parts[2]);

            if (isNaN(temperature) || isNaN(humidity)) continue; 

            if (chart.data.labels.includes(timestamp)) continue;

            chart.data.labels.push(timestamp);
            chart.data.datasets[0].data.push(temperature);
            chart.data.datasets[1].data.push(humidity);

            if (chart.data.labels.length > 20) {
                chart.data.labels.shift();
                chart.data.datasets[0].data.shift();
                chart.data.datasets[1].data.shift();
            }
        }

        const lastTemp = chart.data.datasets[0].data[chart.data.datasets[0].data.length - 1];
        const lastHum = chart.data.datasets[1].data[chart.data.datasets[1].data.length - 1];
        if (lastTemp !== undefined) tempElem.textContent = `${lastTemp} °C`;
        if (lastHum !== undefined) humElem.textContent = `${lastHum} %`;

        chart.update();

    } catch (error) {
        console.error("Erreur CSV:", error);
    }
}

setInterval(fetchCSVAndUpdate, 1000);
fetchCSVAndUpdate();
