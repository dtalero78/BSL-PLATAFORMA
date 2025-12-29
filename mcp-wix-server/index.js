#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fetch from 'node-fetch';

const WIX_BASE_URL = 'https://www.bsl.com.co/_functions';

class WixMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'bsl-wix-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
    this.setupErrorHandling();
  }

  setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'get_historia_clinica_por_fecha',
          description: 'Obtener registros de HistoriaClinica de Wix por fecha de consulta. Útil para verificar qué datos médicos están en Wix para sincronizar.',
          inputSchema: {
            type: 'object',
            properties: {
              fecha: {
                type: 'string',
                description: 'Fecha de consulta en formato YYYY-MM-DD (ej: 2025-01-15)',
              },
            },
            required: ['fecha'],
          },
        },
        {
          name: 'get_exportar_historia_clinica',
          description: 'Exportar HistoriaClinica de Wix con paginación. Incluye todos los campos médicos. Útil para migraciones o verificación de datos completos.',
          inputSchema: {
            type: 'object',
            properties: {
              skip: {
                type: 'number',
                description: 'Número de registros a saltar (para paginación)',
                default: 0,
              },
              limit: {
                type: 'number',
                description: 'Cantidad de registros a retornar (máximo 1000)',
                default: 100,
              },
              desde: {
                type: 'string',
                description: 'Fecha desde (formato YYYY-MM-DD) para filtrar registros',
              },
            },
          },
        },
        {
          name: 'get_formulario_por_id',
          description: 'Obtener un formulario específico de Wix por su _id. Útil para verificar datos de pacientes individuales.',
          inputSchema: {
            type: 'object',
            properties: {
              _id: {
                type: 'string',
                description: 'ID del formulario en Wix',
              },
            },
            required: ['_id'],
          },
        },
        {
          name: 'buscar_paciente_wix',
          description: 'Buscar paciente en Wix HistoriaClinica por número de identificación. Retorna todos los registros del paciente ordenados por fecha.',
          inputSchema: {
            type: 'object',
            properties: {
              numeroId: {
                type: 'string',
                description: 'Número de identificación del paciente',
              },
            },
            required: ['numeroId'],
          },
        },
        {
          name: 'get_adctests',
          description: 'Obtener pruebas ADC (Alcohol y Drogas) de Wix. Puede filtrar por número de identificación del paciente y/o rango de fechas.',
          inputSchema: {
            type: 'object',
            properties: {
              numeroId: {
                type: 'string',
                description: 'Número de identificación del paciente (opcional)',
              },
              fechaInicio: {
                type: 'string',
                description: 'Fecha inicio del rango en formato YYYY-MM-DD (opcional, requiere fechaFin)',
              },
              fechaFin: {
                type: 'string',
                description: 'Fecha fin del rango en formato YYYY-MM-DD (opcional, requiere fechaInicio)',
              },
            },
          },
        },
        {
          name: 'get_adctest_por_id_general',
          description: 'Obtener prueba ADC específica de Wix por su idGeneral (ID que vincula con el formulario/orden).',
          inputSchema: {
            type: 'object',
            properties: {
              idGeneral: {
                type: 'string',
                description: 'ID general que vincula la prueba ADC con el formulario/orden',
              },
            },
            required: ['idGeneral'],
          },
        },
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'get_historia_clinica_por_fecha':
            return await this.getHistoriaClinicaPorFecha(args.fecha);

          case 'get_exportar_historia_clinica':
            return await this.getExportarHistoriaClinica(
              args.skip || 0,
              args.limit || 100,
              args.desde
            );

          case 'get_formulario_por_id':
            return await this.getFormularioPorId(args._id);

          case 'buscar_paciente_wix':
            return await this.buscarPacienteWix(args.numeroId);

          case 'get_adctests':
            return await this.getAdcTests(args.numeroId, args.fechaInicio, args.fechaFin);

          case 'get_adctest_por_id_general':
            return await this.getAdcTestPorIdGeneral(args.idGeneral);

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async getHistoriaClinicaPorFecha(fecha) {
    const url = `${WIX_BASE_URL}/get_historiaClinicaPorFecha`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fecha }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  async getExportarHistoriaClinica(skip, limit, desde) {
    const url = `${WIX_BASE_URL}/get_exportarHistoriaClinica`;

    const body = { skip, limit };
    if (desde) {
      body.desde = desde;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  async getFormularioPorId(_id) {
    const url = `${WIX_BASE_URL}/get_formularioPorId`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ _id }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  async buscarPacienteWix(numeroId) {
    const url = `${WIX_BASE_URL}/get_exportarHistoriaClinica`;

    // Buscar en un rango amplio, luego filtraremos por numeroId
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ skip: 0, limit: 1000 }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Filtrar por numeroId
    const pacienteRecords = data.items?.filter(
      (item) => item.numeroId === numeroId
    ) || [];

    // Ordenar por fecha de atención descendente
    pacienteRecords.sort((a, b) => {
      const dateA = a.fechaAtencion ? new Date(a.fechaAtencion) : new Date(0);
      const dateB = b.fechaAtencion ? new Date(b.fechaAtencion) : new Date(0);
      return dateB - dateA;
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            numeroId,
            totalRecords: pacienteRecords.length,
            records: pacienteRecords,
          }, null, 2),
        },
      ],
    };
  }

  async getAdcTests(numeroId, fechaInicio, fechaFin) {
    const url = `${WIX_BASE_URL}/get_adctests`;

    // Construir query params
    const params = new URLSearchParams();
    if (numeroId) {
      params.append('numeroId', numeroId);
    }
    if (fechaInicio) {
      params.append('fechaInicio', fechaInicio);
    }
    if (fechaFin) {
      params.append('fechaFin', fechaFin);
    }

    const fullUrl = params.toString() ? `${url}?${params.toString()}` : url;

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  async getAdcTestPorIdGeneral(idGeneral) {
    const url = `${WIX_BASE_URL}/get_adctestPorIdGeneral?idGeneral=${encodeURIComponent(idGeneral)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('BSL Wix MCP server running on stdio');
  }
}

const server = new WixMCPServer();
server.run().catch(console.error);
