// script.js — Versión 2026 (ene-sep) con O2/CNAF/TQT/VM + Diagnósticos
let allData = [];
let filteredData = [];

let chartEvolucion = null;
let chartGravedad = null;
let chartVentilatorio = null;
let chartDiagnosticos = null;
let chartRendimiento = null;

const MESES_ORDEN = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE'];

document.addEventListener('DOMContentLoaded', function() {
    if (typeof data === 'undefined') {
        document.body.innerHTML = '<h1 style="color:red;text-align:center;padding:50px;">❌ Error: No se encontraron datos. Verifica que data.js esté cargado.</h1>';
        return;
    }

    allData = data;
    filteredData = [...allData];

    populateModuloFilter();
    populateMesFilter();

    document.querySelectorAll('.modulo-checkbox').forEach(cb => cb.addEventListener('change', updateDashboard));
    document.querySelectorAll('.mes-checkbox').forEach(cb => cb.addEventListener('change', updateDashboard));

    document.getElementById('diaFilter').addEventListener('input', function() {
        document.getElementById('diaValue').textContent = this.value;
        updateDashboard();
    });

    document.getElementById('resetFilters').addEventListener('click', resetFilters);
    document.getElementById('selectAllModulos').addEventListener('click', function() {
        document.querySelectorAll('.modulo-checkbox').forEach(cb => cb.checked = true);
        updateDashboard();
    });
    document.getElementById('deselectAllModulos').addEventListener('click', function() {
        document.querySelectorAll('.modulo-checkbox').forEach(cb => cb.checked = false);
        updateDashboard();
    });
    document.getElementById('selectAllMeses').addEventListener('click', function() {
        document.querySelectorAll('.mes-checkbox').forEach(cb => cb.checked = true);
        updateDashboard();
    });
    document.getElementById('deselectAllMeses').addEventListener('click', function() {
        document.querySelectorAll('.mes-checkbox').forEach(cb => cb.checked = false);
        updateDashboard();
    });

    updateDashboard();
});

function populateModuloFilter() {
    const modulos = [...new Set(allData.map(d => d.modulo))].sort();
    const container = document.getElementById('moduloCheckboxes');
    container.innerHTML = '';
    modulos.forEach(modulo => {
        if (modulo === 'Gine') return;
        const label = document.createElement('label');
        label.className = 'checkbox-label';
        label.innerHTML = `
            <input type="checkbox" class="modulo-checkbox" value="${modulo}" checked>
            <span>${modulo}</span>
        `;
        container.appendChild(label);
    });
}

function populateMesFilter() {
    const container = document.getElementById('mesCheckboxes');
    container.innerHTML = '';
    MESES_ORDEN.forEach(mes => {
        const label = document.createElement('label');
        label.className = 'checkbox-label';
        label.innerHTML = `
            <input type="checkbox" class="mes-checkbox" value="${mes}" checked>
            <span>${mes}</span>
        `;
        container.appendChild(label);
    });
}

function getSelectedModulos() {
    return Array.from(document.querySelectorAll('.modulo-checkbox:checked')).map(cb => cb.value);
}

function getSelectedMeses() {
    return Array.from(document.querySelectorAll('.mes-checkbox:checked')).map(cb => cb.value);
}

function updateDashboard() {
    const selectedModulos = getSelectedModulos();
    const selectedMeses = getSelectedMeses();
    const diaMax = parseInt(document.getElementById('diaFilter').value);

    filteredData = allData.filter(d => {
        let match = true;
        if (selectedModulos.length > 0) match = match && selectedModulos.includes(d.modulo);
        if (selectedMeses.length > 0) match = match && selectedMeses.includes(d.mes);
        if (diaMax < 31) match = match && d.dia <= diaMax;
        return match;
    });

    updateKPIs();
    updateCharts();
    updateTable();
    updateDiagnosticos();
}

