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
      // Persister la sélection pour retrouver l'appareil au rechargement
      try {
        const cu = JSON.parse(localStorage.getItem("currentUser") || "null");
        if (cu) { cu.selectedDevice = selectedDevice; localStorage.setItem("currentUser", JSON.stringify(cu)); }
      } catch (err) { /* ignore */ }

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
 
// On n'utilise plus de compteur incrémental ; on reconstruit les séries à chaque appel
 
function resetCharts() {
  bufferedTempLabels.length = 0;
  bufferedTempData.length = 0;
  bufferedHumLabels.length = 0;
  bufferedHumData.length = 0;
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

    // Reconstruire complètement les séries à partir du fichier CSV pour l'appareil sélectionné
    const tempLabelsAll = [];
    const tempDataAll = [];
    const humLabelsAll = [];
    const humDataAll = [];

    // Si la première ligne ressemble à un en-tête, commencer après
    const startIndex = (lines[0] && (lines[0].toLowerCase().includes('timestamp') || lines[0].toLowerCase().includes('time'))) ? 1 : 0;
    for (let i = startIndex; i < lines.length; i++) {
      const parts = lines[i].split(",").map(s => s.trim());
      if (parts.length < 2) continue;

      const timestamp = parts[0];
      // le code d'appairage est la dernière colonne
      const deviceCode = (parts[3] || parts[parts.length - 1] || "").trim();

      if (!selectedDevice || deviceCode !== selectedDevice) continue;

      const raw1 = parts[1] || "";
      const raw2 = parts[2] || "";
      const v1 = parseFloat(raw1);
      const v2 = parseFloat(raw2);
      const t2 = String(raw2).toLowerCase();

      // Cas: ligne avec type explicite en colonne 3 ("temperature" / "humidity")
      if (t2 === 'temperature' || t2 === 'humidity') {
        if (!isNaN(v1)) {
          if (t2 === 'temperature') { tempLabelsAll.push(timestamp); tempDataAll.push(v1); }
          else { humLabelsAll.push(timestamp); humDataAll.push(v1); }
        }
      } else {
        // Cas: colonne 2 = temperature (nombre) et colonne 3 vide
        if (!isNaN(v1)) {
          tempLabelsAll.push(timestamp);
          tempDataAll.push(v1);
        }
        // Cas: colonne 3 contient humidity (nombre)
        if (!isNaN(v2)) {
          humLabelsAll.push(timestamp);
          humDataAll.push(v2);
        }
      }
    }

    // Garder les 40 dernières entrées
    const keep = 40;
    const tempLabels = tempLabelsAll.slice(-keep);
    const tempData = tempDataAll.slice(-keep);
    const humLabels = humLabelsAll.slice(-keep);
    const humData = humDataAll.slice(-keep);

    // Mettre à jour les buffers ou les charts
    if (tempChart) {
      tempChart.data.labels = tempLabels.slice();
      tempChart.data.datasets[0].data = tempData.slice();
    } else {
      bufferedTempLabels.length = 0; bufferedTempLabels.push(...tempLabels);
      bufferedTempData.length = 0; bufferedTempData.push(...tempData);
    }

    if (humChart) {
      humChart.data.labels = humLabels.slice();
      humChart.data.datasets[0].data = humData.slice();
    } else {
      bufferedHumLabels.length = 0; bufferedHumLabels.push(...humLabels);
      bufferedHumData.length = 0; bufferedHumData.push(...humData);
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