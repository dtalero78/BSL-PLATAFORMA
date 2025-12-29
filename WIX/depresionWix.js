import wixData from 'wix-data';
import { getAnswerfromAI } from 'backend/open-ai';


export async function depresion(numeroId, codEmpresa, edadGlobal, hijosGlobal) {
    // Define las preguntas y su naturaleza
    const preguntas = [
        { pregunta: "de08", naturaleza: "DE", tipo: "Sobre Futuro" },
        { pregunta: "de12", naturaleza: "DA", tipo: "Sobre Futuro" },
        { pregunta: "de13", naturaleza: "DE", tipo: "Sobre Futuro" },
        { pregunta: "de35", naturaleza: "DE", tipo: "Sobre Futuro" },
        { pregunta: "de37", naturaleza: "DE", tipo: "Sobre Futuro" },
        { pregunta: "de38", naturaleza: "DA", tipo: "Sobre Futuro" },
        { pregunta: "de40", naturaleza: "DE", tipo: "Sobre Futuro" },
        { pregunta: "de14", naturaleza: "DA", tipo: "Sobre Mundo" },
        { pregunta: "de15", naturaleza: "DA", tipo: "Sobre Mundo" },
        { pregunta: "de16", naturaleza: "DA", tipo: "Sobre Mundo" },
        { pregunta: "de20", naturaleza: "DA", tipo: "Sobre Mundo" },
        { pregunta: "de29", naturaleza: "DA", tipo: "Sobre Mundo" },
        { pregunta: "de32", naturaleza: "DA", tipo: "Sobre Mundo" },
        { pregunta: "de33", naturaleza: "DA", tipo: "Sobre Mundo" },
        { pregunta: "de03", naturaleza: "DA", tipo: "Sobre Ti Mismo" },
        { pregunta: "de04", naturaleza: "DE", tipo: "Sobre Ti Mismo" },
        { pregunta: "de05", naturaleza: "DA", tipo: "Sobre Ti Mismo" },
        { pregunta: "de06", naturaleza: "DA", tipo: "Sobre Ti Mismo" },
        { pregunta: "de07", naturaleza: "DA", tipo: "Sobre Ti Mismo" },
        { pregunta: "de21", naturaleza: "DE", tipo: "Sobre Ti Mismo" },
        { pregunta: "de27", naturaleza: "DE", tipo: "Sobre Ti Mismo" }
    ];

    // Inicializar las variables Totales
    let TotalMundo = 0;
    let TotalTiMismo = 0;
    let TotalFuturo = 0;

    // Variables del puntaje general basado en el puntaje directo
    let GralFuturo;
    let GralMundo;
    let GralTiMismo;
    let GralGeneral;

    let results = await wixData.query("ADCTEST")
        .eq("documento", numeroId)
        .find();

    let registro = results.items[0];


        if (results.items.length === 0) {
        return "NO REALIZÓ PRUEBA";
    }


    // Iterar sobre todas las preguntas, determinar su naturaleza y asignar el valor numérico correspondiente a cada respuesta
    preguntas.forEach((pregunta) => {
        const respuesta = registro[pregunta.pregunta] || '';

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
            console.error(`Valor de respuesta no encontrado para "${pregunta.pregunta}" y respuesta "${respuesta}"`);
            valorRespuesta = "";
        }

        // Sumar valorRespuesta al Total correspondiente
        switch (pregunta.tipo) {
        case "Sobre Mundo":
            TotalMundo += valorRespuesta;
            break;
        case "Sobre Ti Mismo":
            TotalTiMismo += valorRespuesta;
            break;
        case "Sobre Futuro":
            TotalFuturo += valorRespuesta;
            break;
        default:
            console.error(`Tipo de pregunta "${pregunta.tipo}" no reconocido para "${pregunta.pregunta}"`);
        }
    });

    // Sumar los 3 para obtener el total general
    const TotalGeneral = TotalMundo + TotalTiMismo + TotalFuturo;

    // Valores de los baremos: ¿cuál es el valor del Gral (Futuro, Mundo, TiMismo) cuando el puntaje directo es 0, 1, 2, ...?
    const baremos = {
        BaremosFuturo: {
            21: 35,
            20: 34,
            19: 32,
            18: 31,
            17: 30,
            16: 28,
            15: 27,
            14: 26,
            13: 25,
            12: 23,
            11: 22,
            10: 21,
            9: 20,
            8: 18,
            7: 17,
            6: 16,
            5: 15,
            4: 13,
            3: 12,
            2: 11,
            1: 10,
            0: 8
        },
        BaremosMundo: {
            21: 28,
            20: 27,
            19: 26,
            18: 25,
            17: 24,
            16: 23,
            15: 22,
            14: 21,
            13: 20,
            12: 19,
            11: 18,
            10: 18,
            9: 17,
            8: 16,
            7: 15,
            6: 14,
            5: 13,
            4: 12,
            3: 11,
            2: 10,
            1: 9,
            0: 8
        },
        BaremosTiMismo: {
            21: 36,
            20: 35,
            19: 33,
            18: 32,
            17: 31,
            16: 29,
            15: 28,
            14: 27,
            13: 25,
            12: 24,
            11: 23,
            10: 21,
            9: 20,
            8: 19,
            7: 18,
            6: 16,
            5: 15,
            4: 14,
            3: 12,
            2: 11,
            1: 10,
            0: 8
        },

        BaremosGeneral: {
            49: 29,
            48: 28,
            47: 28,
            46: 27,
            45: 27,
            44: 27,
            43: 26,
            42: 26,
            41: 25,
            40: 25,
            39: 25,
            38: 24,
            37: 24,
            36: 23,
            35: 23,
            34: 22,
            33: 22,
            32: 22,
            31: 21,
            30: 21,
            29: 20,
            28: 20,
            27: 19,
            26: 19,
            25: 19,
            24: 18,
            23: 18,
            22: 17,
            21: 17,
            20: 16,
            19: 16,
            18: 16,
            17: 15,
            16: 15,
            15: 14,
            14: 14,
            13: 13,
            12: 13,
            11: 13,
            10: 12,
            9: 12,
            8: 11,
            7: 11,
            6: 11,
            5: 10,
            4: 10,
            3: 9,
            2: 9,
            1: 8,
            0: 8
        }
    };

    // Resultados de "Si TotalFuturo es 0, GeneralFuturo es 8... etc."
    GralFuturo = baremos.BaremosFuturo[TotalFuturo] || 0;
    GralMundo = baremos.BaremosMundo[TotalMundo] || 0;
    GralTiMismo = baremos.BaremosTiMismo[TotalTiMismo] || 0;
    GralGeneral = baremos.BaremosGeneral[TotalGeneral] || 0;

    
