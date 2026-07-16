// script.js - Versión Simplificada
let allData = [];
let filteredData = [];
let chartEvolucion = null;
let chartGravedad = null;
let chartRendimiento = null;

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
    // Destruir gráficos anteriores
    if (chartEvolucion) { chartEvolucion.destroy(); chartEvolucion = null; }
    if (chartGravedad) { chartGravedad.destroy(); chartGravedad = null; }
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
    const leve = filteredData.reduce((sum, d) => sum + d.leve, 0);
    const mod = filteredData.reduce((sum, d) => sum + d.mod, 0);
    const sev = filteredData.reduce((sum, d) => sum + d.sev, 0);
    
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
    
    // Gráfico 3: Rendimiento
    const selectedModulos = getSelectedModulos();
    const selectedMeses = getSelectedMeses();
    const meses = ['MAYO', 'JUNIO', 'JULIO'];
    
    if (selectedModulos.length === 1) {
        // Un módulo: mostrar por mes + promedio
        const modulo = selectedModulos[0];
        const datosModulo = filteredData.filter(d => d.modulo === modulo);
        
        const promediosMensuales = meses.map(mes => {
            const dataMes = datosModulo.filter(d => d.mes === mes);
            return dataMes.length > 0 ? Math.round(dataMes.reduce((sum, d) => sum + d.rendimiento, 0) / dataMes.length) : 0;
        });
        
        const promedioTotal = datosModulo.length > 0 ? 
            Math.round(datosModulo.reduce((sum, d) => sum + d.rendimiento, 0) / datosModulo.length) : 0;
        
        let labels = meses;
        let data = promediosMensuales;
        if (selectedMeses.length > 0 && selectedMeses.length < 3) {
            labels = selectedMeses;
            data = selectedMeses.map(mes => promediosMensuales[meses.indexOf(mes)]);
        }
        
        chartRendimiento = new Chart(document.getElementById('chartRendimiento'), {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Rendimiento Mensual',
                        data: data,
                        backgroundColor: ['#f6ad55', '#68d391', '#fc8181'],
                        borderRadius: 8,
                        barPercentage: 0.6
                    },
                    {
                        label: 'Promedio Total: ' + promedioTotal + '%',
                        data: labels.map(() => promedioTotal),
                        type: 'line',
                        borderColor: '#2d3748',
                        borderWidth: 3,
                        borderDash: [8, 4],
                        pointRadius: 5,
                        pointBackgroundColor: '#2d3748',
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: { 
                    legend: { position: 'top' },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                if (context.dataset.label.includes('Promedio')) {
                                    return context.dataset.label;
                                }
                                return context.dataset.label + ': ' + context.parsed.y + '%';
                            }
                        }
                    }
                },
                scales: {
                    y: { beginAtZero: true, max: 100, ticks: { callback: v => v + '%' } }
                }
            }
        });
    } else {
        // Múltiples módulos: barras agrupadas
        const datasets = [];
        const colores = ['#667eea', '#f6ad55', '#68d391', '#fc8181', '#9f7aea', '#ed8936'];
        
        let labels = meses;
        if (selectedMeses.length > 0 && selectedMeses.length < 3) {
            labels = selectedMeses;
        }
        
        selectedModulos.forEach((modulo, index) => {
            const dataPorMes = labels.map(mes => {
                const dataMes = filteredData.filter(d => d.modulo === modulo && d.mes === mes);
                return dataMes.length > 0 ? Math.round(dataMes.reduce((sum, d) => sum + d.rendimiento, 0) / dataMes.length) : 0;
            });
            const promedio = dataPorMes.reduce((a, b) => a + b, 0) / dataPorMes.length;
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
                scales: {
                    y: { beginAtZero: true, max: 100, ticks: { callback: v => v + '%' } }
                }
            }
        });
    }
}

function updateTable() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';
    
    if (filteredData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:30px;color:#a0aec0;">📭 No hay datos</td></tr>';
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
