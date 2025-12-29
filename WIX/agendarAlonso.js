import wixData from 'wix-data';
import wixWindow from 'wix-window';
import 'moment/locale/es';
import moment from 'moment';
import { local } from 'wix-storage';
import wixRealtimeFrontend from 'wix-realtime-frontend';

let heather = "BSL";
local.setItem('heather', heather);

const suscribeToChannel = () => {
    const channel = { "name": "messageBoard" };
    wixRealtimeFrontend.subscribe(channel, (message) => {
        try {
            // Accede al contenido del mensaje a través de sus propiedades
            let payloadString = message.payload;
            let payload = JSON.parse(payloadString); // Parsear el mensaje JSON recibido
            $w('#prueba').text = JSON.stringify(payload);
            cargarRepetidor(); // Mostrar el payload como cadena JSON
            console.log(payload);
        } catch (error) {
            console.error("Error al parsear el mensaje:", error);
        }
    })
    .then((id) => {
        console.log("Suscripción exitosa, ID:", id);
    })
    .catch((error) => {
        console.error("Error al suscribir:", error);
    });
};

$w.onReady(function () {
    suscribeToChannel();
});



var options = { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' };

$w("#timePicker1").enabledTimes = [
    { startTime: "07:00", endTime: "21:00" }
];

function configureButton2Click($item, itemData, genero) {
    $item('#button2').onClick(async (event) => {

        let $item = $w.at(event.context);

        const telefono = itemData.celular; // Asume que itemData.celular tiene el número de teléfono

        // Elimina espacios en blanco
        const telefonoLimpio = telefono.replace(/\s+/g, '');

        // Quitar prefijo si existe (para la URL del webhook)
        let telefonoSinPrefijo;
        if (telefonoLimpio.startsWith('+57')) {
            telefonoSinPrefijo = telefonoLimpio.substring(3);
        } else if (telefonoLimpio.startsWith('57')) {
            telefonoSinPrefijo = telefonoLimpio.substring(2);
        } else {
            telefonoSinPrefijo = telefonoLimpio;
        }

        // Asegurar que el teléfono tenga el prefijo 57 (para WHP)
        let telefonoConPrefijo;
        if (telefonoLimpio.startsWith('57')) {
            telefonoConPrefijo = telefonoLimpio; // Ya tiene el prefijo 57
        } else {
            telefonoConPrefijo = '57' + telefonoLimpio; // Agregar prefijo 57
        }

        const acentos = { 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u', 'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U' };
        const cadenaNombre = itemData.primerNombre ? itemData.primerNombre.split('').map(letra => acentos[letra] || letra).join('').toString().split(" ").join("").split(".").join("").split("\t").join("") : "";
        const cadenaId = itemData.numeroId ? itemData.numeroId.split('').map(letra => acentos[letra] || letra).join('').toString().split(" ").join("").split(".").join("").split("\t").join("") : "";
        const cadenaEmpresa = itemData.codEmpresa ? itemData.codEmpresa.split('').map(letra => acentos[letra] || letra).join('').toString().split(" ").join("").split(".").join("").split("\t").join("") : "";
        const cadenaCiudad = itemData.ciudad ? itemData.ciudad.split('').map(letra => acentos[letra] || letra).join('').toString().split(" ").join("").split(".").join("").split("\t").join("") : "";
        const cadenaMedico = itemData.medico ? itemData.medico.split('').map(letra => acentos[letra] || letra).join('').toString().split(" ").join("").split(".").join("").split("\t").join("") : "";
        const itemId = itemData._id || "";

        $item('#button2').text = "https://hook.us1.make.com/3edkq8bfppx31t6zbd86sfu7urdrhti9?cel=" + telefonoSinPrefijo + "&cedula=" + cadenaId + "&nombre=" + cadenaNombre + "&empresa=" + cadenaEmpresa + "&genero=" + genero + "&ciudad=" + cadenaCiudad + "&fecha=" + $item("#datePicker1").value.toLocaleDateString() + "&hora=" + $item("#timePicker1").value.toString() + "&medico=" + cadenaMedico + "&id=" + itemId;

        // Crear o actualizar registro en WHP
        const existing = await wixData.query("WHP").eq("userId", telefonoConPrefijo).find();

        if (existing.items.length > 0) {
            // Actualizar registro existente
            const whpItem = existing.items[0];
            whpItem.stopBot = true;
            await wixData.update("WHP", whpItem);
        } else {
            // Crear nuevo registro
            await wixData.insert("WHP", {
                userId: telefonoConPrefijo,
                stopBot: true
            });
        }

        await $item("#dataset1").setFieldValue("linkEnviado", "ENVIADO");

        await $item("#dataset1").save();
        $item("#agendado").show();
    });
}

$w("#repeater1").onItemReady(($item, itemData, index) => {
    const celular = itemData.celular.split("+57").join("").split(" ").join("").split("-").join("");
    $item("#datos").text = itemData.primerNombre + " " + itemData.primerApellido;
    $item("#fechaCreacion").text = itemData._createdDate.toLocaleDateString('es-ES', options);
    $item("#empresa").text = itemData.codEmpresa;
    $item("#numeroId").text = itemData.numeroId;
    $item("#cedula").text = itemData.numeroId;
    $item("#tipoExamen").text = itemData.tipoExamen;

    // Asegúrate de que itemData.fechaSolicitada tenga un valor antes de intentar usarlo.
    if (itemData && itemData.fechaSolicitada) {
        moment.locale('es');
        const fecha = moment(itemData.fechaSolicitada);

        $item("#fechaSolicitada").text = "Para el: " + fecha.format('D-MMM HH:MM');
    }

    let genero = "";

    if (itemData.examenes) {
        let myValue = itemData.examenes;
        genero = myValue.includes("Serología") ? "FEMENINO" : "";
    }

    if (itemData.examenes) {
        let myValue = itemData.medico;
        genero = myValue.includes("PRESENCIAL") ? "FEMENINO" : "";
    }

    configureButton2Click($item, itemData, genero);

    //Cerrar container
    $item("#cerrar").onClick((event) => {
        $item("#dataset1").save()
        $item("#container4").collapse();

    })

    $w("#medico").onChange(event => {
        let $item = $w.at(event.context);
        const selectedMedico = $item("#medico").value; // Valor seleccionado en el dropdown
        wixWindow.openLightbox("Agenda", selectedMedico);
        console.log("medico:", selectedMedico) // Abre el lightbox y pasa el valor seleccionado
    });
});

// Función helper para restar días
function restarDias(date, days) {
    let result = new Date(date);
    result.setDate(result.getDate() - days);
    return result;
}

// Función centralizada para obtener y filtrar registros
async function obtenerRegistrosHistoriaClinica() {
    const today = new Date();
    const hoyMenos30 = restarDias(today, 1);

    const results = await wixData.query("HistoriaClinica")
        .eq("linkEnviado", null)
        .eq("fechaConsulta", null)
        .gt("_createdDate", hoyMenos30)
        .not(
            wixData.query("HistoriaClinica").hasSome("tipoExamen", ["Periodico Foundever", "Egreso Foundever", "Egreso"])
        )
        .not(
            wixData.query("HistoriaClinica").hasSome("numeroId", ["test", "TEST", "Test"])
        )
        .ne("empresa", "PARTICULAR")
        .not(
            wixData.query("HistoriaClinica").hasSome("codEmpresa", ["SANITHELP-JJ", "EMPRESA", "PLATZI", "NEUROAXIS", "12TREE", "ZIMMER", "RIPPLING", "POWER", "SIIGO"])
        )
        .find();

    // Expresiones regulares para filtros
    const regexCodEmpresa = /\d{5,}/; // 5 o más números seguidos en codEmpresa
    const regexNumeroIdP = /-P$/; // numeroId que termina en -P

    // Filtrar los resultados
    const filteredResults = results.items.filter(item => {
        const validCodEmpresa = item.codEmpresa && !regexCodEmpresa.test(item.codEmpresa);
        const validNumeroId = item.numeroId && !regexNumeroIdP.test(item.numeroId);
        return validCodEmpresa && validNumeroId;
    });

    return filteredResults;
}

// Función centralizada para cargar datos en el repetidor
function cargarDatosEnRepetidor(data) {
    $w('#loading').hide();
    $w('#container4').show();
    $w("#repeater1").data = data;

    $w("#repeater1").forEachItem(($item, itemData, index) => {
        let genero = "";

        if (itemData.examenes) {
            let myValue = itemData.examenes;
            genero = myValue.includes("Serología") ? "FEMENINO" : "";
        }

        configureButton2Click($item, itemData, genero);
    });
}

$w('#button1').onClick(async (event) => {
    $w('#loading').show();
    const filteredResults = await obtenerRegistrosHistoriaClinica();
    cargarDatosEnRepetidor(filteredResults);
});

export async function cargarRepetidor(params) {
    $w('#loading').show();
    const filteredResults = await obtenerRegistrosHistoriaClinica();
    cargarDatosEnRepetidor(filteredResults);
}




// Buscador
let debounceTimer;
export function lupa_click(event, $w) {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    debounceTimer = setTimeout(() => {
        filter($w('#iTitle').value);
    }, 200);

}

let lastFilterTitle;

function filter(title) {
    if (lastFilterTitle !== title) {
        $w('#dataset1').setFilter(wixData.filter()
            .contains('numeroId', title)
            .or(wixData.filter().contains("celular", title))
            .or(wixData.filter().contains("primerApellido", title))
            .or(wixData.filter().contains("primerNombre", title))
            .or(wixData.filter().contains("codEmpresa", title))

        );
        lastFilterTitle = title;
    }
}