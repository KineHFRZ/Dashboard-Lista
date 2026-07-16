// script.js - Dashboard de Ventilación Mecánica y CNAF
let allData = [];
let filteredData = [];
let chartPacientesMes = null;
let chartSexo = null;
let chartMotivos = null;
let chartEdades = null;
let chartDiasPromedio = null;

// Orden cronológico de meses
const ORDER_MESES = [
    'NOVIEMBRE 2025',
    'DICIEMBRE 2025',
    'ENERO 2026',
    'FEBRERO 2026',
    'MARZO 2026',
    'ABRIL 2026',
    'MAYO 2026',
    'JUNIO 2026',
    'JULIO 2026',
    'AGOSTO 2026',
    'SEPTIEMBRE 2026',
    'OCTUBRE 2026'
];

document.addEventListener('DOMContentLoaded', function() {
    if (typeof data === 'undefined') {
        document.body.innerHTML = '<h1 style="color:red;text-align:center;padding:50px;">❌ Error: No se encontraron datos</h1>';
        return;
    }
    
    allData = data;
    filteredData = [...allData];
    
    populateFilters();
    setupEventListeners();
    updateDashboard();
});

function populateFilters() {
    // Meses (ordenados cronológicamente)
    const meses = [...new Set(allData.map(d => d.mes))].sort((a, b) => {
        return ORDER_MESES.indexOf(a) - ORDER_MESES.indexOf(b);
    });
    const mesContainer = document.getElementById('mesCheckboxes');
    mesContainer.innerHTML = '';
    meses.forEach(mes => {
        const label = document.createElement('label');
        label.className = 'checkbox-label';
        label.innerHTML = `
            <input type="checkbox" class="mes-checkbox" value="${mes}" checked>
            <span>${mes}</span>
        `;
        mesContainer.appendChild(label);
    });

    // Sexos
    const sexos = ['MASCULINO', 'FEMENINO', 'Sin datos'];
    const sexoContainer = document.getElementById('sexoCheckboxes');
    sexoContainer.innerHTML = '';
    sexos.forEach(sexo => {
        const label = document.createElement('label');
        label.className = 'checkbox-label';
        label.innerHTML = `
            <input type="checkbox" class="sexo-checkbox" value="${sexo}" checked>
            <span>${sexo}</span>
        `;
        sexoContainer.appendChild(label);
    });

    // Motivos
    const motivos = [...new Set(allData.map(d => d.motivo))].sort();
    const motivoContainer = document.getElementById('motivoCheckboxes');
    motivoContainer.innerHTML = '';
    motivos.forEach(motivo => {
        if (motivo === 'Sin datos' || motivo === '') return;
        const label = document.createElement('label');
        label.className = 'checkbox-label';
        label.innerHTML = `
            <input type="checkbox" class="motivo-checkbox" value="${motivo}" checked>
            <span>${motivo}</span>
        `;
        motivoContainer.appendChild(label);
    });
}

function setupEventListeners() {
    document.querySelectorAll('.mes-checkbox, .sexo-checkbox, .motivo-checkbox').forEach(cb => {
        cb.addEventListener('change', updateDashboard);
    });

    document.getElementById('resetFilters').addEventListener('click', resetFilters);
    
    document.getElementById('selectAllMeses').addEventListener('click', function() {
        document.querySelectorAll('.mes-checkbox').forEach(cb => cb.checked = true);
        updateDashboard();
    });
    document.getElementById('deselectAllMeses').addEventListener('click', function() {
        document.querySelectorAll('.mes-checkbox').forEach(cb => cb.checked = false);
        updateDashboard();
    });
    
    document.getElementById('selectAllSexos').addEventListener('click', function() {
        document.querySelectorAll('.sexo-checkbox').forEach(cb => cb.checked = true);
        updateDashboard();
    });
    document.getElementById('deselectAllSexos').addEventListener('click', function() {
        document.querySelectorAll('.sexo-checkbox').forEach(cb => cb.checked = false);
        updateDashboard();
    });
    
    document.getElementById('selectAllMotivos').addEventListener('click', function() {
        document.querySelectorAll('.motivo-checkbox').forEach(cb => cb.checked = true);
        updateDashboard();
    });
    document.getElementById('deselectAllMotivos').addEventListener('click', function() {
        document.querySelectorAll('.motivo-checkbox').forEach(cb => cb.checked = false);
        updateDashboard();
    });
}

function getSelectedMeses() {
    return Array.from(document.querySelectorAll('.mes-checkbox:checked')).map(cb => cb.value);
}

function getSelectedSexos() {
    return Array.from(document.querySelectorAll('.sexo-checkbox:checked')).map(cb => cb.value);
}