function updateKPIs() {
    const total = filteredData.reduce((sum, d) => sum + d.total, 0);
    const promedio = filteredData.length > 0 ? Math.round(total / filteredData.length) : 0;
    const rendimientoPromedio = filteredData.length > 0 ?
        Math.round(filteredData.reduce((sum, d) => sum + d.rendimiento, 0) / filteredData.length) : 0;

    document.getElementById('kpiTotal').textContent = total;
    document.getElementById('kpiPromedio').textContent = promedio;
    document.getElementById('kpiRendimiento').textContent = rendimientoPromedio + '%';

    const modulosRendimiento = {};
    filteredData.forEach(d => {
        if (d.modulo === 'Gine') return;
        if (!modulosRendimiento[d.modulo]) modulosRendimiento[d.modulo] = [];
        modulosRendimiento[d.modulo].push(d.rendimiento);
    });

    let mejorModulo = '-';
    let mejorPromedio = -1;
    for (const [modulo, rendimientos] of Object.entries(modulosRendimiento)) {
        const promedioMod = rendimientos.reduce((a, b) => a + b, 0) / rendimientos.length;
        if (promedioMod > mejorPromedio) {
            mejorPromedio = promedioMod;
            mejorModulo = modulo;
        }
    }
    document.getElementById('kpiMejorModulo').textContent = mejorModulo + (mejorPromedio > 0 ? ' (' + Math.round(mejorPromedio) + '%)' : '');

    // KPIs ventilación
    const o2   = filteredData.reduce((s,d) => s + (d.o2   || 0), 0);
    const cnaf = filteredData.reduce((s,d) => s + (d.cnaf || 0), 0);
    const tqt  = filteredData.reduce((s,d) => s + (d.tqt  || 0), 0);
    const vm   = filteredData.reduce((s,d) => s + (d.vm   || 0), 0);
    document.getElementById('kpiO2').textContent = o2;
    document.getElementById('kpiCNAF').textContent = cnaf;
    document.getElementById('kpiTQT').textContent = tqt;
    document.getElementById('kpiVM').textContent = vm;
}

