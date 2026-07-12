// script.js - VERSIÓN OPTIMIZADA CON GRÁFICOS DESCRIPTIVOS
let allData = [];
let filteredData = [];

// Variables para los gráficos
let chartEvolucion = null;
let chartGravedad = null;
let chartRendimiento = null;
let chartRendimientoMensual = null;

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
    
    // Actualizar todo
    updateKPIs();
    updateCharts();
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
    if (chartGravedad) {
        chartGravedad.destroy();
        chartGravedad = null;
    }
    if (chartRendimiento) {
        chartRendimiento.destroy();
        chartRendimiento = null;
    }
    if (chartRendimientoMensual) {
        chartRendimientoMensual.destroy();
        chartRendimientoMensual = null;
    }
    
    // ============================================
    // GRÁFICO 1: Evolución de Atenciones por Día (CORREGIDO)
    // ============================================
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
                backgroundColor: 'rgba(102, 126, 234, 0.15)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointRadius: 5,
                pointBackgroundColor: '#667eea',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: { size: 13, weight: 'bold' }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Total Atenciones: ' + context.parsed.y;
                        }
                    }
                }
            },
            scales: {
                y: { 
                    beginAtZero: true,
                    min: 0,
                    ticks: { 
                        stepSize: 5,
                        font: { size: 11 }
                    },
                    title: {
                        display: true,
                        text: 'Número de Atenciones',
                        font: { size: 12, weight: 'bold' }
                    }
                },
                x: {
                    title: { 
                        display: true, 
                        text: 'Día del Mes',
                        font: { size: 12, weight: 'bold' }
                    },
                    ticks: { 
                        stepSize: 2,
                        font: { size: 10 }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
    
    // ============================================
    // GRÁFICO 2: Distribución por Gravedad
    // ============================================
    const leveTotal = filteredData.reduce((sum, d) => sum + d.leve, 0);
    const modTotal = filteredData.reduce((sum, d) => sum + d.mod, 0);
    const sevTotal = filteredData.reduce((sum, d) => sum + d.sev, 0);
    
    const ctx2 = document.getElementById('chartGravedad').getContext('2d');
    chartGravedad = new Chart(ctx2, {
        type: 'doughnut',
        data: {
            labels: ['🟢 Leve', '🟡 Moderado', '🔴 Severo'],
            datasets: [{
                data: [leveTotal, modTotal, sevTotal],
                backgroundColor: ['#48bb78', '#ed8936', '#fc8181'],
                borderWidth: 3,
                borderColor: 'white',
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { 
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        font: { size: 13 }
                    }
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
            cutout: '65%'
        }
    });
    
    // ============================================
    // GRÁFICO 3: Rendimiento por Módulo (PROMEDIO GENERAL)
    // ============================================
    const moduloSeleccionado = document.getElementById('moduloFilter').value;
    const mesSeleccionado = document.getElementById('mesFilter').value;
    
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
    
    // Ordenar de mayor a menor rendimiento
    const combined = modulos.map((modulo, index) => ({
        modulo: modulo,
        rendimiento: rendimientos[index]
    }));
    combined.sort((a, b) => b.rendimiento - a.rendimiento);
    
    const sortedModulos = combined.map(item => item.modulo);
    const sortedRendimientos = combined.map(item => item.rendimiento);
    
    const ctx3 = document.getElementById('chartRendimiento').getContext('2d');
    chartRendimiento = new Chart(ctx3, {
        type: 'bar',
        data: {
            labels: sortedModulos,
            datasets: [{
                label: 'Rendimiento Promedio (%)',
                data: sortedRendimientos,
                backgroundColor: sortedRendimientos.map(r => 
                    r >= 80 ? '#48bb78' : 
                    r >= 60 ? '#ed8936' : 
                    '#fc8181'
                ),
                borderRadius: 8,
                borderSkipped: false,
                barPercentage: 0.7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Rendimiento: ' + context.parsed.y + '%';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) { return value + '%'; },
                        font: { size: 11 }
                    },
                    title: {
                        display: true,
                        text: 'Porcentaje (%)',
                        font: { size: 12, weight: 'bold' }
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 30,
                        font: { size: 10 }
                    }
                }
            }
        }
    });
    
    // ============================================
    // GRÁFICO 4: Rendimiento Mensual por Módulo (NUEVO)
    // ============================================
    const ctx4 = document.getElementById('chartRendimientoMensual').getContext('2d');
    
    let datosMensuales = {};
    let mesesDisponibles = ['MAYO', 'JUNIO', 'JULIO'];
    
    // Si hay un módulo seleccionado, mostrar su rendimiento por mes
    if (moduloSeleccionado !== 'todos') {
        // Filtrar datos por módulo
        const dataModulo = allData.filter(d => d.modulo === moduloSeleccionado && d.modulo !== 'Gine');
        
        // Agrupar por mes y calcular promedio
        mesesDisponibles.forEach(mes => {
            const dataMes = dataModulo.filter(d => d.mes === mes);
            if (dataMes.length > 0) {
                const promedio = dataMes.reduce((sum, d) => sum + d.rendimiento, 0) / dataMes.length;
                datosMensuales[mes] = Math.round(promedio);
            } else {
                datosMensuales[mes] = 0;
            }
        });
        
        // Si hay filtro de mes, solo mostrar ese mes
        if (mesSeleccionado !== 'todos') {
            const temp = {};
            temp[mesSeleccionado] = datosMensuales[mesSeleccionado] || 0;
            datosMensuales = temp;
        }
        
        chartRendimientoMensual = new Chart(ctx4, {
            type: 'bar',
            data: {
                labels: Object.keys(datosMensuales),
                datasets: [{
                    label: 'Rendimiento Mensual - ' + moduloSeleccionado,
                    data: Object.values(datosMensuales),
                    backgroundColor: ['#f6ad55', '#68d391', '#fc8181'],
                    borderRadius: 8,
                    borderSkipped: false,
                    barPercentage: 0.5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { 
                        display: true,
                        position: 'top',
                        labels: {
                            font: { size: 12, weight: 'bold' }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return 'Rendimiento: ' + context.parsed.y + '%';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) { return value + '%'; },
                            font: { size: 11 }
                        },
                        title: {
                            display: true,
                            text: 'Rendimiento (%)',
                            font: { size: 12, weight: 'bold' }
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Mes',
                            font: { size: 12, weight: 'bold' }
                        }
                    }
                }
            }
        });
    } else {
        // Si no hay módulo seleccionado, mostrar comparativa por módulo y mes
        const modulosUnicos = [...new Set(allData.filter(d => d.modulo !== 'Gine').map(d => d.modulo))].sort();
        
        // Colores por mes
        const coloresMeses = {
            'MAYO': 'rgba(246, 173, 85, 0.8)',
            'JUNIO': 'rgba(104, 211, 145, 0.8)',
            'JULIO': 'rgba(252, 129, 129, 0.8)'
        };
        
        const datasets = mesesDisponibles.map(mes => {
            const dataMes = modulosUnicos.map(modulo => {
                const dataModulo = allData.filter(d => d.modulo === modulo && d.mes === mes);
                if (dataModulo.length > 0) {
                    return Math.round(dataModulo.reduce((sum, d) => sum + d.rendimiento, 0) / dataModulo.length);
                }
                return 0;
            });
            
            return {
                label: mes,
                data: dataMes,
                backgroundColor: coloresMeses[mes] || 'rgba(200, 200, 200, 0.8)',
                borderRadius: 4,
                borderSkipped: false,
                barPercentage: 0.6
            };
        });
        
        chartRendimientoMensual = new Chart(ctx4, {
            type: 'bar',
            data: {
                labels: modulosUnicos,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { 
                        display: true,
                        position: 'top',
                        labels: {
                            font: { size: 12, weight: 'bold' },
                            usePointStyle: true,
                            padding: 15
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + context.parsed.y + '%';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) { return value + '%'; },
                            font: { size: 11 }
                        },
                        title: {
                            display: true,
                            text: 'Rendimiento (%)',
                            font: { size: 12, weight: 'bold' }
                        }
                    },
                    x: {
                        ticks: {
                            maxRotation: 45,
                            minRotation: 30,
                            font: { size: 9 }
                        }
                    }
                }
            }
        });
    }
}

function updateTable() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';
    
    if (filteredData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:30px;color:#a0aec0;font-size:1.1em;">📭 No hay datos para los filtros seleccionados</td></tr>';
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
            <td><strong>${d.dia}</strong></td>
            <td><span class="badge badge-${d.mes.toLowerCase()}">${d.mes}</span></td>
            <td>${d.modulo}</td>
            <td><strong>${d.total}</strong></td>
            <td>${d.leve}</td>
            <td>${d.mod}</td>
            <td>${d.sev}</td>
            <td><span style="color: ${d.rendimiento >= 80 ? '#48bb78' : d.rendimiento >= 60 ? '#ed8936' : '#fc8181'}; font-weight: 600;">${d.rendimiento}%</span></td>
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
