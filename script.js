const tempElem = document.getElementById('temperature');
const humElem = document.getElementById('humidity');
const userEmailElem = document.getElementById("userEmail");
const deviceSelectElem = document.getElementById("deviceSelect"); // dropdown des appareils
 
// Récupération de l'utilisateur connecté
const currentUserRaw = localStorage.getItem("currentUser");
 
let selectedDevice = null;
 
if (currentUserRaw) {
  const currentUser = JSON.parse(currentUserRaw);
  userEmailElem.textContent = `Connecté en tant que : ${currentUser.name}`;
  userEmailElem.style.color = "white";
 
  // Remplir le dropdown avec les appareils de l'utilisateur
  if (currentUser.devices && currentUser.devices.length > 0) {
    currentUser.devices.forEach(code => {
      const opt = document.createElement("option");
      opt.value = code;
      opt.textContent = `Appareil ${code}`;
      deviceSelectElem.appendChild(opt);
    });
 
    // Sélection par défaut : le premier appareil
    selectedDevice = currentUser.selectedDevice || currentUser.devices[0];
    deviceSelectElem.value = selectedDevice;
 
    // Changement de sélection
    deviceSelectElem.addEventListener("change", (e) => {
      selectedDevice = e.target.value;
      resetCharts();
      fetchCSVAndUpdate(); // relance immédiate pour fluidité
    });
  } else {
    alert("Aucun appareil appairé. Ajoutez un code d’appairage.");
    window.location.href = "connexion.html";
  }
} else {
  window.location.href = "connexion.html";
}
 
// Déconnexion
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
 
function resetCharts() {
  bufferedTempLabels.length = 0;
  bufferedTempData.length = 0;
  bufferedHumLabels.length = 0;
  bufferedHumData.length = 0;
  lastLineCount = 0;
  if (tempChart) tempChart.destroy();
  if (humChart) humChart.destroy();
  tempChart = null;
  humChart = null;
}
 
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
      animation: {
        duration: 600,
        easing: 'easeOutQuart'
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
      animation: {
        duration: 600,
        easing: 'easeOutQuart'
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
      const deviceCode = parts[3]; // code d’appairage
 
      // Filtrer par appareil sélectionné
      if (deviceCode !== selectedDevice) continue;
 
      if (type === "temperature" && !isNaN(value)) {
        tempLabels.push(timestamp);
        tempData.push(value);
        if (tempLabels.length > 20) { tempLabels.shift(); tempData.shift(); }
      }
 
      if (type === "humidity" && !isNaN(value)) {
        humLabels.push(timestamp);
        humData.push(value);
        if (humLabels.length > 20) { humLabels.shift(); humData.shift(); }
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