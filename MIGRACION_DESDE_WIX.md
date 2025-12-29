# Migración de Datos desde Wix a PostgreSQL

Este documento describe el proceso de migración de datos desde Wix CMS hacia PostgreSQL para BSL Plataforma.

## Tablas Migradas

| Tabla Wix | Tabla PostgreSQL | Registros (~) |
|-----------|------------------|---------------|
| HistoriaClinica | HistoriaClinica | 108,000+ |
| FORMULARIO | formularios | 76,000+ |
| ADCTEST | pruebasADC | 58,000+ |

---

## Endpoints de Wix para Exportación

### 1. Exportar HistoriaClinica

**URL:** `https://www.bsl.com.co/_functions/exportarHistoriaClinica`

**Parámetros:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `skip` | number | Registros a saltar (paginación) |
| `limit` | number | Máximo 1000 por restricción de Wix |
| `desde` | string | Fecha mínima YYYY-MM-DD (opcional) |

**Ejemplo:**
```
GET /_functions/exportarHistoriaClinica?skip=0&limit=1000&desde=2025-12-20
```

**Respuesta:**
```json
{
  "success": true,
  "items": [...],
  "count": 1000,
  "totalCount": 108000,
  "skip": 0,
  "hasMore": true,
  "nextSkip": 1000
}
```

### 2. Exportar Formularios

**URL:** `https://www.bsl.com.co/_functions/exportarFormulario`

**Parámetros:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `skip` | number | Registros a saltar (paginación) |
| `limit` | number | Máximo 1000 (recomendado 200 por tamaño de firmas base64) |
| `desde` | string | Fecha mínima YYYY-MM-DD (opcional) |

**Ejemplo:**
```
GET /_functions/exportarFormulario?skip=0&limit=200&desde=2025-12-20
```

### 3. Exportar ADCTEST (Pruebas Psicológicas)

**URL:** `https://www.bsl.com.co/_functions/exportarADCTEST`

**Parámetros:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `skip` | number | Registros a saltar (paginación) |
| `limit` | number | Máximo 1000 (recomendado 500 por cantidad de campos) |
| `desde` | string | Fecha mínima YYYY-MM-DD (opcional) |

**Ejemplo:**
```
GET /_functions/exportarADCTEST?skip=0&limit=500&desde=2025-12-20
```

**Respuesta:**
```json
{
  "success": true,
  "items": [...],
  "count": 500,
  "totalCount": 58010,
  "skip": 0,
  "hasMore": true,
  "nextSkip": 500
}
```

**Nota Importante:** En la colección ADCTEST de Wix, el campo `numeroId` contiene el UUID de `HistoriaClinica._id` (no el documento del paciente). El documento del paciente está en el campo `documento`.

---

## Scripts de Migración

### migracion-historia-clinica.js

Migra registros de la colección `HistoriaClinica` de Wix.

**Uso:**
```bash
# Migración completa
node migracion-historia-clinica.js

# Migrar solo desde una fecha específica
node migracion-historia-clinica.js --desde=2025-12-20

# Continuar desde un punto específico (si se interrumpió)
node migracion-historia-clinica.js --skip=50000

# Solo verificar conteos sin migrar
node migracion-historia-clinica.js --verify

# Modo prueba (solo 1000 registros)
node migracion-historia-clinica.js --test

# Dry run (no inserta, solo muestra)
node migracion-historia-clinica.js --dry-run
```

**Configuración:**
- Lotes de 1000 registros (máximo de Wix)
- Pausa de 2 segundos entre lotes
- 3 reintentos con backoff exponencial
- Timeout de 2 minutos por petición

### migracion-formulario.js

Migra registros de la colección `FORMULARIO` de Wix.

**Uso:**
```bash
# Migración completa
node migracion-formulario.js

# Migrar solo desde una fecha específica
node migracion-formulario.js --desde=2025-12-20

# Otras opciones igual que historia-clinica
```

**Configuración:**
- Lotes de 200 registros (menor por tamaño de firmas base64)
- Pausa de 4 segundos entre lotes
- 5 reintentos con backoff exponencial
- Timeout de 3 minutos por petición

### migracion-adc-test.js

Migra registros de la colección `ADCTEST` de Wix (Pruebas Psicológicas ADC: Ansiedad, Depresión, Comportamiento).

**Uso:**
```bash
# Migración completa
node migracion-adc-test.js

# Migrar solo desde una fecha específica
node migracion-adc-test.js --desde=2025-12-20

# Continuar desde un punto específico (si se interrumpió)
node migracion-adc-test.js --skip=10000

# Solo verificar conteos sin migrar
node migracion-adc-test.js --verify

# Modo prueba (solo 1000 registros)
node migracion-adc-test.js --test

# Dry run (no inserta, solo muestra)
node migracion-adc-test.js --dry-run
```

**Configuración:**
- Lotes de 500 registros (balanceado por cantidad de campos)
- Pausa de 3 segundos entre lotes
- 5 reintentos con backoff exponencial
- Timeout de 3 minutos por petición

**Mapeo de Campos Clave:**
- `numeroId` (Wix) → `orden_id` (PostgreSQL) - Contiene el UUID de HistoriaClinica._id
- `documento` (Wix) → `numero_id` (PostgreSQL) - Documento del paciente
- 64 campos de preguntas psicológicas (de*, an*, co*) se mapean directamente

