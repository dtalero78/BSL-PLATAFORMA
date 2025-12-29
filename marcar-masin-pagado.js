require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 25060,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'defaultdb',
    ssl: { rejectUnauthorized: false }
});

async function marcarMasinPagado() {
    try {
        console.log('🔄 Actualizando registros de MASIN como pagados...');

        const result = await pool.query(`
            UPDATE "HistoriaClinica"
            SET pagado = true,
                fecha_pago = NOW()
            WHERE "codEmpresa" = 'MASIN'
            AND (pagado = false OR pagado IS NULL)
            RETURNING _id, "primerNombre", "primerApellido", "numeroId"
        `);

        console.log(`✅ Se actualizaron ${result.rowCount} registros de MASIN como pagados`);

        if (result.rows.length > 0) {
            console.log('\nPrimeros 5 registros actualizados:');
            result.rows.slice(0, 5).forEach((row, i) => {
                console.log(`${i + 1}. ${row.primerNombre} ${row.primerApellido} (CC: ${row.numeroId})`);
            });
        }

        await pool.end();
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

marcarMasinPagado();
