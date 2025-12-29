import wixData from 'wix-data';
import wixLocation from 'wix-location';
import { generarVisiometria } from 'backend/Visual.jsw';
import { local } from 'wix-storage';

let heather = "FORM";
local.setItem('heather', heather);

const NUMERO_DE_IMAGENES = 6;
const direcciones = ['p1', 'p2', 'p3', 'p4', 'p5']; // Las posibles direcciones de la "C"
const laminas = ['color1', 'color2', 'color3', 'color4', 'color5', 'color6'];


const respuestasCorrectas = ['E', 'FP', 'TOZ', 'LPED', 'PECFD', 'EDFCZP']; // Suponiendo que estas sean las respuestas correctas. Modifícalas según tus imágenes.
let respuestasAcertadas = 0;
let indiceActual = 0;
let cuenta = 10;
let timeout;
let puntosLetras = 0;
let puntosMarcaPunto = 0;
let puntosColores = 0;
let cedula, empresa, item, idItem;

async function finalizarPruebas() {
    const astigmatismo = $w('#astigmatismo').value;
    const miopia = $w('#miopia').value;
    const recomendacion = generarRecomendacion();

    try {
        const resultadosVisio = await generarVisiometria(puntosLetras, puntosMarcaPunto, puntosColores, recomendacion, miopia, astigmatismo, NUMERO_DE_IMAGENES, direcciones, laminas);

        if (!resultadosVisio) {
            throw new Error("Resultados de visiometría no obtenidos");
        }

        $w("#resultadoFinal").text = `Puntuación en prueba de letras: ${puntosLetras}/${NUMERO_DE_IMAGENES}\nPuntuación en prueba marca el punto: ${puntosMarcaPunto}/${direcciones.length}\nPuntuación en prueba de colores: ${puntosColores}/${laminas.length}\nRecomendación general: ${recomendacion}`;
        $w('#resultadosVisio').text = resultadosVisio;

        let datos = {
            "numeroId": item._id,
            "cedula": cedula,
            "astigmatismo": astigmatismo,
            "miopia": miopia,
            "resultadoNumerico": resultadosVisio,
            "snelle": puntosLetras,
            "agudezaVisual": puntosMarcaPunto,
            "colores": puntosColores,
            "concepto": recomendacion,
            "idGeneral": item._id,
            "codEmpresa": empresa
        };

        const results = await wixData.query("VISUAL").eq("cedula", cedula).limit(1).find();

        let itemToUpdateOrInsert = results.items.length > 0 ? results.items[0] : {};
        Object.assign(itemToUpdateOrInsert, datos);

        const updatedOrInsertedItem = results.items.length > 0 ? await wixData.update("VISUAL", itemToUpdateOrInsert) : await wixData.insert("VISUAL", datos);

        console.log("Salvado exitoso:", updatedOrInsertedItem);
        wixLocation.to("https://www.bsl.com.co/foto2/" + idItem);
    } catch (err) {
        console.error("Error en finalizarPruebas:", err);
        $w('#ERROR').show();
    }
}
// ------ PRUEBA DE LETRAS --------

// Función para ocultar todas las imágenes
function ocultarTodasLasImagenes() {
    for (let i = 1; i <= NUMERO_DE_IMAGENES; i++) {
        $w(`#imagen${i}`).hide();
    }
}

// Función para mostrar una imagen basada en el índice dado
function mostrarImagen(indice) {
    ocultarTodasLasImagenes();
    $w(`#imagen${indice + 1}`).show(); // +1 porque el índice comienza en 0 y las imágenes en 1
}


function avanzarALaSiguienteImagen() {
    verificarRespuesta(); // Verifica la respuesta antes de pasar a la siguiente imagen

    if (indiceActual < NUMERO_DE_IMAGENES - 1) {
        indiceActual++;
        cuenta = 10;
        mostrarImagen(indiceActual);
    } else {
        $w('#marcaElPuntoTest').show();
        $w('#video').hide()
        setTimeout(function() {
    $w('#video').show();
}, 2000);
        $w('#snelleTest').hide()

    }
}

function verificarRespuesta() {

const respuestaUsuario = $w("#campoRespuesta").value.toLowerCase();

    if (respuestaUsuario === respuestasCorrectas[indiceActual].toLowerCase()) {
        respuestasAcertadas++;
        puntosLetras++; // Incrementa puntuación
    }

}

// ------ PRUEBA MARCA EL PUNTO --------

let direccionActual;
let indiceActualContrastes = 0;

function generarDireccionAleatoria() {
    if (indiceActualContrastes < direcciones.length) {
        direccionActual = direcciones[indiceActualContrastes];
        mostrarCEnDireccion(direccionActual);
    } else {
        $w('#marcaElPuntoTest').hide();
        $w('#coloresTest').show();

    }
}

function mostrarCEnDireccion(direccion) {
    let idImagen = direccion; // Usamos directamente la dirección como id de la imagen

    ocultarTodasLasCes();
    $w(`#${idImagen}`).show();
}

function ocultarTodasLasCes() {
    const ids = ['p1', 'p2', 'p3', 'p4', 'p5'];
    ids.forEach(id => $w(`#${id}`).hide());
}

