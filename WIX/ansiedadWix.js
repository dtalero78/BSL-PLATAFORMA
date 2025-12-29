import wixData from 'wix-data';

export async function ansiedad(numeroId, codEmpresa) {
    // Define las preguntas y su naturaleza
    const preguntas = [
        { pregunta: "an18", naturaleza: "DE", tipo: "Afectivo" },
        { pregunta: "an19", naturaleza: "DA", tipo: "Afectivo" },
        { pregunta: "an20", naturaleza: "DA", tipo: "Afectivo" },
        { pregunta: "an31", naturaleza: "DE", tipo: "Afectivo" },
        { pregunta: "an35", naturaleza: "DE", tipo: "Afectivo" },
        { pregunta: "an03", naturaleza: "DA", tipo: "Cognitiva" },
        { pregunta: "an04", naturaleza: "DE", tipo: "Cognitiva" },
        { pregunta: "an05", naturaleza: "DA", tipo: "Cognitiva" },
        { pregunta: "an22", naturaleza: "DA", tipo: "Cognitiva" },
        { pregunta: "an23", naturaleza: "DE", tipo: "Cognitiva" },
        { pregunta: "an11", naturaleza: "DA", tipo: "Conductual" },
        { pregunta: "an14", naturaleza: "DA", tipo: "Conductual" },
        { pregunta: "an36", naturaleza: "DE", tipo: "Conductual" },
        { pregunta: "an38", naturaleza: "DA", tipo: "Conductual" },
        { pregunta: "an39", naturaleza: "DA", tipo: "Conductual" },
        { pregunta: "an07", naturaleza: "DA", tipo: "Fisiologica" },
        { pregunta: "an09", naturaleza: "DA", tipo: "Fisiologica" },
        { pregunta: "an26", naturaleza: "DE", tipo: "Fisiologica" },
        { pregunta: "an27", naturaleza: "DA", tipo: "Fisiologica" },
        { pregunta: "an30", naturaleza: "DE", tipo: "Fisiologica" },
    ];

    // Inicializar las variables Totales
    let TotalAfectivo = 0;
    let TotalCognitiva = 0;
    let TotalConductual = 0;
    let TotalFisiologica = 0;

    // Variables del puntaje general basado en el puntaje directo
    var GralAfectivo;
    var GralCognitiva;
    var GralConductual;
    var GralFisiologica;
    var GralAnsiedad;

    // Busca los datos del registro en la segunda base de datos
    let results = await wixData.query("ADCTEST")
        .eq("documento", numeroId)
        .find();

    if (results.items.length === 0) {
        return "NO REALIZÓ PRUEBA";
    }

    let registro = results.items[0];

    // Itera sobre todas las preguntas, determina su naturaleza y asigna el valor numérico correspondiente a cada respuesta
    preguntas.forEach((pregunta) => {
        let respuesta = registro[pregunta.pregunta] || '';

        let valorRespuesta;
        if (pregunta.naturaleza === "DA") {
            valorRespuesta = {
                "De acuerdo": 3,
                "Medianamente de acuerdo": 2,
                "Medianamente en desacuerdo": 1,
                "En desacuerdo": 0
            } [respuesta];
        } else {
            valorRespuesta = {
                "De acuerdo": 0,
                "Medianamente de acuerdo": 1,
                "Medianamente en desacuerdo": 2,
                "En desacuerdo": 3
            } [respuesta];
        }

        if (typeof valorRespuesta === "undefined") {
            valorRespuesta = "";
        }

        // Sumar valorRespuesta al Total correspondiente
        switch (pregunta.tipo) {
        case "Afectivo":
            TotalAfectivo += valorRespuesta;
            break;
        case "Cognitiva":
            TotalCognitiva += valorRespuesta;
            break;
        case "Conductual":
            TotalConductual += valorRespuesta;
            break;
        case "Fisiologica":
            TotalFisiologica += valorRespuesta;
            break;

        default:
            console.error(`Tipo de pregunta "${pregunta.tipo}" no reconocido para "${pregunta.pregunta}"`);
        }
    });

    // Sumar los 3 para sacar el total general
    let TotalGeneralAns = TotalAfectivo + TotalCognitiva + TotalConductual + TotalFisiologica;

    // VALORES DE LOS BAREMOS: CUAL ES EL VALOR DEL GRAL (FUTURO, MUNDO, TIMISMO) CUANDO EL PUNTAJE DIRECTO ES 0,1,2....

    const baremos = {
        BaremosAfectivo: {
            15: 27,
            14: 25,
            13: 24,
            12: 23,
            11: 22,
            10: 20,
            9: 19,
            8: 18,
            7: 17,
            6: 15,
            5: 14,
            4: 13,
            3: 12,
            2: 10,
            1: 9,
            0: 8
        },
        BaremosCognitiva: {
            15: 22,
            14: 21,
            13: 20,
            12: 19,
            11: 18,
            10: 17,
            9: 16,
            8: 15,
            7: 14,
            6: 13,
            5: 12,
            4: 11,
            3: 10,
            2: 9,
            1: 8,
            0: 7
        },
        BaremosConductual: {
            15: 25,
            14: 24,
            13: 22,
            12: 21,
            11: 19,
            10: 18,
            9: 16,
            8: 15,
            7: 13,
            6: 12,
            5: 11,
            4: 9,
            3: 8,
            2: 6,
            1: 5,
            0: 3
        },
        BaremosFisiologica: {
            15: 27,
            14: 26,
            13: 24,
            12: 23,
            11: 22,
            10: 20,
            9: 19,
            8: 18,
            7: 17,
            6: 15,
            5: 14,
            4: 13,
            3: 11,
            2: 10,
            1: 9,
            0: 8
        },
        BaremosGeneralAns: {
            49: 24,
            48: 23,
            47: 23,
            46: 22,
            45: 22,
            44: 22,
            43: 21,
            42: 21,
            41: 21,
            40: 20,
            39: 20,
            38: 20,
            37: 19,
            36: 19,
            35: 19,
            34: 18,
            33: 18,
            32: 17,
            31: 17,
            30: 17,
            29: 16,
            28: 16,
            27: 16,
            26: 15,
            25: 15,
            24: 15,
            23: 14,
            22: 14,
            21: 13,
            20: 13,
            19: 13,
            18: 12,
            17: 12,
            16: 12,
            15: 11,
            14: 11,
            13: 11,
            12: 10,
            11: 10,
            10: 9,
            9: 9,
            8: 9,
            7: 8,
            6: 8,
            5: 8,
            4: 7,
            3: 7,
            2: 7,
            1: 6,
            0: 6,
        }
    };

    //RESULTADOS DE "SI TOTAL AFECTIVO ES 0 GENERAL AFECTIVO ES 8... ETC"
    GralAfectivo = baremos.BaremosAfectivo[TotalAfectivo] || 0;
    GralCognitiva = baremos.BaremosCognitiva[TotalCognitiva] || 0;
    GralConductual = baremos.BaremosConductual[TotalConductual] || 0;
    GralFisiologica = baremos.BaremosFisiologica[TotalFisiologica] || 0;
    GralAnsiedad = baremos.BaremosGeneralAns[TotalGeneralAns] || 0;

    // Log de los puntajes

    var ResultadoAnsiedad;
    if (codEmpresa === "SITEL") {
        if (GralAnsiedad >= 1 && GralAnsiedad <= 7) {
            ResultadoAnsiedad = "Ansiedad Baja. Apto";
        } else if (GralAnsiedad >= 8 && GralAnsiedad <= 17) {
            ResultadoAnsiedad = "Ansiedad Normal. Apto";
        } else if (GralAnsiedad > 14) {
            ResultadoAnsiedad = "Ansiedad Alta. No Apto";
        } else {
            ResultadoAnsiedad = "Ansiedad Normal. Apto";
        }
    } else {
        // Lógica para otras empresas si es diferente
        if (GralAnsiedad >= 1 && GralAnsiedad <= 7) {
            ResultadoAnsiedad = "Ansiedad Baja. Apto";
        } else if (GralAnsiedad >= 8 && GralAnsiedad <= 13) {
            ResultadoAnsiedad = "Ansiedad Normal. Apto";
        } else if (GralAnsiedad > 13) {
            ResultadoAnsiedad = "Ansiedad Alta. No Apto";
        } else {
            ResultadoAnsiedad = "Ansiedad Normal. Apto";
        }
    }

    // Retornar tanto el valor numérico como la interpretación
    return { valor: GralAnsiedad, interpretacion: ResultadoAnsiedad };
}