function updateCharts() {
    if (chartEvolucion)   { chartEvolucion.destroy();   chartEvolucion = null; }
    if (chartGravedad)    { chartGravedad.destroy();    chartGravedad = null; }
    if (chartVentilatorio){ chartVentilatorio.destroy();chartVentilatorio = null; }
    if (chartDiagnosticos){ chartDiagnosticos.destroy();chartDiagnosticos = null; }
    if (chartRendimiento) { chartRendimiento.destroy(); chartRendimiento = null; }

    // Gráfico 1: Evolución
    const dias = [...new Set(filteredData.map(d => d.dia))].sort((a, b) => a - b);
    const totalesPorDia = dias.map(dia =>
        filteredData.filter(d => d.dia === dia).reduce((sum, d) => sum + d.total, 0)
    );

    chartEvolucion = new Chart(document.getElementById('chartEvolucion'), {
        type: 'line',
        data: {
            labels: dias,
            datasets: [{
                label: 'Total Atenciones',
                data: totalesPorDia,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.15)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: true, position: 'top' } },
            scales: { y: { beginAtZero: true, min: 0 } }
        }
    });

    // Gráfico 2: Gravedad
    const leve = filteredData.reduce((s,d) => s + d.leve, 0);
    const mod  = filteredData.reduce((s,d) => s + d.mod, 0);
    const sev  = filteredData.reduce((s,d) => s + d.sev, 0);

    chartGravedad = new Chart(document.getElementById('chartGravedad'), {
        type: 'doughnut',
        data: {
            labels: ['🟢 Leve', '🟡 Moderado', '🔴 Severo'],
            datasets: [{
                data: [leve, mod, sev],
                backgroundColor: ['#48bb78', '#ed8936', '#fc8181'],
                borderWidth: 3,
                borderColor: 'white'
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'bottom' } },
            cutout: '60%'
        }
    });

    // Gráfico 3: Ventilatorio (por mes)
    const meses = getSelectedMeses().length > 0 ? getSelectedMeses() : MESES_ORDEN;
    const o2PorMes   = meses.map(m => filteredData.filter(d => d.mes === m).reduce((s,d) => s + (d.o2||0), 0));
    const cnafPorMes = meses.map(m => filteredData.filter(d => d.mes === m).reduce((s,d) => s + (d.cnaf||0), 0));
    const tqtPorMes  = meses.map(m => filteredData.filter(d => d.mes === m).reduce((s,d) => s + (d.tqt||0), 0));
    const vmPorMes   = meses.map(m => filteredData.filter(d => d.mes === m).reduce((s,d) => s + (d.vm||0), 0));

    chartVentilatorio = new Chart(document.getElementById('chartVentilatorio'), {
        type: 'bar',
        data: {
            labels: meses,
            datasets: [
                { label: 'O2',   data: o2PorMes,   backgroundColor: '#3498DB', borderRadius: 6 },
                { label: 'CNAF', data: cnafPorMes, backgroundColor: '#1ABC9C', borderRadius: 6 },
                { label: 'TQT',  data: tqtPorMes,  backgroundColor: '#E74C3C', borderRadius: 6 },
                { label: 'VM',   data: vmPorMes,   backgroundColor: '#9b59b6', borderRadius: 6 }
            ]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'top' } },
            scales: { y: { beginAtZero: true } }
        }
    });

    // Gráfico 4: Diagnósticos
    const diagPorMes = {};
    meses.forEach(m => {
        const d = (typeof diagnosticosPorMes !== 'undefined' && diagnosticosPorMes[m]) ? diagnosticosPorMes[m] : {};
        Object.keys(d).forEach(k => {
            if (!diagPorMes[k]) diagPorMes[k] = 0;
            diagPorMes[k] += d[k];
        });
    });
    const diagLabels = Object.keys(diagPorMes);
    const diagValues = diagLabels.map(k => diagPorMes[k]);

    chartDiagnosticos = new Chart(document.getElementById('chartDiagnosticos'), {
        type: 'bar',
        data: {
            labels: diagLabels,
            datasets: [{
                label: 'Frecuencia',
                data: diagValues,
                backgroundColor: ['#667eea','#f6ad55','#68d391','#fc8181','#9f7aea','#ed8936','#4299e1','#e53e3e'],
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            indexAxis: 'y',
            plugins: { legend: { display: false } },
            scales: { x: { beginAtZero: true } }
        }
    });

    // Gráfico 5: Rendimiento
    const selectedModulos = getSelectedModulos();
    let labels = meses;
    if (selectedMeses.length > 0 && selectedMeses.length < 3) {
        labels = selectedMeses;
    }

    if (selectedModulos.length === 1) {
        const modulo = selectedModulos[0];
        const datosModulo = filteredData.filter(d => d.modulo === modulo);
        const promediosMensuales = labels.map(mes => {
            const dataMes = datosModulo.filter(d => d.mes === mes);
            return dataMes.length > 0 ? Math.round(dataMes.reduce((s,d) => s + d.rendimiento, 0) / dataMes.length) : 0;
        });
        const promedioTotal = datosModulo.length > 0 ?
            Math.round(datosModulo.reduce((s,d) => s + d.rendimiento, 0) / datosModulo.length) : 0;

        chartRendimiento = new Chart(document.getElementById('chartRendimiento'), {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Rendimiento Mensual',
                        data: promediosMensuales,
                        backgroundColor: ['#f6ad55','#68d391','#fc8181','#63b3ed','#b794f4'],
                        borderRadius: 8,
                        barPercentage: 0.6
                    },
                    {
                        label: 'Promedio Total: ' + promedioTotal + '%',
                        data: labels.map(() => promedioTotal),
                        type: 'line',
                        borderColor: '#2d3748',
                        borderWidth: 3,
                        borderDash: [8,4],
                        pointRadius: 5,
                        pointBackgroundColor: '#2d3748',
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: { legend: { position: 'top' } },
                scales: { y: { beginAtZero: true, max: 100, ticks: { callback: v => v + '%' } } }
            }
        });
    } else {
        const datasets = [];
        const colores = ['#667eea','#f6ad55','#68d391','#fc8181','#9f7aea','#ed8936'];
        selectedModulos.forEach((modulo, index) => {
            const dataPorMes = labels.map(mes => {
                const dataMes = filteredData.filter(d => d.modulo === modulo && d.mes === mes);
                return dataMes.length > 0 ? Math.round(dataMes.reduce((s,d) => s + d.rendimiento, 0) / dataMes.length) : 0;
            });
            const promedio = dataPorMes.reduce((a,b) => a+b, 0) / dataPorMes.length;
            datasets.push({
                label: modulo + ' (Prom: ' + Math.round(promedio) + '%)',
                data: dataPorMes,
                backgroundColor: colores[index % colores.length],
                borderRadius: 4,
                barPercentage: 0.7
            });
        });

        chartRendimiento = new Chart(document.getElementById('chartRendimiento'), {
            type: 'bar',
            data: { labels: labels, datasets: datasets },
            options: {
                responsive: true,
                plugins: { legend: { position: 'top' } },
                scales: { y: { beginAtZero: true, max: 100, ticks: { callback: v => v + '%' } } }
            }
        });
    }
}

