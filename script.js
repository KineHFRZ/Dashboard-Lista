// script.js
let allData = [];
let filteredData = [];

document.addEventListener('DOMContentLoaded', function() {
    allData = data;
    filteredData = [...allData];
    populateModuloFilter();
    document.getElementById('mesFilter').addEventListener('change', updateDashboard);
    document.getElementById('moduloFilter').addEventListener('change', updateDashboard);
    document.getElementById('diaFilter').addEventListener('input', function() {
        document.getElementById('diaValue').textContent = this.value;
        updateDashboard();
    });
    document.getElementById('resetFilters').addEventListener('click', resetFilters);
    updateDashboard();
});

function populateModuloFilter() {
    const modulos = [...new Set(allData.map(d => d.modulo))].sort();
    const select = document.getElementById('moduloFilter');
    modulos.forEach(modulo => {
        const option = document.createElement('option');
        option.value = modulo;
        option.textContent = modulo;
        select.appendChild(option);
    });
}

function updateDashboard() {
    const mes = document.getElementById('mesFilter').value;
    const modulo = document.getElementById('moduloFilter').value;
    const diaMax = parseInt(document.getElementById('diaFilter').value);
    
    filteredData = allData.filter(d => {
        let match = true;
        if (mes !== 'todos') match = match && d.mes === mes;
        if (modulo !== 'todos') match = match && d.modulo === modulo;
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
    
    const modulosRendimiento = {};
    filteredData.forEach(d => {
        if (!modulosRendimiento[d.modulo]) modulosRendimiento[d.modulo] = [];
        modulosRendimiento[d.modulo].push(d.rendimiento);
    });
    
    let mejorModulo = '-';
    let mejorPromedio = -1;
    for (const [modulo, rendimientos] of Object.entries(modulosRendimiento)) {
        const promedioMod = rendimientos.reduce((a, b) => a + b, 0) / rendimientos.length;
        if (promedioMod > mejorPromedio && modulo !== 'Gine') {
            mejorPromedio = promedioMod;
            mejorModulo = modulo;
        }
    }
    
    document.getElementById('kpiTotal').textContent = total;
    document.getElementById('kpiPromedio').textContent = promedio;
    document.getElementById('kpiRendimiento').textContent = rendimientoPromedio + '%';
    document.getElementById('kpiMejorModulo').textContent = mejorModulo + ' (' + Math.round(mejorPromedio) + '%)';
}

function updateCharts() {
    // Gráfico 1: Evolución
    const dias = [...new Set(filteredData.map(d => d.dia))].sort();
    const totalesPorDia = dias.map(dia => 
        filteredData.filter(d => d.dia === dia).reduce((sum, d) => sum + d.total, 0)
    );
    
    new Chart(document.getElementById('chartEvolucion'), {
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
                fill: true
            }]
        },
        options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    });
    
    // Gráfico 2: Gravedad
    const leveTotal = filteredData.reduce((sum, d) => sum + d.leve, 0);
    const modTotal = filteredData.reduce((sum, d) => sum + d.mod, 0);
    const sevTotal = filteredData.reduce((sum, d) => sum + d.sev, 0);
    
    new Chart(document.getElementById('chartGravedad'), {
        type: 'doughnut',
        data: {
            labels: ['Leve', 'Moderado', 'Severo'],
            datasets: [{
                data: [leveTotal, modTotal, sevTotal],
                backgroundColor: ['#48bb78', '#ed8936', '#fc8181'],
                borderWidth: 3,
                borderColor: 'white'
            }]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });
    
    // Gráfico 3: Rendimiento por módulo
    const modulosRendimiento = {};
    filteredData.forEach(d => {
        if (!modulosRendimiento[d.modulo]) modulosRendimiento[d.modulo] = [];
        modulosRendimiento[d.modulo].push(d.rendimiento);
    });
    
    const modulos = Object.keys(modulosRendimiento).filter(m => m !== 'Gine');
    const rendimientos = modulos.map(modulo => {
        const rends = modulosRendimiento[modulo];
        return Math.round(rends.reduce((a, b) => a + b, 0) / rends.length);
    });
    
    new Chart(document.getElementById('chartRendimiento'), {
        type: 'bar',
        data: {
            labels: modulos,
            datasets: [{
                label: 'Rendimiento Promedio (%)',
                data: rendimientos,
                backgroundColor: rendimientos.map(r => r >= 80 ? '#48bb78' : r >= 60 ? '#ed8936' : '#fc8181'),
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, max: 100, ticks: { callback: function(value) { return value + '%'; } } } }
        }
    });
}

function updateTable() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';
    filteredData.forEach(d => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${d.dia}</td><td>${d.mes}</td><td>${d.modulo}</td><td>${d.total}</td><td>${d.leve}</td><td>${d.mod}</td><td>${d.sev}</td><td>${d.rendimiento}%</td>`;
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
