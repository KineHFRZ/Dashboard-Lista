// data.js - Tus datos consolidados de MAYO, JUNIO y JULIO
const data = [
  // MAYO
  { dia: 1, mes: 'MAYO', modulo: 'UTI 5to', total: 30, leve: 22, mod: 0, sev: 0, rendimiento: 93 },
  { dia: 1, mes: 'MAYO', modulo: 'Medicina B', total: 24, leve: 12, mod: 2, sev: 1, rendimiento: 50 },
  { dia: 1, mes: 'MAYO', modulo: 'Medicina C', total: 25, leve: 20, mod: 0, sev: 0, rendimiento: 44 },
  { dia: 1, mes: 'MAYO', modulo: 'Medicina D', total: 27, leve: 23, mod: 1, sev: 0, rendimiento: 26 },
  { dia: 1, mes: 'MAYO', modulo: 'Medicina E', total: 15, leve: 12, mod: 0, sev: 1, rendimiento: 0 },
  // JUNIO
  { dia: 1, mes: 'JUNIO', modulo: 'UTI 5to', total: 22, leve: 17, mod: 0, sev: 0, rendimiento: 1 },
  { dia: 1, mes: 'JUNIO', modulo: 'Medicina B', total: 31, leve: 19, mod: 4, sev: 0, rendimiento: 48 },
  { dia: 1, mes: 'JUNIO', modulo: 'Medicina C', total: 26, leve: 18, mod: 2, sev: 1, rendimiento: 54 },
  { dia: 1, mes: 'JUNIO', modulo: 'Medicina D', total: 31, leve: 19, mod: 4, sev: 1, rendimiento: 39 },
  { dia: 1, mes: 'JUNIO', modulo: 'Medicina E', total: 25, leve: 20, mod: 1, sev: 0, rendimiento: 80 },
  // JULIO
  { dia: 1, mes: 'JULIO', modulo: 'UTI 5to', total: 26, leve: 15, mod: 2, sev: 0, rendimiento: 85 },
  { dia: 1, mes: 'JULIO', modulo: 'Medicina B', total: 29, leve: 23, mod: 1, sev: 0, rendimiento: 41 },
  { dia: 1, mes: 'JULIO', modulo: 'Medicina C', total: 29, leve: 20, mod: 3, sev: 0, rendimiento: 55 },
  { dia: 1, mes: 'JULIO', modulo: 'Medicina D', total: 26, leve: 20, mod: 1, sev: 0, rendimiento: 46 },
  { dia: 1, mes: 'JULIO', modulo: 'Medicina E', total: 30, leve: 19, mod: 2, sev: 1, rendimiento: 63 },
  // Agrega todos los días aquí (del 1 al 31) con todos los módulos
  // Puedes generarlo automáticamente con un script o completarlo manualmente
];

// Exportar para usar en otros archivos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = data;
}