function verificarRespuestaContrastes(direccionSeleccionada) {
    if (direccionSeleccionada === direccionActual) {
        console.log("bien");
        puntosMarcaPunto++; // Incrementa puntuación
    } else {
        console.log("mal");
    }

    indiceActualContrastes++;
    generarDireccionAleatoria(); 
}

export function b1_click(event) {
verificarRespuestaContrastes('p3')
}

export function b2_click(event) {
    verificarRespuestaContrastes('p5');

}

export function b3_click(event) {
    verificarRespuestaContrastes('p3');

}

export function b4_click(event) {
    verificarRespuestaContrastes('p1');

}

export function b5_click(event) {
verificarRespuestaContrastes('p3')

}

export function b6_click(event) {
verificarRespuestaContrastes('p3')

}

export function b7_click(event) {
    verificarRespuestaContrastes('p2');

}

export function b8_click(event) {
    verificarRespuestaContrastes('p4');

}



//----- PRUEBA DE COLORES ----

let laminaActual = 0;
const respuestasCorrectasColores = [12, 16, 97, 15, 29, "Ninguna"]; 

function numeroAleatorio(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function actualizarLabelsBotones() {
    let valores = [numeroAleatorio(1, 30), numeroAleatorio(1, 30), numeroAleatorio(1, 30)];
    let posicionCorrecta = numeroAleatorio(0, 2);
    
    if(respuestasCorrectasColores[laminaActual] !== "Ninguna") {
        valores.splice(posicionCorrecta, 0, respuestasCorrectasColores[laminaActual]);
    }

    $w('#botonColor1').label = "" + valores[0];
    $w('#botonColor2').label = "" + valores[1];
    $w('#botonColor3').label = "" + valores[2];
    $w('#botonColor4').label = "Ninguna";
}

function verificarRespuestaColores(botonPresionado) {

    if (botonPresionado.id === '#botonColor4' && respuestasCorrectasColores[laminaActual] === "Ninguna") {
        puntosColores++; // Incrementa puntuación
    } else {
        let numeroBoton = parseInt(botonPresionado.label, 10);
        if (numeroBoton === respuestasCorrectasColores[laminaActual] || botonPresionado.label === respuestasCorrectasColores[laminaActual]) {
            puntosColores++; // Incrementa puntuación
        }
    }
    cambiarAProximaLamina();
}

function cambiarAProximaLamina() {
    // Oculta la lámina actual
    if (laminaActual !== -1) {
        $w(`#${laminas[laminaActual]}`).hide();
    }

    // Si ya se respondió la lámina color6, detener la prueba
    if (laminaActual === laminas.length - 1) {
        console.log('Prueba finalizada');
        $w('#blackOut').show()
        $w('#coloresTest').hide()
        finalizarPruebas();
        return;
    }

    // Avanzar a la siguiente lámina
    laminaActual = (laminaActual + 1) % laminas.length;

    // Mostrar la siguiente lámina
    $w(`#${laminas[laminaActual]}`).show();

    // Actualizar los labels de los botones
    actualizarLabelsBotones();
}


export function botonColor1_click_1(event) {
    verificarRespuestaColores($w('#botonColor1'));

}

export function botonColor2_click_1(event) {
    verificarRespuestaColores($w('#botonColor2'));

}

export function botonColor3_click_1(event) {
    verificarRespuestaColores($w('#botonColor3'));

}

export function botonColor4_click_1(event) {
    verificarRespuestaColores($w('#botonColor4'));

}



function generarRecomendacion() {
    const fallosTotales = (NUMERO_DE_IMAGENES - puntosLetras) + (direcciones.length - puntosMarcaPunto) + (laminas.length - puntosColores);
    let recomendacion;

    if (fallosTotales <= 2) {
        recomendacion = "Excelente";
    } else if (fallosTotales <= 4) {
        recomendacion = "Bueno";
    } else {
        recomendacion = "Revisión Sugerida";
    }

    return recomendacion;
}


// ------------ Función principal de inicio
$w.onReady(function () {
    // Inicializar datos del dataset
    try {
        item = $w('#dynamicDataset').getCurrentItem();
        if (!item) {
            console.error("No se pudo cargar el item del dataset");
            return;
        }
        cedula = item.numeroId;
        empresa = item.codEmpresa;
        idItem = item._id;
        console.log(empresa);
    } catch (error) {
        console.error("Error al cargar datos del dataset:", error);
    }

    ocultarTodasLasImagenes();
    mostrarImagen(indiceActual);
    generarDireccionAleatoria();
    
// CÓDIGO QUE AFECTA TEST DE COLORES
    for (let i = 1; i < laminas.length; i++) { // Comienza en 1 para no ocultar la primera lámina
        $w(`#${laminas[i]}`).hide();
    }
    // Mostrar la primera lámina
    $w(`#${laminas[0]}`).show();

    // Actualizar los labels de los botones
    actualizarLabelsBotones();



    $w("#botonVerificar").onClick(() => {
        avanzarALaSiguienteImagen();
        $w('#campoRespuesta').value = ""
    });

    $w('#cerrarVideo').onClick(() => {
        $w('#cerrarVideo').hide()
        $w('#video').collapse()
        $w('#circulos').show()
    });
});



export function inicio_click_1(event) {
    if (!item || !idItem) {
        console.error("Datos no cargados. Por favor recarga la página.");
        return;
    }
    $w('#intro').hide()
    $w('#snelleTest').show()
}