function getSelectedMotivos() {
    return Array.from(document.querySelectorAll('.motivo-checkbox:checked')).map(cb => cb.value);
}

function updateDashboard() {
    const selectedMeses = getSelectedMeses();
    const selectedSexos = getSelectedSexos();
    const selectedMotivos = getSelectedMotivos();

    filteredData = allData.filter(d => {
        let match = true;
        if (selectedMeses.length > 0) match = match && selectedMeses.includes(d.mes);
        if (selectedSexos.length > 0) match = match && selectedSexos.includes(d.sexo);
        if (selectedMotivos.length > 0) match = match && selectedMotivos.includes(d.motivo);
        return match;
    });

    updateKPIs();
    updateCharts();
    updateTable();
}

function updateKPIs() {
    const total = filteredData.length;
    const edades = filteredData.map(d => d.edad).filter(e => e > 0 && e < 120);
    const edadProm = edades.length > 0 ? Math.round(edades.reduce((a, b) => a + b, 0) / edades.length) : 0;
    
    // === MEDIA CONDICIONAL: Solo considerar casos > 0 ===
    const vniData = filteredData.filter(d => d.diasVNI > 0);
    const vniProm = vniData.length > 0 ? Math.round(vniData.reduce((a, b) => a + b.diasVNI, 0) / vniData.length) : 0;
    
    const cnafData = filteredData.filter(d => d.diasCNAF > 0);
    const cnafProm = cnafData.length > 0 ? Math.round(cnafData.reduce((a, b) => a + b.diasCNAF, 0) / cnafData.length) : 0;
    
    const masculino = filteredData.filter(d => d.sexo === 'MASCULINO').length;
    const femenino = filteredData.filter(d => d.sexo === 'FEMENINO').length;

    document.getElementById('kpiTotal').textContent = total;
    document.getElementById('kpiEdad').textContent = edadProm;
    document.getElementById('kpiVNI').textContent = vniProm + (vniData.length > 0 ? ' (n=' + vniData.length + ')' : '');
    document.getElementById('kpiCNAF').textContent = cnafProm + (cnafData.length > 0 ? ' (n=' + cnafData.length + ')' : '');
    document.getElementById('kpiMasculino').textContent = masculino;
    document.getElementById('kpiFemenino').textContent = femenino;
}