---

## Estrategia de Migración

### UPSERT (Insert or Update)

Los scripts usan `ON CONFLICT DO UPDATE` para:
- Insertar registros nuevos
- Actualizar registros existentes (si ya existen por `_id`)
- No duplicar datos si se ejecuta múltiples veces

### Mapeo de Campos

**HistoriaClinica:** Los campos se mapean directamente ya que ambas tablas usan los mismos nombres (camelCase).

**Formularios:** Se hace conversión de camelCase (Wix) a snake_case (PostgreSQL):
```
primerNombre → primer_nombre
numeroId → numero_id
fechaRegistro → fecha_registro
```

### Campo `origen`

Todos los registros migrados tienen `origen = 'WIX'` para distinguirlos de registros creados directamente en PostgreSQL (`origen = 'POSTGRES'`).

---

## Post-Migración: Corrección del Campo `examenes`

Wix guarda el campo `examenes` como array, lo que resulta en formato PostgreSQL array:
```
{"Examen Médico Osteomuscular","Audiometría","Optometría"}
```

Debe convertirse a texto separado por comas:
```
Examen Médico Osteomuscular, Audiometría, Optometría
```

**Script de corrección:**
```sql
UPDATE "HistoriaClinica"
SET "examenes" = TRIM(
    REPLACE(
        REPLACE(
            REPLACE(
                REPLACE("examenes", '{', ''),
                '}', ''
            ),
            '","', ', '
        ),
        '"', ''
    )
)
WHERE "examenes" LIKE '{%}';
```

**Ejecutar después de cada migración:**
```bash
node -e "
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
});

async function fix() {
    const result = await pool.query(\`
        UPDATE \"HistoriaClinica\"
        SET \"examenes\" = TRIM(
            REPLACE(REPLACE(REPLACE(REPLACE(\"examenes\", '{', ''), '}', ''), '\",\"', ', '), '\"', '')
        )
        WHERE \"examenes\" LIKE '{%}'
    \`);
    console.log('Registros corregidos:', result.rowCount);
    await pool.end();
}
fix();
"
```

---

## Migración Incremental (Recomendado)

Para mantener PostgreSQL sincronizado con Wix sin re-migrar todo:

```bash
# Migrar solo registros nuevos desde una fecha
node migracion-historia-clinica.js --desde=2025-12-25
node migracion-formulario.js --desde=2025-12-25
node migracion-adc-test.js --desde=2025-12-25
```

**Frecuencia sugerida:** Ejecutar diariamente o semanalmente dependiendo del volumen.

---

## Archivos de Wix Modificados

Para soportar el filtro `desde`, se modificaron:

### backend/exposeDataBase.js

```javascript
export async function exportarTodaHistoriaClinica(skip = 0, limit = 1000, desde = null) {
    let query = wixData.query("HistoriaClinica");

    if (desde) {
        const fechaDesde = new Date(desde);
        query = query.ge("_createdDate", fechaDesde);
    }

    // ... resto de la función
}

export async function exportarTodoFormulario(skip = 0, limit = 1000, desde = null) {
    let query = wixData.query("FORMULARIO");

    if (desde) {
        const fechaDesde = new Date(desde);
        query = query.ge("_createdDate", fechaDesde);
    }

    // ... resto de la función
}

export async function exportarADCTEST(skip = 0, limit = 1000, desde = null) {
    let query = wixData.query("ADCTEST");

    if (desde) {
        const fechaDesde = new Date(desde);
        query = query.ge("_createdDate", fechaDesde);
    }

    // ... resto de la función
}
```

### backend/http-functions.js

```javascript
export async function get_exportarHistoriaClinica(request) {
    const { skip = '0', limit = '1000', desde = null } = request.query;
    const resultado = await exportarTodaHistoriaClinica(skipNum, limitNum, desde);
    // ...
}

export async function get_exportarFormulario(request) {
    const { skip = '0', limit = '1000', desde = null } = request.query;
    const resultado = await exportarTodoFormulario(skipNum, limitNum, desde);
    // ...
}

export async function get_exportarADCTEST(request) {
    const { skip = '0', limit = '1000', desde = null } = request.query;
    const resultado = await exportarADCTEST(skipNum, limitNum, desde);
    // ...
}
```

---

## Troubleshooting

### Error: HTTP 504 Gateway Timeout

Wix tiene límite de tiempo de ejecución. Soluciones:
- Reducir `limit` (de 1000 a 500 o 200)
- El script reintenta automáticamente

### Error: "duplicate key value violates unique constraint"

No debería ocurrir con UPSERT, pero si pasa:
- Verificar que el `_id` sea único
- El UPSERT actualiza en lugar de fallar

### Registros faltantes

Verificar conteos:
```bash
node migracion-historia-clinica.js --verify
```

---

## Historial de Migraciones

| Fecha | Tipo | Registros HC | Registros Form | Notas |
|-------|------|--------------|----------------|-------|
| 2025-12-20 | Inicial | ~106,000 | ~75,000 | Migración masiva completa |
| 2025-12-25 | Incremental | 684 | 671 | Desde 2025-12-20 |
