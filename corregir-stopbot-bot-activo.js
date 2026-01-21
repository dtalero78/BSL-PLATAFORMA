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

async function corregir() {
    try {
        console.log('🔧 Corrigiendo registros existentes con stopBot=true pero bot_activo=true...\n');

        // Actualizar TODOS los registros que tengan stopBot=true para que también tengan bot_activo=false
        const result = await pool.query(`
            UPDATE conversaciones_whatsapp
            SET bot_activo = false
            WHERE "stopBot" = true AND bot_activo = true
            RETURNING celular, paciente_id, nombre_paciente
        `);

        console.log(`✅ ${result.rows.length} registros actualizados:\n`);

        result.rows.forEach(r => {
            console.log(`   📱 ${r.celular} - ${r.nombre_paciente || 'Sin nombre'} (ID: ${r.paciente_id || 'N/A'})`);
        });

        // Verificar los 3 números específicos
        console.log(`\n📋 Verificando números específicos:\n`);
        const numeros = ['3132538921', '3135689538', '3214050890'];

        for (const num of numeros) {
            const check = await pool.query(`
                SELECT celular, "stopBot", bot_activo
                FROM conversaciones_whatsapp
                WHERE celular LIKE '%${num}%'
            `);

            console.log(`\n   ${num}:`);
            check.rows.forEach(r => {
                const status = r.stopBot && !r.bot_activo ? '✅ CORRECTO' : '❌ INCORRECTO';
                console.log(`   ${status} ${r.celular}: stopBot=${r.stopBot}, bot_activo=${r.bot_activo}`);
            });
        }

        console.log('\n✅ Corrección completada!\n');
        await pool.end();
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

corregir();
