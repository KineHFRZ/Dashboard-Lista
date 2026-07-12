// script.js - Con tortas múltiples por módulo y porcentajes
let allData = [];
let filteredData = [];

// Variables para los gráficos
let chartEvolucion = null;
let chartRendimiento = null;
let chartsGravedad = []; // Array para múltiples tortas

document.addEventListener('DOMContentLoaded', function() {
    // Verificar que los datos existen
    if (typeof data === 'undefined') {
        console.error('❌ Error: data.js no está cargado');
        alert('Error: No se encontraron datos. Verifica que data.js esté cargado.');
        return;
    }
    
    allData = data;
    filteredData = [...allData];
    populateModuloFilter();
    
    // Event listeners
    document.getElementById('mesFilter').addEventListener('change', updateDashboard);
    document.getElementById('moduloFilter').addEventListener('change', updateDashboard);
    document.getElementById('diaFilter').addEventListener('input', function() {
        document.getElementById('diaValue').textContent = this.value;
        updateDashboard();
    });
    document.getElementById('resetFilters').addEventListener('click', resetFilters);
    
    // Inicializar dashboard
    updateDashboard();
});

function populateModuloFilter() {
    const modulos = [...new Set(allData.map(d => d.modulo))].sort();
    const select = document.getElementById('moduloFilter');
    modulos.forEach(modulo => {
        if (modulo !== 'Gine') {
            const option = document.createElement('option');
            option.value = modulo;
            option.textContent = modulo;
            select.appendChild(option);
        }
    });
}

function updateDashboard() {
    // Obtener filtros
    const mes = document.getElementById('mesFilter').value;
    const modulo = document.getElementById('moduloFilter').value;
    const diaMax = parseInt(document.getElementById('diaFilter').value);
    
    // Aplicar filtros
    filteredData = allData.filter(d => {
        let match = true;
        if (mes !== 'todos') match = match && d.mes === mes;
        if (modulo !== 'todos') match = match && d.modulo === modulo;
        if (diaMax < 31) match = match && d.dia <= diaMax;
        return match;
    });
    
    // Actualizar KPIs
    updateKPIs();
    
    // Actualizar gráficos
    updateCharts();
    
    // Actualizar tabla
    updateTable();
}

function updateKPIs() {
    const total = filteredData.reduce((sum, d) => sum + d.total, 0);
    const promedio = filteredData.length > 0 ? Math.round(total / filteredData.length) : 0;
    const rendimientoPromedio = filteredData.length > 0 ? 
        Math.round(filteredData.reduce((sum, d) => sum + d.rendimiento, 0) / filteredData.length) : 0;
    
    // Calcular mejor módulo
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
    
    document.getElementById('kpiTotal').textContent = total;
    document.getElementById('kpiPromedio').textContent = promedio;
    document.getElementById('kpiRendimiento').textContent = rendimientoPromedio + '%';
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
    
    // Destruir tortas anteriores
    chartsGravedad.forEach(chart => chart.destroy());
    chartsGravedad = [];
    
    // === GRÁFICO 1: Evolución de Atenciones ===
    const dias = [...new Set(filteredData.map(d => d.dia))].sort((a, b) => a - b);
    const totalesPorDia = dias.map(dia => 
        filteredData.filter(d => d.dia === dia).reduce((sum, d) => sum + d.total, 0)
    );
    
    const ctx1 = document.getElementById('chartEvolucion').getContext('2d');
    chartEvolucion = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: dias,
            datasets: [{
                label: 'Total Atenciones',
                data: totalesPorDia,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 3,
                tension: 0.3,
                fill: true,
                pointRadius: 4,
                pointBackgroundColor: '#667eea'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { 
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                },
                x: {
                    title: { display: true, text: 'Día del Mes' }
                }
            }
        }
    });
    
    // === GRÁFICO 2: Múltiples Tortas de Gravedad ===
    const container = document.getElementById('gravedadContainer');
    container.innerHTML = '';
    
    // Determinar qué módulos mostrar
    const moduloSeleccionado = document.getElementById('moduloFilter').value;
    const meses = document.getElementById('mesFilter').value;
    
    let modulosMostrar = [];
    if (moduloSeleccionado === 'todos') {
        // Si está "Todos", mostrar todos los módulos
        modulosMostrar = [...new Set(filteredData.map(d => d.modulo))].filter(m => m !== 'Gine').sort();
    } else {
        // Si está seleccionado uno, mostrar solo ese
        modulosMostrar = [moduloSeleccionado];
    }
    
    // Si no hay datos o módulos, mostrar mensaje
    if (modulosMostrar.length === 0 || filteredData.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#a0aec0;padding:20px;">No hay datos para mostrar</p>';
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
            
            const title = document.createElement('h4');
            title.textContent = modulo + ' (n=' + total + ')';
            item.appendChild(title);
            
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
            
            chartsGravedad.push(chart);
        });
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
    
    const ctx3 = document.getElementById('chartRendimiento').getContext('2d');
    chartRendimiento = new Chart(ctx3, {
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
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) { return value + '%'; }
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
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
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:20px;color:#a0aec0;">📭 No hay datos para los filtros seleccionados</td></tr>';
        return;
    }
    
    // Ordenar por mes y día
    const sortedData = [...filteredData].sort((a, b) => {
        if (a.mes !== b.mes) return a.mes.localeCompare(b.mes);
        return a.dia - b.dia;
    });
    
    sortedData.forEach(d => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${d.dia}</td>
            <td><span class="badge badge-${d.mes.toLowerCase()}">${d.mes}</span></td>
            <td>${d.modulo}</td>
            <td><strong>${d.total}</strong></td>
            <td>${d.leve}</td>
            <td>${d.mod}</td>
            <td>${d.sev}</td>
            <td>${d.rendimiento}%</td>
        `;
        tbody.appendChild(tr);
    });
}

function resetFilters() {
    document.getElementById('mesFilter').value = 'todos';
    document.getElementById('moduloFilter').value = 'todos';
    document.getElementById('diaFilter').value = '31';
    document.getElementById('diaValue').textContent = '31';
    updateDashboard();
}
