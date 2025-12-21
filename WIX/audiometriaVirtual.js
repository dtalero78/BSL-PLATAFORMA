import wixData from 'wix-data';
import wixLocation from 'wix-location';
import wixWindow from 'wix-window';
import { local } from 'wix-storage';

let heather = "FORM";
local.setItem('heather', heather);

let item = $w("#dataset1").getCurrentItem();
let codEmpresa = item.codEmpresa;
let cedula = item.numeroId;
let id = item._id;
console.log(cedula);

let audios = [
    { name: "8000R.mp3", url: "https://static.wixstatic.com/mp3/cb6469_d06b935537374e2a968dca8bcfaba73d.mp3", beeps: 7, fieldName: "auDer8000" },
    { name: "6000R.mp3", url: "https://static.wixstatic.com/mp3/cb6469_059698e3043545dfbd85c444308b30c0.mp3", beeps: 7, fieldName: "auDer6000" },
    { name: "3000R.mp3", url: "https://static.wixstatic.com/mp3/cb6469_7e193babac6d4c7cafdb251876cd3332.mp3", beeps: 7, fieldName: "auDer3000" },
    { name: "4000R.mp3", url: "https://static.wixstatic.com/mp3/cb6469_02c9df26d50f4cad911940300bc1cff3.mp3", beeps: 7, fieldName: "auDer4000" },
    { name: "1000R.mp3", url: "https://static.wixstatic.com/mp3/cb6469_99d679820a0048a5bb93ca99a1b28789.mp3", beeps: 7, fieldName: "auDer1000" },
    { name: "2000R.mp3", url: "https://static.wixstatic.com/mp3/cb6469_00feac9a7fa3460e94d3aa410029608c.mp3", beeps: 7, fieldName: "auDer2000" },
    { name: "500R.mp3", url: "https://static.wixstatic.com/mp3/cb6469_85251dd58337478d8ceb1d49b982960a.mp3", beeps: 7, fieldName: "auDer500" },
    { name: "250R.mp3", url: "https://static.wixstatic.com/mp3/cb6469_86f4976f68e44e44a51d872a3e113684.mp3", beeps: 7, fieldName: "auDer250" },
    { name: "8000L.mp3", url: "https://static.wixstatic.com/mp3/cb6469_40afdcc551664aa4bce9424dbd305368.mp3", beeps: 7, fieldName: "auIzq8000" },
    { name: "6000L.mp3", url: "https://static.wixstatic.com/mp3/cb6469_e78c9a40b2d242718b5488e69a651ffd.mp3", beeps: 7, fieldName: "auIzq6000" },
    { name: "3000L.mp3", url: "https://static.wixstatic.com/mp3/cb6469_13b2589524aa40f89986e9bcb25386e3.mp3", beeps: 7, fieldName: "auIzq3000" },
    { name: "4000L.mp3", url: "https://static.wixstatic.com/mp3/cb6469_fa12ef69d86c45b894e9afce6e310a71.mp3", beeps: 7, fieldName: "auIzq4000" },
    { name: "1000L.mp3", url: "https://static.wixstatic.com/mp3/cb6469_00326d7a14d04ebca8a6b03724d78452.mp3", beeps: 7, fieldName: "auIzq1000" },
    { name: "2000L.mp3", url: "https://static.wixstatic.com/mp3/cb6469_9993dcccb17b47279bf91d9c5fa07b7d.mp3", beeps: 7, fieldName: "auIzq2000" },
    { name: "500L.mp3", url: "https://static.wixstatic.com/mp3/cb6469_819e9b89b25d42fbb6b60f0133753adf.mp3", beeps: 7, fieldName: "auIzq500" },
    { name: "250L.mp3", url: "https://static.wixstatic.com/mp3/cb6469_c3469e08edea44ffa2b345a9cb60ac81.mp3", beeps: 7, fieldName: "auIzq250" },
];
let currentIndex = 0;

// Variable para almacenar las respuestas temporalmente
let userResponses = {};

