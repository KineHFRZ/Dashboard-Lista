<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard Atenciones Bloque Médico Quirúrgico</title>
    <link rel="stylesheet" href="style.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <div class="dashboard">
        <!-- Header -->
        <header class="header">
            <h1>🏥 Dashboard Atenciones Bloque Médico Quirúrgico</h1>
            <p>Consolidado de Atenciones Clínicas</p>
        </header>

        <!-- Filtros -->
        <section class="filters">
            <div class="filter-group">
                <label for="mesFilter">Mes:</label>
                <select id="mesFilter">
                    <option value="todos">Todos</option>
                    <option value="MAYO">MAYO</option>
                    <option value="JUNIO">JUNIO</option>
                    <option value="JULIO">JULIO</option>
                </select>
            </div>
            <div class="filter-group">
                <label for="moduloFilter">Módulo:</label>
                <select id="moduloFilter">
                    <option value="todos">Todos</option>
                </select>
            </div>
            <div class="filter-group">
                <label for="diaFilter">Día:</label>
                <input type="range" id="diaFilter" min="1" max="31" value="31">
                <span id="diaValue">31</span>
            </div>
            <button id="resetFilters">🔄 Resetear Filtros</button>
        </section>

        <!-- KPIs -->
        <section class="kpi-grid">
            <div class="kpi-card">
                <h3>Total Atenciones</h3>
                <p id="kpiTotal">0</p>
            </div>
            <div class="kpi-card">
                <h3>Promedio Diario</h3>
                <p id="kpiPromedio">0</p>
            </div>
            <div class="kpi-card">
                <h3>Rendimiento Promedio</h3>
                <p id="kpiRendimiento">0%</p>
            </div>
            <div class="kpi-card">
                <h3>Módulo con Mejor Rendimiento</h3>
                <p id="kpiMejorModulo">-</p>
            </div>
        </section>

        <!-- Gráficos -->
        <section class="charts-grid">
            <div class="chart-card">
                <h2>📈 Evolución de Atenciones por Día</h2>
                <canvas id="chartEvolucion"></canvas>
            </div>
            <div class="chart-card">
                <h2>📊 Distribución por Gravedad</h2>
                <div id="gravedadContainer">
                    <!-- Los gráficos de torta se generan dinámicamente -->
                </div>
            </div>
            <div class="chart-card full-width">
                <h2>🎯 Rendimiento por Módulo</h2>
                <canvas id="chartRendimiento"></canvas>
            </div>
        </section>

        <!-- Tabla de Datos -->
        <section class="table-section">
            <h2>📋 Detalle de Datos</h2>
            <div class="table-container">
                <table id="dataTable">
                    <thead>
                        <tr>
                            <th>Día</th>
                            <th>Mes</th>
                            <th>Módulo</th>
                            <th>Total</th>
                            <th>Leve</th>
                            <th>Moderado</th>
                            <th>Severo</th>
                            <th>Rendimiento %</th>
                        </tr>
                    </thead>
                    <tbody id="tableBody">
                    </tbody>
                </table>
            </div>
        </section>
    </div>

    <script src="data.js"></script>
    <script src="script.js"></script>
</body>
</html>
