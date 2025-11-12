const tempElem = document.getElementById('temperature');
const humElem = document.getElementById('humidity');

const ctx = document.getElementById('chartTemp').getContext('2d');
const chart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Température (°C)',
            data: [],
            borderColor: 'red',
            fill: false
        }]
    },
    options: {
        scales: { y: { beginAtZero: false } }
    }
});

async function fetchData() {
    try {
        const response = await fetch('http://192.168.1.100:5000/data');
        const data = await response.json();

        tempElem.textContent = `${data.temperature} °C`;
        humElem.textContent = `${data.humidity} %`;

        const now = new Date().toLocaleTimeString();
        chart.data.labels.push(now);
        chart.data.datasets[0].data.push(data.temperature);

        if (chart.data.labels.length > 20) {
            chart.data.labels.shift();
            chart.data.datasets[0].data.shift();
        }
        chart.update();
    } catch (error) {
        console.error("Erreur récupération données :", error);
    }
    document.addEventListener("DOMContentLoaded", () => {
    const elems = [document.getElementById("temperature"), document.getElementById("humidity")];
    elems.forEach(el => {
        el.addEventListener("mousedown", e => e.preventDefault()); 
    });
});

}

setInterval(fetchData, 2000);
fetchData();