let ResultadoDepresion;

if (GralGeneral >= 1 && GralGeneral <= 7) {
    ResultadoDepresion = { valor: GralGeneral, interpretacion: "Bajo. Apto" };
} else if (GralGeneral >= 8 && GralGeneral <= 17) {
    ResultadoDepresion = { valor: GralGeneral, interpretacion: "Sin Depresión. Apto" };
} else if (GralGeneral > 17) {
    ResultadoDepresion = { valor: GralGeneral, interpretacion: "Riesgo Alto. No Apto" };
} else {
    ResultadoDepresion = { valor: GralGeneral, interpretacion: "Sin Depresión. Autovaloración adecuada" };
}

return ResultadoDepresion;


// ------------ PARA QUE SALGAN CON LA RESPUESTA DE CHATGPT -------------------


    // ELIMINAR DE LA 237 A LA 243

/*    if (codEmpresa === "SITEL" || codEmpresa === "KM2" || codEmpresa === "SANITHELP-JJ" || codEmpresa === "PARTICULAR") {
        // Resultados diferentes para codEmpresa "SITEL"
 if (GralGeneral >= 1 && GralGeneral <= 7) {
        ResultadoDepresion = "Bajo. Apto";
    } else if (GralGeneral >= 8 && GralGeneral <= 13) {
        ResultadoDepresion = "Sin Depresión. Apto";
    } else if (GralGeneral > 13) {
        ResultadoDepresion = "Riesgo Alto. No Apto";
    } else {
        ResultadoDepresion = "Sin Depresión. Autovaloración adecuada";
    }

    return ResultadoDepresion;

    } else {
        // Resultados estándar para otras empresas
        if (GralGeneral >= 1 && GralGeneral <= 7) {
        ResultadoDepresion = "Bajo. OTRAS";
    } else if (GralGeneral >= 8 && GralGeneral <= 13) {
        ResultadoDepresion = "Sin Depresión. OTRAS";
    } else if (GralGeneral > 13) {
        ResultadoDepresion = "Riesgo Alto. OTRAS";
    } else {
        ResultadoDepresion = "Sin Depresión. OTRAS";
    }

        //CHAT GPT ANSIEDAD
        const askQuestion = async (GralGeneral, ResultadoDepresion, edadGlobal, hijosGlobal) => {
            const prompt = `Analiza esta persona a partir de su nivel de depresión en máximo 38 palabras. Resultados Depresión: ${ResultadoDepresion}, Edad: ${edadGlobal}, Hijos: ${hijosGlobal}`;
            const answer = await getAnswerfromAI(prompt);

            return answer;
        };

        // Llamar a la función de chat y obtener la respuesta
        const chatAnswer = await askQuestion(GralGeneral, ResultadoDepresion, edadGlobal, hijosGlobal);

        return chatAnswer;



}*/





}