$w.onReady(function () {
    // Muestra el botón de inicio al finalizar el video introductorio
    $w("#videoBox1").onEnded(() => {
        $w("#startButton").show();
        wixWindow.scrollTo(0, 9999); // desplazarse hacia abajo

    });

    // Configura el botón de inicio para comenzar la segunda etapa
    $w("#startButton").onClick(() => {
        startTest(); // Llama a la función para iniciar la prueba
    });

    setTimeout(() => {
        $w("#startButton").show();

    }, 10000);

    // Asigna eventos de clic a cada botón del teclado numérico
    $w("#b1").onClick(() => registerAnswer(1));
    $w("#b2").onClick(() => registerAnswer(2));
    $w("#b3").onClick(() => registerAnswer(3));
    $w("#b4").onClick(() => registerAnswer(4));
    $w("#b5").onClick(() => registerAnswer(5));
    $w("#b6").onClick(() => registerAnswer(6));
    $w("#b7").onClick(() => registerAnswer(7));
    $w("#b8").onClick(() => registerAnswer(8));
    $w("#b9").onClick(() => registerAnswer(9));

    // Oculta el teclado durante la reproducción del audio
    $w("#mp3Player").onPlay(() => {
        $w("#boxTeclado").hide();
    });
    $w("#mp3Player").onEnded(() => {
        $w("#boxTeclado").show();
    });
});

function startTest() {
    // Oculta la etapa de bienvenida y muestra la segunda etapa
    $w("#bienvenidaBox").hide();
    $w("#startButton").hide(); // Oculta el botón de inicio en la segunda etapa
    $w("#boxPrueba").show(); // Muestra el reproductor y el teclado

    currentIndex = 0;
    audios = shuffleArray(audios); // Mezcla los audios
    playNextAudio();
    $w("#progressBar1").value = 0;
}

function playNextAudio() {
    wixWindow.scrollTo(0, 0);
    $w("#mp3Player").volume = 10;

    if (currentIndex < audios.length) {
        let audio = audios[currentIndex];
        $w("#mp3Player").pause();
        $w("#mp3Player").src = audio.url;

        // Reproduce el audio (los eventos onPlay y onEnded ya están asignados)
        $w("#mp3Player").play();

        updateProgressBar();
        updateTestCounter();
    } else {
        saveAllResponses(); // Guardar todas las respuestas al final
    }
}

function registerAnswer(userAnswer) {
    let currentAudioField = audios[currentIndex].fieldName;
    let mappedAnswer = mapAnswerToDecibels(userAnswer);

    // Almacena la respuesta en el objeto userResponses
    userResponses[currentAudioField] = mappedAnswer;

    // Avanza al siguiente audio
    currentIndex++;
    playNextAudio();
}

function saveAllResponses() {
    $w('#loading').show()
    $w('#boxTeclado').hide()
    let toInsertOrUpdate = {
        "numeroId": item._id,
        "idGeneral": item._id,
        "cedula": cedula,
        "codEmpresa": codEmpresa,
        ...userResponses // Agrega todas las respuestas guardadas temporalmente
    };

    wixData.query("AUDIOMETRIA")
        .eq("cedula", cedula)
        .find()
        .then(results => {
            if (results.items.length > 0) {
                // Actualiza el registro existente
                let existingItem = results.items[0];
                let updatedItem = Object.assign(existingItem, toInsertOrUpdate);
                return wixData.update("AUDIOMETRIA", updatedItem);
            } else {
                // Inserta un nuevo registro
                return wixData.insert("AUDIOMETRIA", toInsertOrUpdate);
            }
        })
        .then(results => {
            console.log("Datos guardados correctamente", results);
            wixLocation.to(`https://www.bsl.com.co/visual2/` + id); // Redirige después de guardar
        })
        .catch(error => {
            console.error("Error al trabajar con la base de datos", error);
        });
}

function updateProgressBar() {
    let progress = (currentIndex / audios.length) * 100;
    $w("#progressBar1").value = progress;
}

function updateTestCounter() {
    let currentTestNumber = currentIndex + 1;
    let totalTests = audios.length;
    $w("#contador").text = `${currentTestNumber} de ${totalTests}`;
}

function mapAnswerToDecibels(beepsHeard) {
    switch (beepsHeard) {
    case 7:
        return 0;
    case 6:
        return 10;
    case 5:
        return 20;
    case 4:
        return 30;
    case 3:
        return 40;
    case 2:
        return 50;
    case 1:
        return 60;
    default:
        return 70;
    }
}

// Función para mezclar el array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

const telefono = "+573008021701";
const mensaje = "Hola. Requiero soporte con el formulario";
const enlaceWhatsApp = `https://api.whatsapp.com/send?phone=${telefono}&text=${encodeURIComponent(mensaje)}`;
$w('#whp').link = enlaceWhatsApp;
$w('#whp').target = "_blank";