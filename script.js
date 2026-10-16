// script.js — Versión 2026 con porcentajes y diagnósticos agrupados
let allData = [];
let filteredData = [];

let chartEvolucion = null;
let chartGravedad = null;
let chartVentilatorio = null;
let chartDiagnosticos = null;
let chartRendimiento = null;

const MESES_ORDEN = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE'];

// Agrupación de diagnósticos (para unificar los que son el mismo espectro clínico)
const AGRUPACION_DIAG = {
    'ACV':                  ['ACV'],
    'IRA / NAC / NEUMONÍA': ['IRA','NAC','NEUMONIA','NEUMONÍA'],
    'SHOCK':                ['SHOCK'],
    'ANGINA':               ['ANGINA'],
    'IAM / SCA':            ['IAM','SCA']
};

// Devuelve el nombre agrupado a partir del nombre original
function agruparDiagnostico(nombreOriginal) {
    const nom = String(nombreOriginal).trim().toUpperCase();
    for (const grupo in AGRUPACION_DIAG) {
        if (AGRUPACION_DIAG[grupo].some(k => nom === k || nom.includes(k))) {
            return grupo;
        }
    }
    return null; // no agrupado
}

document.addEventListener('DOMContentLoaded', function() {
    if (typeof data === 'undefined') {
        document.body.innerHTML = '<h1 style="color:red;text-align:center;padding:50px;">❌ Error: No se encontraron datos.</h1>';
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
    document.getElementById('kpiMejorModulo').textContent =
        mejorModulo + (mejorPromedio > 0 ? ' (' + Math.round(mejorPromedio) + '%)' : '');

    // KPIs ventilatorios mostrados como % de días-cama
    const totalDiasCama = filteredData.reduce((s,d) => s + (d.total || 0), 0);
    const o2   = filteredData.reduce((s,d) => s + (d.o2   || 0), 0);
    const cnaf = filteredData.reduce((s,d) => s + (d.cnaf || 0), 0);
    const tqt  = filteredData.reduce((s,d) => s + (d.tqt  || 0), 0);
    const vm   = filteredData.reduce((s,d) => s + (d.vm   || 0), 0);

    const pct = (v) => totalDiasCama > 0 ? Math.round((v / totalDiasCama) * 100) + '%' : '0%';

    document.getElementById('kpiO2').textContent = pct(o2);
    document.getElementById('kpiCNAF').textContent = pct(cnaf);
    document.getElementById('kpiTQT').textContent = pct(tqt);
    document.getElementById('kpiVM').textContent = pct(vm);
}

function updateCharts() {
    if (chartEvolucion)    { chartEvolucion.destroy();    chartEvolucion = null; }
    if (chartGravedad)     { chartGravedad.destroy();     chartGravedad = null; }
    if (chartVentilatorio) { chartVentilatorio.destroy(); chartVentilatorio = null; }
    if (chartDiagnosticos) { chartDiagnosticos.destroy(); chartDiagnosticos = null; }
    if (chartRendimiento)  { chartRendimiento.destroy();  chartRendimiento = null; }

    // ========== 1. EVOLUCIÓN ==========
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
            maintainAspectRatio: false,
            plugins: { legend: { display: true, position: 'top' } },
            scales: { y: { beginAtZero: true, min: 0 } }
        }
    });

    // ========== 2. GRAVEDAD ==========
    const leve = filteredData.reduce((s,d) => s + d.leve, 0);
    const mod  = filteredData.reduce((s,d) => s + d.mod, 0);
    const sev  = filteredData.reduce((s,d) => s + d.sev, 0);

    chartGravedad = new Chart(document.getElementById('chartGravedad'), {
        type: 'bar',
        data: {
            labels: ['🟢 Leve', '🟡 Moderado', '🔴 Severo'],
            datasets: [{
                label: 'Pacientes',
                data: [leve, mod, sev],
                backgroundColor: ['#48bb78', '#ed8936', '#fc8181'],
                borderRadius: 8,
                barPercentage: 0.55
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: ctx => `${ctx.label}: ${ctx.parsed.x}` } }
            },
            scales: { x: { beginAtZero: true, ticks: { precision: 0 } } }
        }
    });

    // ========== 3. VENTILATORIO POR MES (en % de días-cama) ==========
    const meses = getSelectedMeses().length > 0 ? getSelectedMeses() : MESES_ORDEN;

    const pctPorMes = (campo) => meses.map(m => {
        const dataMes = filteredData.filter(d => d.mes === m);
        const totalDias = dataMes.reduce((s,d) => s + (d.total || 0), 0);
        const sumaCampo = dataMes.reduce((s,d) => s + (d[campo] || 0), 0);
        return totalDias > 0 ? Math.round((sumaCampo / totalDias) * 100) : 0;
    });

    const o2PorMes   = pctPorMes('o2');
    const cnafPorMes = pctPorMes('cnaf');
    const tqtPorMes  = pctPorMes('tqt');
    const vmPorMes   = pctPorMes('vm');

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
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' },
                tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y}%` } }
            },
            scales: {
                y: { beginAtZero: true, ticks: { callback: v => v + '%' } }
            }
        }
    });

    // ========== 4. DIAGNÓSTICOS POR MES (en % del total de diagnósticos del mes) ==========
    const mesesActivos = getSelectedMeses().length > 0 ? getSelectedMeses() : MESES_ORDEN;

    // Recolectar diagnósticos agrupados y calcular totales por mes
    const gruposActivos = Object.keys(AGRUPACION_DIAG);
    const valoresPorMes = {}; // { 'ENERO': { 'ACV': 229, 'IRA / NAC / NEUMONÍA': 478, ... }, ... }
    const totalesPorMes = {}; // { 'ENERO': 877, ... }

    mesesActivos.forEach(m => {
        valoresPorMes[m] = {};
        gruposActivos.forEach(g => valoresPorMes[m][g] = 0);

        if (typeof diagnosticosPorMes !== 'undefined' && diagnosticosPorMes[m]) {
            Object.keys(diagnosticosPorMes[m]).forEach(nombreOriginal => {
                const grupo = agruparDiagnostico(nombreOriginal);
                if (grupo) {
                    valoresPorMes[m][grupo] += diagnosticosPorMes[m][nombreOriginal];
                }
            });
        }

        totalesPorMes[m] = Object.values(valoresPorMes[m]).reduce((a,b) => a+b, 0);
    });

    const paleta = ['#667eea','#ed8936','#68d391','#fc8181','#9f7aea'];

    const datasetsDiag = gruposActivos.map((grupo, i) => ({
        label: grupo,
        data: mesesActivos.map(m => {
            const total = totalesPorMes[m];
            return total > 0 ? Math.round((valoresPorMes[m][grupo] / total) * 100) : 0;
        }),
        backgroundColor: paleta[i % paleta.length],
        borderRadius: 4
    }));

    chartDiagnosticos = new Chart(document.getElementById('chartDiagnosticos'), {
        type: 'bar',
        data: {
            labels: mesesActivos,
            datasets: datasetsDiag
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' },
                tooltip: {
                    callbacks: {
                        label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y}%`
                    }
                }
            },
            scales: {
                x: { stacked: true },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    max: 100,
                    ticks: { callback: v => v + '%' }
                }
            }
        }
    });

    // ========== 5. RENDIMIENTO POR MÓDULO ==========
    const selectedModulos = getSelectedModulos();
    let labelsRend = getSelectedMeses().length > 0 ? getSelectedMeses() : MESES_ORDEN;

    if (selectedModulos.length === 0) {
        chartRendimiento = new Chart(document.getElementById('chartRendimiento'), {
            type: 'bar',
            data: { labels: ['Sin módulos'], datasets: [] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });
    } else if (selectedModulos.length === 1) {
        const modulo = selectedModulos[0];
        const datosModulo = filteredData.filter(d => d.modulo === modulo);
        const promediosMensuales = labelsRend.map(mes => {
            const dataMes = datosModulo.filter(d => d.mes === mes);
            return dataMes.length > 0 ? Math.round(dataMes.reduce((s,d) => s + d.rendimiento, 0) / dataMes.length) : 0;
        });
        const promedioTotal = datosModulo.length > 0 ?
            Math.round(datosModulo.reduce((s,d) => s + d.rendimiento, 0) / datosModulo.length) : 0;

        chartRendimiento = new Chart(document.getElementById('chartRendimiento'), {
            type: 'bar',
            data: {
                labels: labelsRend,
                datasets: [
                    {
                        label: 'Rendimiento mensual (%)',
                        data: promediosMensuales,
                        backgroundColor: '#667eea',
                        borderRadius: 8,
                        barPercentage: 0.6
                    },
                    {
                        label: 'Promedio total: ' + promedioTotal + '%',
                        data: labelsRend.map(() => promedioTotal),
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
                maintainAspectRatio: false,
                plugins: { legend: { position: 'top' } },
                scales: { y: { beginAtZero: true, max: 100, ticks: { callback: v => v + '%' } } }
            }
        });
    } else {
        const datasets = [];
        const colores = ['#667eea','#f6ad55','#68d391','#fc8181','#9f7aea','#ed8936'];
        selectedModulos.forEach((modulo, index) => {
            const dataPorMes = labelsRend.map(mes => {
                const dataMes = filteredData.filter(d => d.modulo === modulo && d.mes === mes);
                return dataMes.length > 0 ? Math.round(dataMes.reduce((s,d) => s + d.rendimiento, 0) / dataMes.length) : 0;
            });
            datasets.push({
                label: modulo,
                data: dataPorMes,
                backgroundColor: colores[index % colores.length],
                borderRadius: 4,
                barPercentage: 0.7
            });
        });

        chartRendimiento = new Chart(document.getElementById('chartRendimiento'), {
            type: 'bar',
            data: { labels: labelsRend, datasets: datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
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

    const maxFilas = 500;
    const mostrar = sorted.slice(0, maxFilas);

    mostrar.forEach(d => {
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

    if (sorted.length > maxFilas) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="15" style="text-align:center;padding:12px;color:#718096;font-style:italic;">... mostrando las primeras ${maxFilas} filas de ${sorted.length} totales</td>`;
        tbody.appendChild(tr);
    }
}

function updateDiagnosticos() {
    const tbody = document.getElementById('diagnosticosBody');
    tbody.innerHTML = '';

    if (typeof diagnosticosPorMes === 'undefined') {
        tbody.innerHTML = '<tr><td colspan="11" style="text-align:center;padding:20px;">Sin datos de diagnósticos.</td></tr>';
        return;
    }

    const mesesActivos = getSelectedMeses().length > 0 ? getSelectedMeses() : MESES_ORDEN;
    const gruposActivos = Object.keys(AGRUPACION_DIAG);

    // Calcular valores agrupados por mes
    const valores = {}; // { grupo: { mes: cantidad } }
    const totalesMes = {};

    gruposActivos.forEach(g => valores[g] = {});
    MESES_ORDEN.forEach(m => {
        totalesMes[m] = 0;
        gruposActivos.forEach(g => valores[g][m] = 0);
    });

    mesesActivos.forEach(m => {
        if (!diagnosticosPorMes[m]) return;
        Object.keys(diagnosticosPorMes[m]).forEach(nombreOriginal => {
            const grupo = agruparDiagnostico(nombreOriginal);
            if (grupo) {
                valores[grupo][m] += diagnosticosPorMes[m][nombreOriginal];
                totalesMes[m] += diagnosticosPorMes[m][nombreOriginal];
            }
        });
    });

    // Armar las filas (con % del total de cada mes)
    const filas = gruposActivos.map(grupo => {
        const celdas = mesesActivos.map(m => {
            const v = valores[grupo][m];
            const tot = totalesMes[m];
            if (tot === 0) return { n: 0, pct: 0 };
            return { n: v, pct: Math.round((v / tot) * 100) };
        });
        const totalNum = celdas.reduce((a,c) => a + c.n, 0);
        return { grupo, celdas, totalNum };
    });

    // Ordenar por total descendente
    filas.sort((a,b) => b.totalNum - a.totalNum);

    filas.forEach(f => {
        const tr = document.createElement('tr');
        const celdasHtml = f.celdas.map(c =>
            `<td style="text-align:center;">${c.n > 0 ? c.n + ' <span style="color:#718096;font-size:0.85em;">(' + c.pct + '%)</span>' : '—'}</td>`
        ).join('');
        tr.innerHTML = `
            <td><strong>${f.grupo}</strong></td>
            ${celdasHtml}
            <td style="text-align:center;font-weight:700;background:#f7fafc;">${f.totalNum}</td>
        `;
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
