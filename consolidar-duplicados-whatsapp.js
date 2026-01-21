require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
});

async function consolidar() {
    try {
        console.log('🔧 Consolidando registros duplicados en conversaciones_whatsapp...\n');

        // Buscar todos los números que tienen duplicados (+573... y 573...)
        const duplicados = await pool.query(`
            SELECT
                REPLACE(celular, '+', '') as numero_normalizado,
                COUNT(*) as total,
                array_agg(id ORDER BY fecha_inicio ASC) as ids,
                array_agg(celular ORDER BY fecha_inicio ASC) as celulares,
                array_agg("stopBot" ORDER BY fecha_inicio ASC) as stopBots,
                array_agg(bot_activo ORDER BY fecha_inicio ASC) as bot_activos,
                array_agg(paciente_id ORDER BY fecha_inicio ASC) as paciente_ids,
                array_agg(nombre_paciente ORDER BY fecha_inicio ASC) as nombres
            FROM conversaciones_whatsapp
            GROUP BY REPLACE(celular, '+', '')
            HAVING COUNT(*) > 1
            ORDER BY MAX(fecha_ultima_actividad) DESC
        `);

        console.log(`📋 Encontrados ${duplicados.rows.length} números con registros duplicados\n`);

        let consolidados = 0;

        for (const dup of duplicados.rows) {
            // Identificar el registro "bueno" (el que tiene datos completos)
            const ids = dup.ids;
            const celulares = dup.celulares;
            const stopBots = dup.stopbots;
            const botActivos = dup.bot_activos;
            const pacienteIds = dup.paciente_ids;
            const nombres = dup.nombres;

            // Preferencia: registro sin + y con paciente_id
            let indiceBueno = -1;
            for (let i = 0; i < celulares.length; i++) {
                if (!celulares[i].startsWith('+') && pacienteIds[i]) {
                    indiceBueno = i;
                    break;
                }
            }

            // Si no hay ninguno sin +, usar el primero con datos
            if (indiceBueno === -1) {
                for (let i = 0; i < pacienteIds.length; i++) {
                    if (pacienteIds[i]) {
                        indiceBueno = i;
                        break;
                    }
                }
            }

            // Si aún no hay, usar el primero
            if (indiceBueno === -1) indiceBueno = 0;

            const idBueno = ids[indiceBueno];
            const celularBueno = celulares[indiceBueno];
            const pacienteIdBueno = pacienteIds[indiceBueno];
            const nombreBueno = nombres[indiceBueno];

            console.log(`\n📱 ${dup.numero_normalizado}:`);
            console.log(`   Registros encontrados: ${dup.total}`);
            celulares.forEach((cel, i) => {
                const marca = i === indiceBueno ? '✓ MANTENER' : '✗ ELIMINAR';
                console.log(`   ${marca} ID:${ids[i]} - ${cel} - ${nombres[i] || 'sin nombre'}`);
            });

            // Actualizar mensajes para que apunten al registro bueno
            const idsAEliminar = ids.filter((id, i) => i !== indiceBueno);

            if (idsAEliminar.length > 0) {
                // Mover mensajes al registro bueno
                await pool.query(`
                    UPDATE mensajes_whatsapp
                    SET conversacion_id = $1
                    WHERE conversacion_id = ANY($2::int[])
                `, [idBueno, idsAEliminar]);

                // Eliminar registros duplicados
                await pool.query(`
                    DELETE FROM conversaciones_whatsapp
                    WHERE id = ANY($1::int[])
                `, [idsAEliminar]);

                // Actualizar el registro bueno con la info más completa
                await pool.query(`
                    UPDATE conversaciones_whatsapp
                    SET "stopBot" = true,
                        bot_activo = false,
                        paciente_id = COALESCE(paciente_id, $2),
                        nombre_paciente = COALESCE(nombre_paciente, $3),
                        celular = $4
                    WHERE id = $1
                `, [idBueno, pacienteIdBueno, nombreBueno, dup.numero_normalizado]);

                consolidados++;
                console.log(`   ✅ Consolidado - Mensajes movidos y duplicados eliminados`);
            }
        }

        console.log(`\n✅ Consolidación completada!`);
        console.log(`📊 Total de números consolidados: ${consolidados}\n`);

        await pool.end();
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

consolidar();
