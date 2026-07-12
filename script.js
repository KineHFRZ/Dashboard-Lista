// script.js - VERSIÓN CON SELECCIÓN MÚLTIPLE Y GRÁFICOS MEJORADOS
let allData = [];
let filteredData = [];

// Variables para los gráficos
let chartEvolucion = null;
let chartGravedad = null;
let chartRendimiento = null;

document.addEventListener('DOMContentLoaded', function() {
    // Verificar que los datos existen
    if (typeof data === 'undefined') {
        console.error('❌ Error: data.js no está cargado');
        alert('Error: No se encontraron datos. Verifica que data.js esté cargado.');
        return;
    }
    
    allData = data;
    filteredData = [...allData];
    
    // Poblar filtros
    populateModuloFilter();
    populateMesFilter();
    
    // Event listeners para checkboxes
    document.querySelectorAll('.modulo-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', updateDashboard);
    });
    document.querySelectorAll('.mes-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', updateDashboard);
    });
    
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
    
    // Inicializar dashboard
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
    const checkboxes = document.querySelectorAll('.modulo-checkbox:checked');
    return Array.from(checkboxes).map(cb => cb.value);
}

function getSelectedMeses() {
    const checkboxes = document.querySelectorAll('.mes-checkbox:checked');
    return Array.from(checkboxes).map(cb => cb.value);
}

function updateDashboard() {
    // Obtener filtros
    const selectedModulos = getSelectedModulos();
    const selectedMeses = getSelectedMeses();
    const diaMax = parseInt(document.getElementById('diaFilter').value);
    
    // Aplicar filtros
    filteredData = allData.filter(d => {
        let match = true;
        if (selectedModulos.length > 0) match = match && selectedModulos.includes(d.modulo);
        if (selectedMeses.length > 0) match = match && selectedMeses.includes(d.mes);
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
    
    // ============================================
    // GRÁFICO 1: Evolución de Atenciones por Día
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
    // GRÁFICO 3: Rendimiento por Módulo (DESGLOSADO POR MES + PROMEDIO)
    // ============================================
    const selectedModulos = getSelectedModulos();
    const selectedMeses = getSelectedMeses();
    const mesesDisponibles = ['MAYO', 'JUNIO', 'JULIO'];
    
    // Si hay módulos seleccionados
    if (selectedModulos.length > 0) {
        // Colores para cada mes
        const coloresMeses = {
            'MAYO': 'rgba(246, 173, 85, 0.8)',
            'JUNIO': 'rgba(104, 211, 145, 0.8)',
            'JULIO': 'rgba(252, 129, 129, 0.8)'
        };
        
        // Si solo hay un módulo seleccionado, mostrar desglose mensual + promedio
        if (selectedModulos.length === 1) {
            const modulo = selectedModulos[0];
            const datosModulo = filteredData.filter(d => d.modulo === modulo);
            
            // Calcular promedio por mes
            const promediosMensuales = {};
            mesesDisponibles.forEach(mes => {
                const dataMes = datosModulo.filter(d => d.mes === mes);
                if (dataMes.length > 0) {
                    promediosMensuales[mes] = Math.round(dataMes.reduce((sum, d) => sum + d.rendimiento, 0) / dataMes.length);
                } else {
                    promediosMensuales[mes] = 0;
                }
            });
            
            // Calcular promedio total
            const totalRendimiento = datosModulo.reduce((sum, d) => sum + d.rendimiento, 0);
            const promedioTotal = datosModulo.length > 0 ? Math.round(totalRendimiento / datosModulo.length) : 0;
            
            // Filtrar meses si hay selección
            let labels = mesesDisponibles;
            let data = mesesDisponibles.map(mes => promediosMensuales[mes]);
            
            if (selectedMeses.length > 0 && selectedMeses.length < 3) {
                labels = selectedMeses;
                data = selectedMeses.map(mes => promediosMensuales[mes]);
            }
            
            const ctx3 = document.getElementById('chartRendimiento').getContext('2d');
            chartRendimiento = new Chart(ctx3, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Rendimiento Mensual',
                            data: data,
                            backgroundColor: labels.map(mes => coloresMeses[mes] || 'rgba(200, 200, 200, 0.8)'),
                            borderRadius: 8,
                            borderSkipped: false,
                            barPercentage: 0.6,
                            order: 1
                        },
                        {
                            label: 'Promedio Total: ' + promedioTotal + '%',
                            data: labels.map(() => promedioTotal),
                            type: 'line',
                            borderColor: '#2d3748',
                            backgroundColor: 'rgba(45, 55, 72, 0.1)',
                            borderWidth: 3,
                            borderDash: [8, 4],
                            pointRadius: 5,
                            pointBackgroundColor: '#2d3748',
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2,
                            fill: false,
                            tension: 0,
                            order: 0
                        }
                    ]
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
                                    if (context.dataset.label.includes('Promedio')) {
                                        return context.dataset.label;
                                    }
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
            // Múltiples módulos seleccionados - Mostrar comparativa por mes y módulo
            const datasets = [];
            
            // Colores para módulos
            const coloresModulos = [
                'rgba(102, 126, 234, 0.8)',
                'rgba(246, 173, 85, 0.8)',
                'rgba(104, 211, 145, 0.8)',
                'rgba(252, 129, 129, 0.8)',
                'rgba(159, 122, 234, 0.8)',
                'rgba(237, 137, 54, 0.8)'
            ];
            
            // Determinar qué meses mostrar
            let mesesMostrar = mesesDisponibles;
            if (selectedMeses.length > 0 && selectedMeses.length < 3) {
                mesesMostrar = selectedMeses;
            }
            
            selectedModulos.forEach((modulo, index) => {
                const datosModulo = filteredData.filter(d => d.modulo === modulo);
                const dataPorMes = mesesMostrar.map(mes => {
                    const dataMes = datosModulo.filter(d => d.mes === mes);
                    if (dataMes.length > 0) {
                        return Math.round(dataMes.reduce((sum, d) => sum + d.rendimiento, 0) / dataMes.length);
                    }
                    return 0;
                });
                
                // Calcular promedio del módulo
                const promedioModulo = datosModulo.length > 0 ? 
                    Math.round(datosModulo.reduce((sum, d) => sum + d.rendimiento, 0) / datosModulo.length) : 0;
                
                datasets.push({
                    label: modulo + ' (Prom: ' + promedioModulo + '%)',
                    data: dataPorMes,
                    backgroundColor: coloresModulos[index % coloresModulos.length],
                    borderRadius: 4,
                    borderSkipped: false,
                    barPercentage: 0.7
                });
            });
            
            const ctx3 = document.getElementById('chartRendimiento').getContext('2d');
            chartRendimiento = new Chart(ctx3, {
                type: 'bar',
                data: {
                    labels: mesesMostrar,
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
                                font: { size: 11 },
                                usePointStyle: true,
                                padding: 12
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
                            title: {
                                display: true,
                                text: 'Mes',
                                font: { size: 12, weight: 'bold' }
                            }
                        }
                    }
                }
            });
        }
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
    document.querySelectorAll('.modulo-checkbox').forEach(cb => cb.checked = true);
    document.querySelectorAll('.mes-checkbox').forEach(cb => cb.checked = true);
    document.getElementById('diaFilter').value = '31';
    document.getElementById('diaValue').textContent = '31';
    updateDashboard();
}
