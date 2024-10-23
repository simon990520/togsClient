import express from 'express';
import path from 'path';
import Replicate from "replicate";
import fs from 'fs';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import multer from 'multer'; // Importar multer
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const port = 3000;

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_KEY // Asegúrate de tener la clave API en .env
});

// Configurar multer para almacenar archivos subidos
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Crear la carpeta 'imagenes' si no existe
const imagesDir = path.join(__dirname, 'imagenes');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir);
}

// Función para formatear la fecha y hora
function getFormattedDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
}

// Función para ejecutar el modelo y guardar la imagen
async function runModel(humanImgBuffer, garmImgBuffer) {
  try {
    const output = await replicate.run(
      "cuuupid/idm-vton:c871bb9b046607b680449ecbae55fd8c6d945e0a1948644bf2361b3d021d3ff4",
      {
        input: {
          crop: false,
          seed: 42,
          steps: 30,
          category: "upper_body",
          force_dc: false,
          garm_img: garmImgBuffer, // Ajuste para base64
          human_img: humanImgBuffer, // Ajuste para base64
          garment_des: "cute pink top"
        }
      }
    );

    // Asegúrate de que el modelo retorne la URL correctamente
    const imageUrl = output; 

    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Error al descargar la imagen: ${imageResponse.statusText}`);
    }

    const arrayBuffer = await imageResponse.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    const timestamp = getFormattedDate();
    const fileName = `output-image_${timestamp}.png`;
    const filePath = path.join(imagesDir, fileName); // Guardar en la carpeta 'imagenes'

    fs.writeFileSync(filePath, imageBuffer);
    console.log(`Imagen guardada como ${filePath}`);

    return fileName; // Retorna el nombre del archivo guardado
  } catch (error) {
    console.error("Error al ejecutar el modelo:", error);
    return null;
  }
}
// Asegúrate de que tienes las siguientes líneas antes de tu ruta
app.use(express.urlencoded({ extended: true })); // Para manejar datos de formularios
app.use(express.json()); // Para manejar JSON

// Ruta para generar la imagen
app.post('/generate-image', upload.fields([{ name: 'human_img' }, { name: 'garm_img' }]), async (req, res) => {
    try {
        // Verifica que se estén recibiendo las URLs
        const humanImageUrl = req.body.human_img || (req.files['human_img'] && req.files['human_img'][0].path);
        const garmentImageUrl = req.body.garm_img || (req.files['garm_img'] && req.files['garm_img'][0].path);

        if (!humanImageUrl || !garmentImageUrl) {
            return res.status(400).send('Faltan imágenes en la solicitud.');
        }

        // Descarga las imágenes de las URLs
        const humanImgBuffer = await descargarImagen(humanImageUrl);
        const garmImgBuffer = await descargarImagen(garmentImageUrl);

        const fileName = await runModel(humanImgBuffer, garmImgBuffer);
        if (fileName) {
            res.json({ imageUrl: `http://localhost:${port}/imagenes/${fileName}` });
        } else {
            res.status(500).send('Error al generar la imagen');
        }
    } catch (error) {
        console.error("Error en la ruta /generate-image:", error);
        res.status(500).send(`Error interno del servidor: ${error.message}`);
    }
});

// Función para descargar la imagen de una URL
async function descargarImagen(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Error al descargar la imagen: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer); // Devuelve un buffer de la imagen
}
// Middleware para servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
// Ruta para servir el HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html')); // Sirve el archivo index.html
});
// Ruta para servir el HTML
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html')); // Sirve el archivo index.html
});
// Ruta para servir el HTML
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html')); // Sirve el archivo index.html
});

// Sirve las imágenes generadas
app.use('/imagenes', express.static(imagesDir)); // Sirve la carpeta 'imagenes'




// Inicia el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