function updateTable() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';

    if (filteredData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="15" style="text-align:center;padding:30px;color:#a0aec0;">📭 No hay datos</td></tr>';
        return;
    }

    const sorted = [...filteredData].sort((a, b) => {
        if (a.mes !== b.mes) return MESES_ORDEN.indexOf(a.mes) - MESES_ORDEN.indexOf(b.mes);
        return a.dia - b.dia;
    });

    sorted.forEach(d => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${d.dia}</strong></td>
            <td><span class="badge badge-${d.mes.toLowerCase()}">${d.mes}</span></td>
            <td>${d.modulo}</td>
            <td><strong>${d.total}</strong></td>
            <td>${d.ingreso}</td>
            <td>${d.leve}</td>
            <td>${d.mod}</td>
            <td>${d.sev}</td>
            <td>${d.o2}</td>
            <td>${d.cnaf}</td>
            <td>${d.tqt}</td>
            <td>${d.plt}</td>
            <td>${d.drenajes}</td>
            <td>${d.vm}</td>
            <td style="color:${d.rendimiento >= 80 ? '#48bb78' : d.rendimiento >= 60 ? '#ed8936' : '#fc8181'};font-weight:600;">${d.rendimiento}%</td>
        `;
        tbody.appendChild(tr);
    });
}

function updateDiagnosticos() {
    const tbody = document.getElementById('diagnosticosBody');
    tbody.innerHTML = '';

    if (typeof diagnosticosPorMes === 'undefined') {
        tbody.innerHTML = '<tr><td colspan="2" style="text-align:center;padding:20px;">Sin datos de diagnósticos.</td></tr>';
        return;
    }

    const meses = getSelectedMeses();
    const acumulado = {};
    meses.forEach(m => {
        const d = diagnosticosPorMes[m];
        if (!d) return;
        Object.keys(d).forEach(k => {
            if (!acumulado[k]) acumulado[k] = 0;
            acumulado[k] += d[k];
        });
    });

    const arr = Object.keys(acumulado).map(k => [k, acumulado[k]]);
    arr.sort((a,b) => b[1] - a[1]);

    if (arr.length === 0) {
        tbody.innerHTML = '<tr><td colspan="2" style="text-align:center;padding:20px;color:#a0aec0;">Sin diagnósticos en los meses seleccionados.</td></tr>';
        return;
    }

    arr.forEach(([diag, freq]) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td><strong>${diag}</strong></td><td>${freq}</td>`;
        tbody.appendChild(tr);
    });
}

function resetFilters() {
    document.querySelectorAll('.modulo-checkbox').forEach(cb => cb.checked = true);
    document.querySelectorAll('.mes-checkbox').forEach(cb => cb.checked = true);
    document.getElementById('diaFilter').value = '31';
    document.getElementById('diaValue').textContent = '31';
    updateDashboard();
}
