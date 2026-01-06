const fs = require('fs');

// Leer server.js
const serverPath = './server.js';
let content = fs.readFileSync(serverPath, 'utf8');
const lines = content.split('\n');

// Secciones a eliminar (basado en las líneas encontradas)
const sectionsToRemove = [
    { start: 1528, end: 1639, name: 'Funciones sistema chat' },
    { start: 10535, end: 11291, name: 'Endpoints sistema chat + SSE' }
];

// Eliminar líneas en orden inverso para no descuadrar los índices
for (const section of sectionsToRemove.reverse()) {
    console.log(`Eliminando ${section.name} (líneas ${section.start}-${section.end})`);
    lines.splice(section.start - 1, section.end - section.start + 1);
}

// Guardar archivo modificado
fs.writeFileSync(serverPath, lines.join('\n'), 'utf8');

console.log('✅ server.js limpiado correctamente');
console.log(`Total de líneas eliminadas: ${sectionsToRemove.reduce((sum, s) => sum + (s.end - s.start + 1), 0)}`);
