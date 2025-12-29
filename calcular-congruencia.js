/**
 * Calcula el resultado de la prueba de Congruencia desde PostgreSQL
 * Basado en la lógica de WIX/congruenciaWix.js
 *
 * @param {Object} registro - Registro de pruebasADC desde PostgreSQL
 * @returns {Object} - { CongruenciaFamilia, CongruenciaRelacion, CongruenciaAutocuidado, CongruenciaOcupacional }
 */
function calcularCongruencia(registro) {
    const preguntas = [
        { pregunta: "cofv01", naturaleza: "DA", grupo: "Familia", tipo: "FamiliaValoracion" },
        { pregunta: "cofv02", naturaleza: "DE", grupo: "Familia", tipo: "FamiliaValoracion" },
        { pregunta: "cofv03", naturaleza: "DA", grupo: "Familia", tipo: "FamiliaValoracion" },
        { pregunta: "cofc06", naturaleza: "DE", grupo: "Familia", tipo: "FamiliaConducta" },
        { pregunta: "cofc08", naturaleza: "DE", grupo: "Familia", tipo: "FamiliaConducta" },
        { pregunta: "cofc10", naturaleza: "DE", grupo: "Familia", tipo: "FamiliaConducta" },
        { pregunta: "corv11", naturaleza: "DA", grupo: "Relacion", tipo: "RelacionValoracion" },
        { pregunta: "corv12", naturaleza: "DE", grupo: "Relacion", tipo: "RelacionValoracion" },
        { pregunta: "corv15", naturaleza: "DA", grupo: "Relacion", tipo: "RelacionValoracion" },
        { pregunta: "corc16", naturaleza: "DE", grupo: "Relacion", tipo: "RelacionConducta" },
        { pregunta: "corc17", naturaleza: "DE", grupo: "Relacion", tipo: "RelacionConducta" },
        { pregunta: "corc18", naturaleza: "DE", grupo: "Relacion", tipo: "RelacionConducta" },
        { pregunta: "coav21", naturaleza: "DA", grupo: "Autocuidado", tipo: "AutocuidadoValoracion" },
        { pregunta: "coav24", naturaleza: "DA", grupo: "Autocuidado", tipo: "AutocuidadoValoracion" },
        { pregunta: "coav25", naturaleza: "DA", grupo: "Autocuidado", tipo: "AutocuidadoValoracion" },
        { pregunta: "coac26", naturaleza: "DA", grupo: "Autocuidado", tipo: "AutocuidadoConducta" },
        { pregunta: "coac27", naturaleza: "DE", grupo: "Autocuidado", tipo: "AutocuidadoConducta" },
        { pregunta: "coac29", naturaleza: "DA", grupo: "Autocuidado", tipo: "AutocuidadoConducta" },
        { pregunta: "coov32", naturaleza: "DA", grupo: "Ocupacional", tipo: "OcupacionalValoracion" },
        { pregunta: "coov34", naturaleza: "DA", grupo: "Ocupacional", tipo: "OcupacionalValoracion" },
        { pregunta: "coov35", naturaleza: "DE", grupo: "Ocupacional", tipo: "OcupacionalValoracion" },
        { pregunta: "cooc37", naturaleza: "DA", grupo: "Ocupacional", tipo: "OcupacionalConducta" },
        { pregunta: "cooc39", naturaleza: "DE", grupo: "Ocupacional", tipo: "OcupacionalConducta" },
        { pregunta: "cooc40", naturaleza: "DA", grupo: "Ocupacional", tipo: "OcupacionalConducta" },
    ];

    // Inicializar las variables Totales
    let TotalFamiliaValoracion = 0;
    let TotalFamiliaConducta = 0;
    let TotalRelacionValoracion = 0;
    let TotalRelacionConducta = 0;
    let TotalAutocuidadoValoracion = 0;
    let TotalAutocuidadoConducta = 0;
    let TotalOcupacionalValoracion = 0;
    let TotalOcupacionalConducta = 0;

    // Variables del puntaje general basado en el puntaje directo
    let GralFamiliaValoracion = 0;
    let GralFamiliaConducta = 0;
    let GralRelacionValoracion = 0;
    let GralRelacionConducta = 0;
    let GralAutocuidadoValoracion = 0;
    let GralAutocuidadoConducta = 0;
    let GralOcupacionalValoracion = 0;
    let GralOcupacionalConducta = 0;

    // Validar que existe el registro
    if (!registro) {
        return "NO REALIZÓ PRUEBA";
    }

    preguntas.forEach(pregunta => {
        let respuesta = registro ? registro[pregunta.pregunta] : undefined;
        let valorRespuesta;

        if (registro && pregunta.pregunta in registro) {
            const respuestasDA = {
                "De acuerdo": 3,
                "Medianamente de acuerdo": 2,
                "Medianamente en desacuerdo": 1,
                "En desacuerdo": 0
            };
            const respuestasDE = {
                "De acuerdo": 0,
                "Medianamente de acuerdo": 1,
                "Medianamente en desacuerdo": 2,
                "En desacuerdo": 3
            };

            valorRespuesta = pregunta.naturaleza === "DA" ? respuestasDA[respuesta] : respuestasDE[respuesta];
        } else {
            console.error(`La propiedad "${pregunta.pregunta}" no está definida en el objeto "registro"`);
            valorRespuesta = 0;
        }

        // Si valorRespuesta es undefined, asignar 0
        if (typeof valorRespuesta === "undefined") {
            valorRespuesta = 0;
        }

        switch (pregunta.tipo) {
            case "FamiliaValoracion":
                TotalFamiliaValoracion += valorRespuesta;
                break;
            case "FamiliaConducta":
                TotalFamiliaConducta += valorRespuesta;
                break;
            case "RelacionValoracion":
                TotalRelacionValoracion += valorRespuesta;
                break;
            case "RelacionConducta":
                TotalRelacionConducta += valorRespuesta;
                break;
            case "AutocuidadoValoracion":
                TotalAutocuidadoValoracion += valorRespuesta;
                break;
            case "AutocuidadoConducta":
                TotalAutocuidadoConducta += valorRespuesta;
                break;
            case "OcupacionalValoracion":
                TotalOcupacionalValoracion += valorRespuesta;
                break;
            case "OcupacionalConducta":
                TotalOcupacionalConducta += valorRespuesta;
                break;
        }
    });

    const baremos = {
        BaremosFamiliaValoracion: {
            9: 19, 8: 17, 7: 14, 6: 11, 5: 9, 4: 6,
            3: 4, 2: 1, 1: -2, 0: -4
        },
        BaremosFamiliaConducta: {
            9: 17, 8: 16, 7: 14, 6: 13, 5: 11, 4: 10,
            3: 8, 2: 7, 1: 5, 0: 4
        },
        BaremosRelacionValoracion: {
            9: 19, 8: 17, 7: 15, 6: 12, 5: 10, 4: 8,
            3: 5, 2: 3, 1: 1, 0: -2
        },
        BaremosRelacionConducta: {
            9: 18, 8: 16, 7: 15, 6: 13, 5: 12, 4: 10,
            3: 8, 2: 7, 1: 5, 0: 3
        },
        BaremosAutocuidadoValoracion: {
            9: 22, 8: 18, 7: 15, 6: 12, 5: 8, 4: 5,
            3: 2, 2: -2, 1: -5, 0: -8
        },
        BaremosAutocuidadoConducta: {
            9: 18, 8: 17, 7: 15, 6: 13, 5: 11, 4: 10,
            3: 8, 2: 6, 1: 4, 0: 3
        },
        BaremosOcupacionalValoracion: {
            9: 20, 8: 17, 7: 15, 6: 12, 5: 10, 4: 7,
            3: 5, 2: 2, 1: 0, 0: -3
        },
        BaremosOcupacionalConducta: {
            9: 19, 8: 17, 7: 15, 6: 12, 5: 10, 4: 8,
            3: 6, 2: 4, 1: 1, 0: -1
        }
    };

    // RESULTADOS DE "SI TOTAL AFECTIVO ES 0 GENERAL AFECTIVO ES 8... ETC"
    GralFamiliaValoracion = baremos.BaremosFamiliaValoracion[TotalFamiliaValoracion] || 0;
    GralFamiliaConducta = baremos.BaremosFamiliaConducta[TotalFamiliaConducta] || 0;
    GralRelacionValoracion = baremos.BaremosRelacionValoracion[TotalRelacionValoracion] || 0;
    GralRelacionConducta = baremos.BaremosRelacionConducta[TotalRelacionConducta] || 0;
    GralAutocuidadoValoracion = baremos.BaremosAutocuidadoValoracion[TotalAutocuidadoValoracion] || 0;
    GralAutocuidadoConducta = baremos.BaremosAutocuidadoConducta[TotalAutocuidadoConducta] || 0;
    GralOcupacionalValoracion = baremos.BaremosOcupacionalValoracion[TotalOcupacionalValoracion] || 0;
    GralOcupacionalConducta = baremos.BaremosOcupacionalConducta[TotalOcupacionalConducta] || 0;

    // Matriz de congruencia
    let congruenciaArray = [
        { minVal: 0, maxVal: 3, minCon: 0, maxCon: 3, result: 'MUY ALTO' },
        { minVal: 0, maxVal: 3, minCon: 5, maxCon: 7, result: 'ALTO' },
        { minVal: 0, maxVal: 3, minCon: 8, maxCon: 10, result: 'MEDIO ALTO' },
        { minVal: 0, maxVal: 3, minCon: 11, maxCon: 13, result: 'MEDIO BAJO' },
        { minVal: 0, maxVal: 3, minCon: 14, maxCon: 16, result: 'BAJO' },
        { minVal: 0, maxVal: 3, minCon: 17, maxCon: 40, result: 'MUY BAJO' },
        { minVal: -5, maxVal: 4, minCon: 0, maxCon: 3, result: 'MUY ALTO' },
        { minVal: -5, maxVal: 4, minCon: 5, maxCon: 7, result: 'ALTO' },
        { minVal: -5, maxVal: 4, minCon: 8, maxCon: 10, result: 'MEDIO ALTO' },
        { minVal: -5, maxVal: 4, minCon: 11, maxCon: 13, result: 'MEDIO BAJO' },
        { minVal: -5, maxVal: 4, minCon: 14, maxCon: 16, result: 'BAJO' },
        { minVal: -5, maxVal: 4, minCon: 17, maxCon: 40, result: 'MUY BAJO' },
        { minVal: 5, maxVal: 7, minCon: 0, maxCon: 3, result: 'ALTO' },
        { minVal: 5, maxVal: 7, minCon: 5, maxCon: 7, result: 'MUY ALTO' },
        { minVal: 5, maxVal: 7, minCon: 8, maxCon: 10, result: 'ALTO' },
        { minVal: 5, maxVal: 7, minCon: 11, maxCon: 13, result: 'MEDIO ALTO' },
        { minVal: 5, maxVal: 7, minCon: 14, maxCon: 16, result: 'MEDIO BAJO' },
        { minVal: 5, maxVal: 7, minCon: 17, maxCon: 40, result: 'BAJO' },
        { minVal: 8, maxVal: 10, minCon: 0, maxCon: 3, result: 'MEDIO ALTO' },
        { minVal: 8, maxVal: 10, minCon: 5, maxCon: 7, result: 'ALTO' },
        { minVal: 8, maxVal: 10, minCon: 8, maxCon: 10, result: 'MUY ALTO' },
        { minVal: 8, maxVal: 10, minCon: 11, maxCon: 13, result: 'ALTO' },
        { minVal: 8, maxVal: 10, minCon: 14, maxCon: 16, result: 'MEDIO ALTO' },
        { minVal: 8, maxVal: 10, minCon: 17, maxCon: 40, result: 'MEDIO BAJO' },
        { minVal: 11, maxVal: 13, minCon: 0, maxCon: 3, result: 'MEDIO BAJO' },
        { minVal: 11, maxVal: 13, minCon: 5, maxCon: 7, result: 'MEDIO ALTO' },
        { minVal: 11, maxVal: 13, minCon: 8, maxCon: 10, result: 'ALTO' },
        { minVal: 11, maxVal: 13, minCon: 11, maxCon: 13, result: 'MUY ALTO' },
        { minVal: 11, maxVal: 13, minCon: 14, maxCon: 16, result: 'ALTO' },
        { minVal: 11, maxVal: 13, minCon: 17, maxCon: 40, result: 'MEDIO ALTO' },
        { minVal: 14, maxVal: 16, minCon: 0, maxCon: 3, result: 'BAJO' },
        { minVal: 14, maxVal: 16, minCon: 5, maxCon: 7, result: 'MEDIO BAJO' },
        { minVal: 14, maxVal: 16, minCon: 8, maxCon: 10, result: 'MEDIO ALTO' },
        { minVal: 14, maxVal: 16, minCon: 11, maxCon: 13, result: 'ALTO' },
        { minVal: 14, maxVal: 16, minCon: 14, maxCon: 16, result: 'MUY ALTO' },
        { minVal: 14, maxVal: 16, minCon: 17, maxCon: 40, result: 'ALTO' },
        { minVal: 17, maxVal: 40, minCon: 0, maxCon: 3, result: 'MUY BAJO' },
        { minVal: 17, maxVal: 40, minCon: 5, maxCon: 7, result: 'BAJO' },
        { minVal: 17, maxVal: 40, minCon: 8, maxCon: 10, result: 'MEDIO BAJO' },
        { minVal: 17, maxVal: 40, minCon: 11, maxCon: 13, result: 'MEDIO ALTO' },
        { minVal: 17, maxVal: 40, minCon: 14, maxCon: 16, result: 'ALTO' },
        { minVal: 17, maxVal: 40, minCon: 17, maxCon: 40, result: 'MUY ALTO' },
    ];

    // Congruencia Familia
    const congruenciaObjFamilia = congruenciaArray.find(obj => {
        return obj.minVal <= GralFamiliaValoracion && obj.maxVal >= GralFamiliaValoracion &&
            obj.minCon <= GralFamiliaConducta && obj.maxCon >= GralFamiliaConducta;
    });
    const CongruenciaFamilia = congruenciaObjFamilia ? congruenciaObjFamilia.result : '';

    // Congruencia Relación
    const congruenciaObjRelacion = congruenciaArray.find(obj => {
        return obj.minVal <= GralRelacionValoracion && obj.maxVal >= GralRelacionValoracion &&
            obj.minCon <= GralRelacionConducta && obj.maxCon >= GralRelacionConducta;
    });
    const CongruenciaRelacion = congruenciaObjRelacion ? congruenciaObjRelacion.result : '';

    // Congruencia Autocuidado
    const congruenciaObjAutocuidado = congruenciaArray.find(obj => {
        return obj.minVal <= GralAutocuidadoValoracion && obj.maxVal >= GralAutocuidadoValoracion &&
            obj.minCon <= GralAutocuidadoConducta && obj.maxCon >= GralAutocuidadoConducta;
    });
    let CongruenciaAutocuidado = congruenciaObjAutocuidado ? congruenciaObjAutocuidado.result : '';

    // Congruencia Ocupacional
    const congruenciaObjOcupacional = congruenciaArray.find(obj => {
        return obj.minVal <= GralOcupacionalValoracion && obj.maxVal >= GralOcupacionalValoracion &&
            obj.minCon <= GralOcupacionalConducta && obj.maxCon >= GralOcupacionalConducta;
    });
    const CongruenciaOcupacional = congruenciaObjOcupacional ? congruenciaObjOcupacional.result : '';

    return {
        CongruenciaFamilia,
        CongruenciaRelacion,
        CongruenciaAutocuidado,
        CongruenciaOcupacional
    };
}

module.exports = { calcularCongruencia };
