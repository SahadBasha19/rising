(() => {
  // --- DOM Selectors ---
  const navItems = document.querySelectorAll('.nav-item');
  const sections = document.querySelectorAll('.content-section');
  const sensorForm = document.querySelector('#sensor-form');
  const pingTimeEl = document.querySelector('#ping-time');
  const sidebarAccEl = document.querySelector('#model-acc');
  const tickerFeed = document.querySelector('#ticker-feed');
  
  // Inputs
  const inputs = {
    rainfall: { slider: document.querySelector('#rainfall-input'), val: document.querySelector('#rainfall-val') },
    cloud_cover: { slider: document.querySelector('#cloud-input'), val: document.querySelector('#cloud-val') },
    river_level: { slider: document.querySelector('#river-input'), val: document.querySelector('#river-val') },
    humidity: { slider: document.querySelector('#humidity-input'), val: document.querySelector('#humidity-val') }
  };
  const stationSelect = document.querySelector('#station-select');
  
  // Gauge Out
  const gaugeFillRing = document.querySelector('#gauge-fill-ring');
  const gaugeWaveBox = document.querySelector('#gauge-wave-box');
  const gaugeWaveFill = document.querySelector('#gauge-wave-fill');
  const riskPctEl = document.querySelector('#risk-pct');
  const riskTextEl = document.querySelector('#risk-text');
  const advisoryText = document.querySelector('#advisory-text');
  
  // Map Elements
  const mapStationDot = document.querySelector('#map-station-dot');
  const riverExpansionPath = document.querySelector('#map-river-flood');
  const mapOverlays = {
    highlands: document.querySelector('#overlay-highlands'),
    industrial: document.querySelector('#overlay-industrial'),
    residential: document.querySelector('#overlay-residential'),
    agricultural: document.querySelector('#overlay-agricultural')
  };

  // Trend Chart Elements
  const trendGraphLine = document.querySelector('#trend-graph-line');

  // Retrain Elements
  const btnRetrain = document.querySelector('#btn-retrain');
  const trainSpinner = document.querySelector('#train-spinner');
  const trainBtnLbl = document.querySelector('#train-btn-lbl');
  const metricAccuracy = document.querySelector('#model-acc-val');
  const metricPrecision = document.querySelector('#model-prec-val');
  const metricRecall = document.querySelector('#model-rec-val');
  const metricF1 = document.querySelector('#model-f1-val');

  // Simulator Elements
  const btnPlay = document.querySelector('#sim-play-btn');
  const btnPause = document.querySelector('#sim-pause-btn');
  const btnReset = document.querySelector('#sim-reset-btn');
  const simIndicator = document.querySelector('#sim-indicator');
  const simProgress = document.querySelector('#sim-progress');
  const simThumb = document.querySelector('#sim-thumb');

  // Safety Elements
  const safetyLevelColor = document.querySelector('#safety-level-color');
  const safetyStatusLbl = document.querySelector('#safety-status-lbl');
  const safetySubLbl = document.querySelector('#safety-sub-lbl');
  const safetyChecklist = document.querySelector('#safety-checklist');
  const shelterCenterDot = document.querySelector('#shelter-center-dot');
  const shelterCenterText = document.querySelector('#shelter-center-text');

  // Logs Elements
  const logsSearchInput = document.querySelector('#logs-search');
  const logsFilterSelect = document.querySelector('#logs-filter-select');
  const btnExportCsv = document.querySelector('#btn-export-csv');
  const btnClearLogs = document.querySelector('#btn-clear-logs');
  const logsTableBody = document.querySelector('#logs-table-body');
  const noLogsState = document.querySelector('#no-logs-state');

  // Chatbot Elements
  const chatbotWidget = document.querySelector('#chatbot-widget');
  const chatHeaderBar = document.querySelector('#chat-header-bar');
  const chatCloseBtn = document.querySelector('#chat-close-btn');
  const chatMessages = document.querySelector('#chat-messages');
  const chatForm = document.querySelector('#chat-form');
  const chatInput = document.querySelector('#chat-input');

  // --- State Configuration ---
  let debounceTimeout = null;
  let simulatorInterval = null;
  let simCurrentStep = 0;
  const simTotalSteps = 28; // 4 steps per day * 7 days
  let simulatedHistory = [];
  let stationOffsets = { alpha: 0, beta: 1.2, gamma: -0.8 };

  // Safety Guidelines Templates
  const safetyChecklists = {
    Low: [
      { id: "l1", task: "Review localized flood maps and verify primary evacuation routes." },
      { id: "l2", task: "Confirm critical safety supply kit is stocked (batteries, clean water)." },
      { id: "l3", task: "Verify telemetry indicators are synched with local district feeds." }
    ],
    Moderate: [
      { id: "m1", task: "Inspect backup energy generators and clear drainage channels.", critical: true },
      { id: "m2", task: "Establish communications logs with District Emergency Management." },
      { id: "m3", task: "Move high-value equipment and documents above anticipated water lines." },
      { id: "m4", task: "Advise residents in Zone D (Agricultural Flats) to prepare shelter paths." }
    ],
    High: [
      { id: "h1", task: "ACTIVATE emergency evacuations for Zone C & Zone D immediately.", critical: true },
      { id: "h2", task: "Establish 24-hour flood control room monitoring protocols.", critical: true },
      { id: "h3", task: "Direct delta emergency teams to designated shelter centers." },
      { id: "h4", task: "Shut down municipal power systems in low-elevation sub-grids." }
    ]
  };

  // Chatbot QA Rules
  const chatbotReplies = {
    evacuate: "Zones C (City Residential) and D (Agricultural Flats) are highly vulnerable. If risk classifications exceed 70%, evacuate immediately to North Highlands Academy (Elev. 25m) or East Ridge Complex (Elev. 18m).",
    shelter: "Three active crisis centers:\n1. North Highlands Academy (Elev. 25m) - STABLE / SAFE.\n2. East Ridge Complex (Elev. 18m) - STABLE / SAFE.\n3. Delta Community Center (Elev. 4m) - MONITORING (Vulnerable to severe floods).",
    river: "River Basin warning limits: Normal (< 6.0m), Action Phase (6.0m - 10.0m), Extreme Danger (> 10.0m). Avoid low elevation bridges and riverbanks during rain events.",
    help: "For urgent delta assistance, dial the Delta Control Room at +1 (800) 555-FLOD, or Civil Protection at +1 (800) 555-SAFE. In life-threatening emergencies, call 911/112.",
    model: "We run a Supervised Random Forest Classifier (250 estimators) using scikit-learn. Features evaluated: 24h Rainfall volume, Cloud Density percentage, River Basin levels, and relative atmospheric humidity.",
    train: "You can recalibrate the ML trees dynamically by navigating to the 'Methodology' page and clicking 'Retrain Model'. It pulls fresh partitions and publishes live precision stats."
  };

  // --- Initializers ---
  function init() {
    setupRouting();
    setupInputs();
    setupChatbot();
    setupLogs();
    
    // Set initial preset
    loadPreset(135, 82, 6.4, 78); // Rainy Outlook
    
    // Trigger initial prediction
    updatePrediction();
  }

  // --- Routing (SPA Navigation) ---
  function setupRouting() {
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Update active class on nav
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        
        // Display appropriate section
        const targetId = item.dataset.section;
        sections.forEach(section => {
          section.classList.remove('active');
          if (section.id === targetId) {
            section.classList.add('active');
          }
        });

        // Hide simulator details if we navigate away
        if (targetId !== 'dashboard' && simulatorInterval) {
          pauseSimulator();
        }

        // Render logs if we open history
        if (targetId === 'logs') {
          renderLogs();
        }
      });
    });
  }

  // --- Sliders & Preset Form Bindings ---
  function setupInputs() {
    // Bind slider & numeric input mutual updates
    Object.keys(inputs).forEach(key => {
      const slider = inputs[key].slider;
      const numInput = inputs[key].val;

      slider.addEventListener('input', () => {
        numInput.value = slider.value;
        updateInstantLocalEstimate();
        debouncedPredict();
      });

      numInput.addEventListener('change', () => {
        let val = parseFloat(numInput.value) || 0;
        const min = parseFloat(numInput.min);
        const max = parseFloat(numInput.max);
        
        // Clamp bounds
        if (val < min) val = min;
        if (val > max) val = max;
        
        numInput.value = val;
        slider.value = val;
        updateInstantLocalEstimate();
        debouncedPredict();
      });
    });

    // Preset button triggers
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        loadPreset(
          btn.dataset.rainfall,
          btn.dataset.cloud,
          btn.dataset.river,
          btn.dataset.humidity
        );
        updatePrediction();
      });
    });

    // Station Select shift
    stationSelect.addEventListener('change', () => {
      const offset = stationOffsets[stationSelect.value];
      tickerMessage(`Monitoring shift initiated: targeting ${stationSelect.options[stationSelect.selectedIndex].text}`);
      
      // Slightly shift river levels to simulate site topography
      let currentRiver = parseFloat(inputs.river_level.slider.value);
      inputs.river_level.slider.value = Math.max(0, Math.min(15, currentRiver + offset)).toFixed(1);
      inputs.river_level.val.value = inputs.river_level.slider.value;
      
      // Pulse station dot on SVG
      mapStationDot.style.animation = 'none';
      mapStationDot.offsetHeight; // Reflow
      mapStationDot.style.animation = 'pulse-slow 1.5s infinite';

      updatePrediction();
    });

    // Log Form Submit
    sensorForm.addEventListener('submit', (e) => {
      e.preventDefault();
      saveLogEntry();
    });

    // Simulator Control Buttons
    btnPlay.addEventListener('click', () => {
      if (simulatorInterval) {
        pauseSimulator();
      } else {
        startSimulator();
      }
    });

    btnPause.addEventListener('click', () => {
      pauseSimulator();
    });

    btnReset.addEventListener('click', () => {
      resetSimulator();
    });

    // Live retraining handler
    btnRetrain.addEventListener('click', () => {
      runModelRetraining();
    });
  }

  function loadPreset(rain, cloud, river, hum) {
    inputs.rainfall.slider.value = rain;
    inputs.rainfall.val.value = rain;
    inputs.cloud_cover.slider.value = cloud;
    inputs.cloud_cover.val.value = cloud;
    inputs.river_level.slider.value = river;
    inputs.river_level.val.value = river;
    inputs.humidity.slider.value = hum;
    inputs.humidity.val.value = hum;
    updateInstantLocalEstimate();
  }

  function updateInstantLocalEstimate() {
    const rainfall = parseFloat(inputs.rainfall.slider.value) || 0;
    const cloud_cover = parseFloat(inputs.cloud_cover.slider.value) || 0;
    const river_level = parseFloat(inputs.river_level.slider.value) || 0;
    const humidity = parseFloat(inputs.humidity.slider.value) || 0;

    const estProb = Math.min(100, Math.round(rainfall / 6 + cloud_cover * 0.12 + river_level * 5.2 + humidity * 0.08));
    const estRisk = estProb >= 70 ? 'High' : estProb >= 35 ? 'Moderate' : 'Low';
    
    updateGaugeVisuals(estProb, estRisk);
    updateMap(rainfall, river_level);
  }

  function debouncedPredict() {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(updatePrediction, 120);
  }

  // --- AJAX Prediction API Calls ---
  function updatePrediction() {
    const rainfall = parseFloat(inputs.rainfall.slider.value);
    const cloud_cover = parseFloat(inputs.cloud_cover.slider.value);
    const river_level = parseFloat(inputs.river_level.slider.value);
    const humidity = parseFloat(inputs.humidity.slider.value);

    const startPing = performance.now();

    fetch('/api/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rainfall, cloud_cover, river_level, humidity })
    })
    .then(res => {
      if (!res.ok) throw new Error("API call error");
      return res.json();
    })
    .then(data => {
      // Calculate response latency
      const latency = Math.round(performance.now() - startPing);
      pingTimeEl.textContent = `${latency}ms`;
      
      updateGauge(data.probability, data.risk, data.recommendation);
      updateMap(rainfall, river_level);
      updateSafetyDirectives(data.probability, data.risk);
      
      // Store in simulator memory if actively running
      if (simulatorInterval) {
        simulatedHistory.push({ step: simCurrentStep, prob: data.probability });
        drawTrendChart();
      }
    })
    .catch(err => {
      console.error(err);
      // Fallback local prediction in case backend model isn't active
      const localProb = Math.min(100, Math.round(rainfall / 6 + cloud_cover * 0.12 + river_level * 5.2 + humidity * 0.08));
      const localRisk = localProb >= 70 ? 'High' : localProb >= 35 ? 'Moderate' : 'Low';
      const localRec = localRisk === 'High' ? 'Activate local response procedures.' : localRisk === 'Moderate' ? 'Increase monitoring frequency.' : 'Maintain routine monitoring.';
      
      updateGauge(localProb, localRisk, localRec);
      updateMap(rainfall, river_level);
      updateSafetyDirectives(localProb, localRisk);
    });
  }

  // --- Gauge UI Rendering ---
  function updateGaugeVisuals(prob, risk) {
    // Math to scale circular SVG stroke dash-offset
    const offset = 283 - (283 * prob) / 100;
    gaugeFillRing.style.strokeDashoffset = offset;

    // Reset gauge color classifications
    gaugeFillRing.classList.remove('risk-low-fill', 'risk-moderate-fill', 'risk-high-fill');
    gaugeWaveBox.classList.remove('water-low', 'water-moderate', 'water-high');
    riskTextEl.classList.remove('text-low', 'text-moderate', 'text-high');

    // Apply active classes
    const lowerRisk = risk.toLowerCase();
    gaugeFillRing.classList.add(`risk-${lowerRisk}-fill`);
    gaugeWaveBox.classList.add(`water-${lowerRisk}`);
    riskTextEl.classList.add(`text-${lowerRisk}`);

    // Update wave level (clamp height percentage)
    const waveHeight = Math.max(12, Math.min(95, prob));
    gaugeWaveFill.style.height = `${waveHeight}%`;

    // Dynamic wave animation rate based on risk height
    const animRate = prob >= 70 ? '1.5s' : prob >= 35 ? '2.8s' : '4.5s';
    document.querySelector('.wave-front').style.animationDuration = animRate;

    // Output texts
    riskPctEl.textContent = `${prob}%`;
    riskTextEl.textContent = `${risk} Risk Level`;
  }

  function updateGauge(prob, risk, recommendation) {
    updateGaugeVisuals(prob, risk);
    advisoryText.textContent = recommendation;
  }

  // --- SVG Hydrology Map Overlay Updates ---
  function updateMap(rainfall, river) {
    // 1. Agricultural flats: flooded early (Zone D)
    const agFlood = Math.min(0.9, Math.max(0, (river - 2.8) / 6 + (rainfall / 300)));
    mapOverlays.agricultural.style.opacity = agFlood.toFixed(2);

    // 2. Residential areas: flood warning stage at >7.5m river (Zone C)
    const resFlood = Math.min(0.85, Math.max(0, (river - 6.2) / 8 + (rainfall / 500)));
    mapOverlays.residential.style.opacity = resFlood.toFixed(2);

    // 3. Industrial Park: floods during major overflows (Zone B)
    const indFlood = Math.min(0.8, Math.max(0, (river - 9.5) / 5 + (rainfall / 600)));
    mapOverlays.industrial.style.opacity = indFlood.toFixed(2);

    // 4. Highlands: floods only in catastrophic cloudbursts (Zone A)
    const highFlood = Math.min(0.65, Math.max(0, (river - 13.0) / 4 + (rainfall - 450) / 500));
    mapOverlays.highlands.style.opacity = highFlood.toFixed(2);

    // 5. River Expansion line
    const expandedWidth = Math.max(0, (river - 5.0) * 1.6);
    riverExpansionPath.style.strokeWidth = expandedWidth;

    // Adjust Map Status Header dot
    const statusDot = document.querySelector('.map-status-dot');
    statusDot.className = 'map-status-dot';
    if (river >= 10.0 || rainfall >= 250) {
      statusDot.classList.add('red');
    } else if (river >= 6.5 || rainfall >= 120) {
      statusDot.classList.add('amber');
    } else {
      statusDot.classList.add('green');
    }
  }

  // --- Safety Guideline Rendering ---
  function updateSafetyDirectives(prob, risk) {
    // Update directives banner
    safetyLevelColor.className = 'safety-level-banner';
    safetyLevelColor.classList.add(`water-${risk.toLowerCase()}`);
    
    safetyStatusLbl.className = `text-${risk.toLowerCase()}`;
    safetyStatusLbl.textContent = `${risk.toUpperCase()} LEVEL ADVISORY ACTIVE`;

    let subText = "Maintain regular surveillance intervals and monitor meteorological telemetry streams.";
    if (risk === "Moderate") {
      subText = "Prepare response teams for possible deployment. Check communications channels.";
    } else if (risk === "High") {
      subText = "URGENT: Alert lowlands populations. Evacuation shelter routing operational.";
    }
    safetySubLbl.textContent = subText;

    // Render Checklist
    safetyChecklist.innerHTML = '';
    const tasks = safetyChecklists[risk];
    tasks.forEach(t => {
      const li = document.createElement('li');
      if (t.critical) {
        li.style.borderColor = 'rgba(229, 62, 62, 0.4)';
        li.style.background = 'rgba(229, 62, 62, 0.04)';
      }
      li.innerHTML = `
        <input type="checkbox" id="${t.id}">
        <label for="${t.id}" style="${t.critical ? 'color: #f7a0a0;' : ''}">${t.task}</label>
      `;
      safetyChecklist.appendChild(li);

      // Add checked transition listener
      const cb = li.querySelector('input');
      cb.addEventListener('change', () => {
        if (cb.checked) {
          li.classList.add('checked');
        } else {
          li.classList.remove('checked');
        }
      });
    });

    // Shelter map statuses
    if (risk === "High") {
      shelterCenterDot.style.fill = '#e53e3e';
      shelterCenterDot.style.animation = 'flash 1s infinite alternate';
      shelterCenterText.style.color = 'var(--warning-red)';
      shelterCenterText.textContent = "2. DELTA COMMUNITY CENTER (Elev. 4m) - EVACUATING / FLOODED";
    } else if (risk === "Moderate") {
      shelterCenterDot.style.fill = '#dd6b20';
      shelterCenterDot.style.animation = 'none';
      shelterCenterText.style.color = 'var(--warning-amber)';
      shelterCenterText.textContent = "2. DELTA COMMUNITY CENTER (Elev. 4m) - MONITORING / CAUTION";
    } else {
      shelterCenterDot.style.fill = '#38a169';
      shelterCenterDot.style.animation = 'none';
      shelterCenterText.style.color = '#fff';
      shelterCenterText.textContent = "2. DELTA COMMUNITY CENTER (Elev. 4m) - OPERATIONAL / SAFE";
    }
  }

  // --- Storm Simulator Execution ---
  function startSimulator() {
    simCurrentStep = 0;
    simulatedHistory = [];
    btnPlay.innerHTML = `
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
      <span>Pause Simulation</span>
    `;
    btnPlay.className = "sim-btn play active";
    btnPause.disabled = false;
    simIndicator.textContent = "Running";
    simIndicator.className = "sim-status active";
    
    tickerMessage("Emergency warning: Simulated storm progression initiated. Tracking 7-day weather trend.");

    simulatorInterval = setInterval(() => {
      simCurrentStep++;
      
      if (simCurrentStep > simTotalSteps) {
        pauseSimulator();
        tickerMessage("Storm simulation completed. Hydrological records generated.");
        return;
      }

      // Update progress bar UI
      const pct = (simCurrentStep / simTotalSteps) * 100;
      simProgress.style.width = `${pct}%`;
      simThumb.style.left = `${pct}%`;

      // Mathematical curves for storm progression (Peak at step 14 / Day 4)
      const peakStep = 14;
      const progressRatio = Math.sin((simCurrentStep / simTotalSteps) * Math.PI); // Sine wave curve
      
      // Rainfall: intense burst centered around day 4
      const simRain = Math.round(progressRatio * progressRatio * 420); 
      // River levels: lags behind rainfall, slower discharge
      const riverLagRatio = Math.sin(((simCurrentStep - 3) / simTotalSteps) * Math.PI);
      const simRiver = Math.max(1.8, Math.min(14.8, (riverLagRatio > 0 ? riverLagRatio * 11.5 : 0) + 2.1));
      // Cloud cover & humidity rise fast, stay high, fall slow
      const simCloud = Math.round(progressRatio * 45 + 50);
      const simHum = Math.round(progressRatio * 35 + 60);

      // Load simulated parameters
      loadPreset(simRain, simCloud, simRiver.toFixed(1), simHum);
      
      // Perform predictions
      updatePrediction();

    }, 700);
  }

  function pauseSimulator() {
    clearInterval(simulatorInterval);
    simulatorInterval = null;
    btnPlay.innerHTML = `
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
      <span>Resume Simulation</span>
    `;
    btnPlay.className = "sim-btn play";
    btnPause.disabled = true;
    simIndicator.textContent = "Paused";
    simIndicator.className = "sim-status";
  }

  function resetSimulator() {
    pauseSimulator();
    simCurrentStep = 0;
    simProgress.style.width = '0%';
    simThumb.style.left = '0%';
    simulatedHistory = [];
    
    // Reset back to baseline values
    loadPreset(80, 65, 4.5, 70);
    updatePrediction();
    
    // Clear graph points
    trendGraphLine.setAttribute('points', '0,110 53,110 106,110 159,110 212,110 265,110 320,110');
    tickerMessage("Simulation telemetry flushed. Baseline observations loaded.");
  }

  // Draw trend graph
  function drawTrendChart() {
    if (simulatedHistory.length === 0) return;
    
    let pts = [];
    const pointsCount = 7;
    const intervalsPerPoint = Math.ceil(simTotalSteps / (pointsCount - 1));

    for (let i = 0; i < pointsCount; i++) {
      const stepIdx = Math.min(simulatedHistory.length - 1, i * intervalsPerPoint);
      const histItem = simulatedHistory[stepIdx];
      const prob = histItem ? histItem.prob : 0;
      
      const x = i * 53.3; // Distribute across 320 width
      const y = 110 - (prob * 0.95); // Scale 0-100 to y heights
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }

    trendGraphLine.setAttribute('points', pts.join(' '));
  }

  // --- Model Retraining (AJAX Trigger) ---
  function runModelRetraining() {
    btnRetrain.disabled = true;
    trainSpinner.style.display = 'inline-block';
    trainBtnLbl.textContent = 'Fitting Random Forest...';

    fetch('/api/train', { method: 'POST' })
    .then(res => {
      if (!res.ok) throw new Error("Training request failed");
      return res.json();
    })
    .then(data => {
      // Metric updates with subtle CSS glow trigger
      sidebarAccEl.textContent = `${data.accuracy}%`;
      metricAccuracy.textContent = `${data.accuracy}%`;
      metricPrecision.textContent = `${data.precision_flood}%`;
      metricRecall.textContent = `${data.recall_flood}%`;
      metricF1.textContent = `${data.f1_flood}%`;

      [metricAccuracy, metricPrecision, metricRecall, metricF1].forEach(el => {
        el.style.color = '#73e1b4';
        setTimeout(() => el.style.color = '#fff', 1500);
      });

      tickerMessage(`Model optimization complete: Accuracy calibrated to ${data.accuracy}% using ${data.samples} trees partitions.`);
    })
    .catch(err => {
      console.error(err);
      tickerMessage("Warning: Retraining failed. Falling back to static cache coefficients.");
    })
    .finally(() => {
      btnRetrain.disabled = false;
      trainSpinner.style.display = 'none';
      trainBtnLbl.textContent = 'Retrain Model';
    });
  }

  // --- Historical Database Logger ---
  function saveLogEntry() {
    const rainfall = inputs.rainfall.slider.value;
    const cloud = inputs.cloud_cover.slider.value;
    const river = inputs.river_level.slider.value;
    const hum = inputs.humidity.slider.value;
    const prob = riskPctEl.textContent;
    const risk = riskTextEl.textContent.split(' ')[0];

    const logs = JSON.parse(localStorage.getItem('rw_flood_logs') || '[]');
    const newEntry = {
      timestamp: new Date().toLocaleString(),
      station: stationSelect.options[stationSelect.selectedIndex].text,
      rainfall,
      cloud,
      river,
      humidity: hum,
      probability: prob,
      risk
    };

    logs.unshift(newEntry); // Insert at beginning
    localStorage.setItem('rw_flood_logs', JSON.stringify(logs));
    tickerMessage(`Hydrological entry recorded successfully at ${newEntry.timestamp}`);
    
    // Highlight table button with flash
    const hubBtn = document.querySelector('[data-section="logs"]');
    hubBtn.style.backgroundColor = 'rgba(66, 153, 225, 0.3)';
    setTimeout(() => hubBtn.style.backgroundColor = '', 600);
  }

  function setupLogs() {
    btnClearLogs.addEventListener('click', () => {
      if (confirm("Are you sure you want to flush the historical logs database? This cannot be undone.")) {
        localStorage.removeItem('rw_flood_logs');
        renderLogs();
        tickerMessage("Local prediction records database cleared.");
      }
    });

    btnExportCsv.addEventListener('click', exportLogsToCSV);

    logsSearchInput.addEventListener('input', renderLogs);
    logsFilterSelect.addEventListener('change', renderLogs);
  }

  function renderLogs() {
    const logs = JSON.parse(localStorage.getItem('rw_flood_logs') || '[]');
    const filter = logsFilterSelect.value;
    const query = logsSearchInput.value.toLowerCase();

    logsTableBody.innerHTML = '';

    const filtered = logs.filter(log => {
      const matchesFilter = filter === 'all' || log.risk.toLowerCase() === filter;
      const matchesQuery = !query || 
        log.timestamp.toLowerCase().includes(query) ||
        log.station.toLowerCase().includes(query) ||
        log.risk.toLowerCase().includes(query);
      return matchesFilter && matchesQuery;
    });

    if (filtered.length === 0) {
      noLogsState.style.display = 'flex';
      return;
    }

    noLogsState.style.display = 'none';
    filtered.forEach(log => {
      const row = document.createElement('tr');
      
      let badgeClass = 'text-low';
      if (log.risk === 'Moderate') badgeClass = 'text-moderate';
      if (log.risk === 'High') badgeClass = 'text-high';

      row.innerHTML = `
        <td>${log.timestamp}</td>
        <td>${log.station}</td>
        <td>${log.rainfall}</td>
        <td>${log.cloud}%</td>
        <td>${log.river}</td>
        <td>${log.humidity}%</td>
        <td><strong>${log.probability}</strong></td>
        <td><span class="${badgeClass}" style="font-weight: 700;">${log.risk}</span></td>
      `;
      logsTableBody.appendChild(row);
    });
  }

  function exportLogsToCSV() {
    const logs = JSON.parse(localStorage.getItem('rw_flood_logs') || '[]');
    if (logs.length === 0) {
      alert("No logs available to export.");
      return;
    }

    const headers = ["Timestamp", "Station", "Rainfall (mm)", "Cloud Cover (%)", "River Basin (m)", "Humidity (%)", "Likelihood", "Classification"];
    const rows = logs.map(log => [
      `"${log.timestamp}"`,
      `"${log.station}"`,
      log.rainfall,
      log.cloud,
      log.river,
      log.humidity,
      `"${log.probability}"`,
      `"${log.risk}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `RisingWaters_TelemetryExport_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // --- Floating Chatbot Controller ---
  function setupChatbot() {
    // Open / Close on header click
    chatHeaderBar.addEventListener('click', (e) => {
      e.stopPropagation();
      chatbotWidget.classList.toggle('collapsed');
      
      // Auto scroll chat to bottom when opening
      if (!chatbotWidget.classList.contains('collapsed')) {
        setTimeout(() => {
          chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 100);
      }
    });

    chatCloseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      chatbotWidget.classList.add('collapsed');
    });

    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const txt = chatInput.value.trim();
      if (!txt) return;

      appendChatMessage(txt, 'user');
      chatInput.value = '';

      // Processing loading typing state
      const loadingBubble = appendChatMessage('Assistant is processing...', 'bot loading');
      
      setTimeout(() => {
        loadingBubble.remove();
        processBotReply(txt);
      }, 700);
    });
  }

  function appendChatMessage(msg, sender) {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${sender}`;
    bubble.textContent = msg;
    chatMessages.appendChild(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return bubble;
  }

  function processBotReply(userMsg) {
    const normalized = userMsg.toLowerCase();
    let reply = "I'm not sure about that query. You can ask me about 'evacuate' details, emergency 'shelter' locations, 'river' limits, scikit-learn 'model' metrics, or how to 'train' the forest trees.";
    
    // Keyword match algorithm
    const matchKey = Object.keys(chatbotReplies).find(key => normalized.includes(key));
    if (matchKey) {
      reply = chatbotReplies[matchKey];
    }
    
    appendChatMessage(reply, 'bot');
  }

  // --- Helper Ticker Alerts ---
  function tickerMessage(msg) {
    tickerFeed.textContent = msg;
    // Brief animation flash
    tickerFeed.parentElement.style.backgroundColor = 'rgba(66, 153, 225, 0.15)';
    setTimeout(() => {
      tickerFeed.parentElement.style.backgroundColor = '';
    }, 800);
  }

  // Start app execution
  window.addEventListener('DOMContentLoaded', init);

})();