function updateCharts() {
    // Destruir gráficos anteriores
    if (chartPacientesMes) { chartPacientesMes.destroy(); chartPacientesMes = null; }
    if (chartSexo) { chartSexo.destroy(); chartSexo = null; }
    if (chartMotivos) { chartMotivos.destroy(); chartMotivos = null; }
    if (chartEdades) { chartEdades.destroy(); chartEdades = null; }
    if (chartDiasPromedio) { chartDiasPromedio.destroy(); chartDiasPromedio = null; }

    // Obtener meses disponibles y ordenarlos cronológicamente
    const mesesDisponibles = [...new Set(filteredData.map(d => d.mes))];
    const meses = ORDER_MESES.filter(m => mesesDisponibles.includes(m));

    // 1. Pacientes por Mes (ordenado cronológicamente)
    const pacientesPorMes = meses.map(mes => filteredData.filter(d => d.mes === mes).length);

    chartPacientesMes = new Chart(document.getElementById('chartPacientesMes'), {
        type: 'bar',
        data: {
            labels: meses,
            datasets: [{
                label: 'N° Pacientes',
                data: pacientesPorMes,
                backgroundColor: 'rgba(102, 126, 234, 0.7)',
                borderColor: '#667eea',
                borderWidth: 2,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
        }
    });

    // 2. Distribución por Sexo
    const masculino = filteredData.filter(d => d.sexo === 'MASCULINO').length;
    const femenino = filteredData.filter(d => d.sexo === 'FEMENINO').length;
    const sinDatosSexo = filteredData.filter(d => d.sexo === 'Sin datos').length;

    chartSexo = new Chart(document.getElementById('chartSexo'), {
        type: 'doughnut',
        data: {
            labels: ['MASCULINO', 'FEMENINO', 'Sin datos'],
            datasets: [{
                data: [masculino, femenino, sinDatosSexo],
                backgroundColor: ['#4299e1', '#ed64a6', '#a0aec0'],
                borderWidth: 3,
                borderColor: 'white'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { position: 'bottom' } },
            cutout: '55%'
        }
    });

    // 3. Motivos de Conexión
    const motivos = [...new Set(filteredData.map(d => d.motivo))].filter(m => m !== 'Sin datos' && m !== '');
    const motivosCount = motivos.map(m => filteredData.filter(d => d.motivo === m).length);
    const colores = ['#667eea', '#f6ad55', '#68d391', '#fc8181', '#9f7aea', '#ed8936', '#4299e1', '#ed64a6'];

    chartMotivos = new Chart(document.getElementById('chartMotivos'), {
        type: 'bar',
        data: {
            labels: motivos,
            datasets: [{
                label: 'N° Pacientes',
                data: motivosCount,
                backgroundColor: motivosCount.map((_, i) => colores[i % colores.length]),
                borderRadius: 6,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1 } },
                x: { ticks: { maxRotation: 45, minRotation: 30 } }
            }
        }
    });

    // 4. Distribución de Edades (Histograma)
    const edades = filteredData.map(d => d.edad).filter(e => e > 0 && e < 120);
    const bins = [0, 18, 30, 40, 50, 60, 70, 80, 90, 100];
    const labels = ['0-17', '18-29', '30-39', '40-49', '50-59', '60-69', '70-79', '80-89', '90-100'];
    const counts = bins.slice(0, -1).map((bin, i) => {
        return edades.filter(e => e >= bin && e < bins[i + 1]).length;
    });

    chartEdades = new Chart(document.getElementById('chartEdades'), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'N° Pacientes',
                data: counts,
                backgroundColor: 'rgba(246, 173, 85, 0.7)',
                borderColor: '#f6ad55',
                borderWidth: 2,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
        }
    });

    // 5. Promedio de Días VNI y CNAF por Mes (MEDIA CONDICIONAL)
    const vniPorMes = meses.map(mes => {
        const dataMes = filteredData.filter(d => d.mes === mes && d.diasVNI > 0);
        return dataMes.length > 0 ? Math.round(dataMes.reduce((a, b) => a + b.diasVNI, 0) / dataMes.length) : 0;
    });
    
    const cnafPorMes = meses.map(mes => {
        const dataMes = filteredData.filter(d => d.mes === mes && d.diasCNAF > 0);
        return dataMes.length > 0 ? Math.round(dataMes.reduce((a, b) => a + b.diasCNAF, 0) / dataMes.length) : 0;
    });

    // Contar cuántos casos > 0 por mes para mostrar en tooltip
    const vniCountPorMes = meses.map(mes => {
        return filteredData.filter(d => d.mes === mes && d.diasVNI > 0).length;
    });
    
    const cnafCountPorMes = meses.map(mes => {
        return filteredData.filter(d => d.mes === mes && d.diasCNAF > 0).length;
    });

    chartDiasPromedio = new Chart(document.getElementById('chartDiasPromedio'), {
        type: 'bar',
        data: {
            labels: meses,
            datasets: [
                {
                    label: 'Prom. Días VNI',
                    data: vniPorMes,
                    backgroundColor: 'rgba(66, 153, 225, 0.7)',
                    borderColor: '#4299e1',
                    borderWidth: 2,
                    borderRadius: 4
                },
                {
                    label: 'Prom. Días CNAF',
                    data: cnafPorMes,
                    backgroundColor: 'rgba(237, 137, 54, 0.7)',
                    borderColor: '#ed8936',
                    borderWidth: 2,
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { 
                legend: { position: 'top' },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const index = context.dataIndex;
                            const label = context.dataset.label || '';
                            const value = context.parsed.y;
                            const count = label.includes('VNI') ? vniCountPorMes[index] : cnafCountPorMes[index];
                            return label + ': ' + value + ' días (n=' + count + ')';
                        }
                    }
                }
            },
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
        }
    });
}

function updateTable() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';

    if (filteredData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px;color:#a0aec0;">📭 No hay datos para los filtros seleccionados</td></tr>';
        return;
    }

    // Ordenar por mes (cronológico) y luego por edad
    const sortedData = [...filteredData].sort((a, b) => {
        const mesA = ORDER_MESES.indexOf(a.mes);
        const mesB = ORDER_MESES.indexOf(b.mes);
        if (mesA !== mesB) return mesA - mesB;
        return a.edad - b.edad;
    });

    sortedData.slice(0, 100).forEach(d => {
        const tr = document.createElement('tr');
        const mesShort = d.mes.split(' ')[0].toLowerCase();
        tr.innerHTML = `
            <td><span class="badge badge-${mesShort}">${d.mes}</span></td>
            <td>${d.edad}</td>
            <td>${d.sexo}</td>
            <td>${d.motivo}</td>
            <td>${d.diasVNI}</td>
            <td>${d.diasCNAF}</td>
        `;
        tbody.appendChild(tr);
    });
}

function resetFilters() {
    document.querySelectorAll('.mes-checkbox, .sexo-checkbox, .motivo-checkbox').forEach(cb => cb.checked = true);
    updateDashboard();
}
