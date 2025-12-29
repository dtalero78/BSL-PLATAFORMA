# BSL Wix MCP Server

Servidor MCP (Model Context Protocol) para consultar la base de datos de Wix a través de los HTTP functions existentes de BSL Plataforma.

## Instalación

1. Instalar dependencias:
```bash
cd mcp-wix-server
npm install
```

2. Configurar en Claude Code:

Agregar esta configuración a tu archivo de configuración de Claude Code (usualmente en `~/.config/claude-code/config.json` o similar):

```json
{
  "mcpServers": {
    "bsl-wix": {
      "command": "node",
      "args": ["/Users/danieltalero/BSL-PLATAFORMA/BSL-PLATAFORMA/mcp-wix-server/index.js"]
    }
  }
}
```

3. Reiniciar Claude Code para cargar el servidor MCP.

## Herramientas Disponibles

### 1. `get_historia_clinica_por_fecha`
Obtener registros de HistoriaClinica de Wix filtrados por fecha de consulta.

**Parámetros:**
- `fecha` (string, requerido): Fecha en formato YYYY-MM-DD

**Uso:**
```
Obtener historia clínica de Wix para el 2025-01-15
```

**Casos de uso:**
- Verificar qué pacientes tienen datos médicos en Wix para una fecha específica
- Comparar con PostgreSQL para identificar registros pendientes de sincronización
- Debugging cuando un paciente muestra datos incompletos

### 2. `get_exportar_historia_clinica`
Exportar HistoriaClinica de Wix con paginación.

**Parámetros:**
- `skip` (number, opcional): Registros a saltar (default: 0)
- `limit` (number, opcional): Cantidad de registros (default: 100, máximo: 1000)
- `desde` (string, opcional): Fecha desde (YYYY-MM-DD)

**Uso:**
```
Exportar los primeros 50 registros de historia clínica desde 2025-01-01
```

**Casos de uso:**
- Migraciones de datos
- Verificación de integridad de datos completos
- Análisis de registros históricos

### 3. `get_formulario_por_id`
Obtener un formulario específico por su ID de Wix.

**Parámetros:**
- `_id` (string, requerido): ID del formulario en Wix

**Uso:**
```
Obtener formulario de Wix con ID abc123-def456
```

**Casos de uso:**
- Verificar datos originales de un paciente específico
- Comparar datos entre PostgreSQL y Wix
- Debugging de discrepancias

### 4. `buscar_paciente_wix`
Buscar todos los registros de un paciente por número de identificación.

**Parámetros:**
- `numeroId` (string, requerido): Número de identificación del paciente

**Uso:**
```
Buscar paciente con cédula 1234567890 en Wix
```

**Casos de uso:**
- Ver historial médico completo de un paciente
- Identificar registros duplicados
- Verificar sincronización de datos del paciente

### 5. `get_adctests`
Obtener pruebas ADC (Alcohol y Drogas) de Wix con filtros opcionales.

**Parámetros:**
- `numeroId` (string, opcional): Número de identificación del paciente
- `fechaInicio` (string, opcional): Fecha inicio en formato YYYY-MM-DD (requiere fechaFin)
- `fechaFin` (string, opcional): Fecha fin en formato YYYY-MM-DD (requiere fechaInicio)

**Uso:**
```
Obtener todas las pruebas ADC del paciente 1234567890
```
```
Obtener pruebas ADC entre 2025-01-01 y 2025-01-31
```

**Casos de uso:**
- Consultar resultados de pruebas de alcohol y drogas
- Verificar resultados por rango de fechas
- Auditoría de pruebas realizadas

### 6. `get_adctest_por_id_general`
Obtener prueba ADC específica por su idGeneral (ID que vincula con el formulario/orden).

**Parámetros:**
- `idGeneral` (string, requerido): ID general que vincula la prueba ADC con el formulario/orden

**Uso:**
```
Obtener prueba ADC con idGeneral abc-123-def
```

**Casos de uso:**
- Obtener resultado de prueba ADC específica de una orden
- Verificar datos de prueba vinculados a un formulario
- Comparar resultados entre Wix y PostgreSQL

## Ejemplos de Uso en Claude Code

Una vez configurado, puedes usar lenguaje natural para consultar Wix:

```
¿Qué pacientes tienen consulta el 2025-01-20 en Wix?
```

```
Muéstrame los datos de Wix para el formulario con ID abc-123
```

```
Busca todos los registros del paciente 1234567890 en Wix y compáralos con PostgreSQL
```

```
Exporta los últimos 100 registros de historia clínica desde 2025-01-01
```

```
Muéstrame las pruebas ADC del paciente 1234567890
```

```
Obtén la prueba ADC asociada al idGeneral abc-123
```

## Arquitectura

```
Claude Code
    ↓
MCP Server (este servidor)
    ↓
HTTP Functions de Wix (https://www.bsl.com.co/_functions/)
    ↓
Wix CMS Database
```

Este servidor actúa como un puente entre Claude Code y los HTTP functions existentes, permitiendo consultas estructuradas a la base de datos de Wix sin necesidad de ejecutar scripts de sincronización.

## Troubleshooting

### Error de conexión
Si no puedes conectarte a Wix, verifica:
1. Que los HTTP functions estén desplegados en Wix
2. Que la URL base sea correcta: `https://www.bsl.com.co/_functions`
3. Conectividad a internet

### El servidor MCP no aparece en Claude Code
1. Verifica que la ruta en la configuración sea absoluta y correcta
2. Asegúrate de haber instalado las dependencias (`npm install`)
3. Reinicia Claude Code completamente
4. Revisa los logs de Claude Code para errores de inicialización

### Límite de paginación
La herramienta `buscar_paciente_wix` actualmente consulta los últimos 1000 registros. Si necesitas buscar en un dataset más grande, considera:
1. Usar filtros de fecha con `desde`
2. Implementar un endpoint específico de búsqueda en Wix
3. Aumentar el límite (con cuidado por temas de rendimiento)

## Desarrollo

Para probar el servidor localmente:

```bash
node index.js
```

El servidor espera comunicación a través de stdio (stdin/stdout) según el protocolo MCP.

## Notas Importantes

- Este servidor es **read-only** - solo consulta datos, no los modifica
- Los datos provienen directamente de Wix (source of truth para datos médicos)
- No requiere credenciales adicionales ya que usa endpoints públicos de Wix
- Respeta el modelo de sincronización existente (Wix → PostgreSQL)
