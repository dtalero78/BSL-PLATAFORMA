# Documentación de Cambios en nuevaorden2.html

## Resumen Ejecutivo

**¿Qué se cambió?** El archivo `nuevaorden2.html` ahora funciona igual que `nuevaorden1.html` (asignación directa a médico NUBIA con horarios ilimitados), pero siempre usa `codEmpresa: 'PARTICULAR'` en lugar de `SANITHELP-JJ`.

**¿Por qué?** Se acabaron los turnos con médicos diferentes a NUBIA.

**¿Cómo revertir?** Consultar la sección "Cómo revertir los cambios" al final de este documento.

---

## Fecha del cambio
2026-01-08

## Motivo del cambio
Se acabaron los turnos con médicos diferentes a NUBIA. La página `nuevaorden2.html` estaba diseñada para asignar médicos automáticamente basándose en disponibilidad real consultada desde el servidor. Como ya no hay disponibilidad de otros médicos, se modificó para funcionar igual que `nuevaorden1.html` (asignación directa a NUBIA).

## Cambios realizados

### 1. Cambio de codEmpresa por defecto
**ANTES:**
```javascript
// Línea 1228
let codEmpresa = wixCedula ? 'PARTICULAR' : 'SANITHELP-JJ';
```

**DESPUÉS:**
```javascript
// Línea 1228
let codEmpresa = 'PARTICULAR';  // CAMBIO 2026-01-08: Siempre PARTICULAR en lugar de SANITHELP-JJ
```

### 2. Asignación de médico fija a NUBIA
**ANTES:**
```javascript
// Líneas 1271-1273
modalidad: 'virtual',
// Indicar que se debe asignar médico automáticamente (excluyendo NUBIA)
asignarMedicoAuto: true
```

**DESPUÉS:**
```javascript
// Líneas 1271-1273
// CAMBIO 2026-01-08: Asignar directamente a NUBIA en lugar de asignación automática
medico: 'NUBIA'
// modalidad: 'virtual',  // COMENTADO - Ya no se usa modalidad virtual con asignación automática
// asignarMedicoAuto: true  // COMENTADO - Ya no se asigna médico automáticamente
```

### 3. Generación de horarios sin consultar servidor
**ANTES:**
```javascript
// Líneas 957-1024
async function actualizarHoras() {
    const fecha = document.getElementById('dia').value;
    if (!fecha) return;

    const select = document.getElementById('horaSelect');
    select.innerHTML = '<option value="">Cargando horarios disponibles...</option>';

    try {
        // Consultar turnos disponibles para modalidad virtual
        const codEmpresaActual = obtenerCodempresaActual();
        const response = await fetch(`/api/turnos-disponibles?fecha=${fecha}&modalidad=virtual&codEmpresa=${encodeURIComponent(codEmpresaActual)}`);
        const result = await response.json();

        // ... más código de validación y filtrado de turnos
    } catch (error) {
        console.error('Error al cargar horarios:', error);
        select.innerHTML = '<option value="">Error al cargar horarios</option>';
    }
}
```

**DESPUÉS:**
```javascript
// Líneas 957-1024
function actualizarHoras() {
    const fecha = document.getElementById('dia').value;
    if (!fecha) return;

    // CAMBIO 2026-01-08: NUBIA no tiene restricción de cupo - genera horas directamente sin verificar ocupación
    generarHorasDisponibles(fecha);
}

function generarHorasDisponibles(fecha) {
    // Genera horarios de 8 AM a 8 PM en intervalos de 10 minutos
    // Sin consultar disponibilidad al servidor
    // ... código similar a nuevaorden1.html
}
```

## Cómo revertir los cambios

Cuando vuelva a haber disponibilidad de médicos diferentes a NUBIA, seguir estos pasos:

### Paso 1: Restaurar codEmpresa original
En la línea ~1228, cambiar:
```javascript
let codEmpresa = 'PARTICULAR';  // CAMBIO 2026-01-08: Siempre PARTICULAR en lugar de SANITHELP-JJ
```

Por:
```javascript
let codEmpresa = wixCedula ? 'PARTICULAR' : 'SANITHELP-JJ';
```

### Paso 2: Restaurar asignación automática de médico
En las líneas ~1271-1273, cambiar:
```javascript
// CAMBIO 2026-01-08: Asignar directamente a NUBIA en lugar de asignación automática
medico: 'NUBIA'
// modalidad: 'virtual',  // COMENTADO - Ya no se usa modalidad virtual con asignación automática
// asignarMedicoAuto: true  // COMENTADO - Ya no se asigna médico automáticamente
```

Por:
```javascript
modalidad: 'virtual',
// Indicar que se debe asignar médico automáticamente (excluyendo NUBIA)
asignarMedicoAuto: true
```

### Paso 3: Restaurar función actualizarHoras() con consulta al servidor
En las líneas ~957-1024, reemplazar toda la función `actualizarHoras()` y eliminar la función `generarHorasDisponibles()` por la versión original que consulta el endpoint `/api/turnos-disponibles`.

**Buscar en el historial de Git:**
```bash
git log --all --full-history -- public/nuevaorden2.html
git show <commit-hash>:public/nuevaorden2.html > nuevaorden2-original.html
```

O restaurar desde el commit antes de este cambio (2026-01-08).

## Impacto del cambio

### Antes del cambio:
- ✅ Médicos asignados según disponibilidad real
- ✅ Control de cupos por médico
- ✅ Integración con sistema de turnos
- ❌ Ya no hay médicos disponibles (excepto NUBIA)

### Después del cambio:
- ✅ Todas las citas se asignan a NUBIA
- ✅ Sin límite de cupos (múltiples citas simultáneas)
- ✅ Horarios generados estáticamente (8 AM - 8 PM)
- ✅ codEmpresa siempre 'PARTICULAR' en lugar de 'SANITHELP-JJ'
- ℹ️ Funciona igual que nuevaorden1.html pero con codEmpresa diferente

## Referencias
- Archivo modificado: `/public/nuevaorden2.html`
- Archivo de referencia: `/public/nuevaorden1.html`
- Commit del cambio: (pendiente de git commit)