// ------------ PARA QUE SALGAN CON LA RESPUESTA DE CHATGPT -------------------

// ELIMINAR DE LA 243 A LA 254

/*if (codEmpresa === "SITEL" || codEmpresa === "KM2" || codEmpresa === "SANITHELP-JJ" || codEmpresa === "PARTICULAR") {
    // Resultados diferentes para codEmpresa "SITEL"
    if (GralAnsiedad >= 1 && GralAnsiedad <= 7) {
        ResultadoAnsiedad = "Ansiedad Baja. Apto";
    } else if (GralAnsiedad >= 8 && GralAnsiedad <= 13) {
        ResultadoAnsiedad = "Ansiedad Normal. Apto";
    } else if (GralAnsiedad > 13) {
        ResultadoAnsiedad = "Ansiedad Alta. No Apto";
    } else {
        ResultadoAnsiedad = "Ansiedad Normal. Apto";
    }

    return ResultadoAnsiedad

} else {
    // Resultados estándar para otras empresas
    if (GralAnsiedad >= 1 && GralAnsiedad <= 7) {
        ResultadoAnsiedad = "Nivel Bajo";
    } else if (GralAnsiedad >= 8 && GralAnsiedad <= 13) {
        ResultadoAnsiedad = "Nivel Normal";
    } else if (GralAnsiedad > 13) {
        ResultadoAnsiedad = "Nivel Alto";
    } else {
        ResultadoAnsiedad = "Nivel Normal";
    }

    //CHAT GPT ANSIEDAD
    const askQuestion = async (GralAnsiedad, ResultadoAnsiedad, edadGlobal, hijosGlobal) => {
        const prompt = `Analiza a partir de datos el nivel de ansiedad de esta persona en máximo 38 palabras. Resultados Ansiedad: ${ResultadoAnsiedad}, Edad: ${edadGlobal}, Hijos: ${hijosGlobal}`;
        const answer = await getAnswerfromAI(prompt);

        return answer;
    };

    // Llamar a la función de chat y obtener la respuesta
    const chatAnswer = await askQuestion(GralAnsiedad, ResultadoAnsiedad, edadGlobal, hijosGlobal);

    return chatAnswer;
}*/