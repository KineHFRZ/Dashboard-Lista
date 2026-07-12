// script.js - Con tortas en porcentaje y múltiples
let allData = [];
let filteredData = [];
let chartEvolucion = null;
let chartRendimiento = null;

// Array para almacenar múltiples gráficos de torta
let gravedadCharts = [];

document.addEventListener('DOMContentLoaded', function() {
    // Verificar datos
    if (typeof data === 'undefined') {
        document.body.innerHTML = '<h1 style="color:red;text-align:center;padding:50px;">❌ Error: No se encontraron datos. Verifica que data.js esté cargado.</h1>';
        return;
    }
    
    allData = data;
    filteredData = [...allData];
    
    // Poblar filtros
    populateModuloFilter();
    populateMesFilter();
    
    // Event listeners
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
    
    // Inicializar
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
    const meses = ['MAYO', 'JUNIO', 'JULIO'];
    const container = document.getElementById('mesCheckboxes');
    container.innerHTML = '';
    meses.forEach(mes => {
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
}

function updateKPIs() {
    const total = filteredData.reduce((sum, d) => sum + d.total, 0);
    const promedio = filteredData.length > 0 ? Math.round(total / filteredData.length) : 0;
    const rendimientoPromedio = filteredData.length > 0 ? 
        Math.round(filteredData.reduce((sum, d) => sum + d.rendimiento, 0) / filteredData.length) : 0;
    
    document.getElementById('kpiTotal').textContent = total;
    document.getElementById('kpiPromedio').textContent = promedio;
    document.getElementById('kpiRendimiento').textContent = rendimientoPromedio + '%';
    
    // Mejor módulo
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
}

function updateCharts() {
    // === DESTRUIR GRÁFICOS ANTERIORES ===
    if (chartEvolucion) {
        chartEvolucion.destroy();
        chartEvolucion = null;
    }
    if (chartRendimiento) {
        chartRendimiento.destroy();
        chartRendimiento = null;
    }
    
    // Destruir gráficos de torta anteriores
    gravedadCharts.forEach(chart => chart.destroy());
    gravedadCharts = [];
    
    // === GRÁFICO 1: Evolución de Atenciones ===
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
            maintainAspectRatio: true,
            plugins: { legend: { display: true, position: 'top' } },
            scales: { y: { beginAtZero: true, min: 0 } }
        }
    });
    
    // === GRÁFICO 2: Múltiples Tortas de Gravedad (en porcentaje) ===
    const container = document.getElementById('gravedadContainer');
    container.innerHTML = '';
    
    // Determinar qué módulos mostrar
    const selectedModulos = getSelectedModulos();
    let modulosMostrar = [];
    
    if (selectedModulos.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#a0aec0;padding:20px;">📭 Selecciona al menos un módulo</p>';
    } else {
        modulosMostrar = selectedModulos.filter(m => m !== 'Gine').sort();
        
        if (modulosMostrar.length === 0 || filteredData.length === 0) {
            container.innerHTML = '<p style="text-align:center;color:#a0aec0;padding:20px;">📭 No hay datos para los filtros seleccionados</p>';
        } else {
            // Crear una torta por cada módulo
            modulosMostrar.forEach(modulo => {
                const dataModulo = filteredData.filter(d => d.modulo === modulo);
                
                if (dataModulo.length === 0) return;
                
                const leve = dataModulo.reduce((sum, d) => sum + d.leve, 0);
                const mod = dataModulo.reduce((sum, d) => sum + d.mod, 0);
                const sev = dataModulo.reduce((sum, d) => sum + d.sev, 0);
                const total = leve + mod + sev;
                
                // Calcular porcentajes
                const levePct = total > 0 ? Math.round((leve / total) * 100) : 0;
                const modPct = total > 0 ? Math.round((mod / total) * 100) : 0;
                const sevPct = total > 0 ? Math.round((sev / total) * 100) : 0;
                
                // Crear contenedor para esta torta
                const item = document.createElement('div');
                item.className = 'torta-item';
                
                const titleModulo = document.createElement('h4');
                titleModulo.textContent = modulo + ' (n=' + total + ')';
                item.appendChild(titleModulo);
                
                const canvas = document.createElement('canvas');
                canvas.id = 'torta-' + modulo.replace(/\s/g, '');
                item.appendChild(canvas);
                
                // Mostrar porcentajes en texto
                const leyenda = document.createElement('div');
                leyenda.className = 'torta-leyenda';
                leyenda.innerHTML = `
                    <span style="color:#48bb78;">● Leve ${levePct}%</span> | 
                    <span style="color:#ed8936;">● Moderado ${modPct}%</span> | 
                    <span style="color:#fc8181;">● Severo ${sevPct}%</span>
                `;
                item.appendChild(leyenda);
                
                container.appendChild(item);
                
                // Crear el gráfico
                const ctx = canvas.getContext('2d');
                const chart = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Leve', 'Moderado', 'Severo'],
                        datasets: [{
                            data: [leve, mod, sev],
                            backgroundColor: ['#48bb78', '#ed8936', '#fc8181'],
                            borderWidth: 2,
                            borderColor: 'white'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: true,
                        plugins: {
                            legend: { 
                                display: false
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                        const percentage = total > 0 ? Math.round((context.parsed / total) * 100) : 0;
                                        return context.label + ': ' + context.parsed + ' (' + percentage + '%)';
                                    }
                                }
                            }
                        },
                        cutout: '55%'
                    }
                });
                
                gravedadCharts.push(chart);
            });
        }
    }
    
    // === GRÁFICO 3: Rendimiento por Módulo ===
    const modulosRendimiento = {};
    filteredData.forEach(d => {
        if (d.modulo === 'Gine') return;
        if (!modulosRendimiento[d.modulo]) modulosRendimiento[d.modulo] = [];
        modulosRendimiento[d.modulo].push(d.rendimiento);
    });
    
    const modulos = Object.keys(modulosRendimiento).sort();
    const rendimientos = modulos.map(modulo => {
        const rends = modulosRendimiento[modulo];
        return Math.round(rends.reduce((a, b) => a + b, 0) / rends.length);
    });
    
    chartRendimiento = new Chart(document.getElementById('chartRendimiento'), {
        type: 'bar',
        data: {
            labels: modulos,
            datasets: [{
                label: 'Rendimiento Promedio (%)',
                data: rendimientos,
                backgroundColor: rendimientos.map(r => 
                    r >= 80 ? '#48bb78' : 
                    r >= 60 ? '#ed8936' : 
                    '#fc8181'
                ),
                borderRadius: 8,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { callback: function(value) { return value + '%'; } }
                },
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 30
                    }
                }
            }
        }
    });
}

function updateTable() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';
    
    if (filteredData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:30px;color:#a0aec0;">📭 No hay datos para los filtros seleccionados</td></tr>';
        return;
    }
    
    const sorted = [...filteredData].sort((a, b) => {
        if (a.mes !== b.mes) return a.mes.localeCompare(b.mes);
        return a.dia - b.dia;
    });
    
    sorted.forEach(d => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${d.dia}</strong></td>
            <td><span class="badge badge-${d.mes.toLowerCase()}">${d.mes}</span></td>
            <td>${d.modulo}</td>
            <td><strong>${d.total}</strong></td>
            <td>${d.leve}</td>
            <td>${d.mod}</td>
            <td>${d.sev}</td>
            <td style="color:${d.rendimiento >= 80 ? '#48bb78' : d.rendimiento >= 60 ? '#ed8936' : '#fc8181'};font-weight:600;">${d.rendimiento}%</td>
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
