// api/generate-image.js
import path from 'path';
import fs from 'fs';
import fetch from 'node-fetch';
import multer from 'multer'; // Importar multer
import Replicate from 'replicate';
import 'dotenv/config';
import Cors from 'cors'; // Importar cors

// Inicialización de la API de Replicate
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_KEY // Asegúrate de tener la clave API en .env
});

// Configurar multer para almacenar archivos subidos
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Crear la carpeta 'public/imagenes' si no existe
const imagesDir = path.join(process.cwd(), 'public/imagenes'); // Cambiar a public/imagenes
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true }); // Asegúrate de crear cualquier subdirectorio necesario
}

// Configuración de CORS
const cors = Cors({
  methods: ['POST', 'OPTIONS'], // Métodos permitidos
  origin: 'https://togs.vercel.app', // Cambia esto por tu dominio de producción o '*'
});

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
    const filePath = path.join(imagesDir, fileName); // Guardar en la carpeta 'public/imagenes'

    fs.writeFileSync(filePath, imageBuffer);
    console.log(`Imagen guardada como ${filePath}`);

    return fileName; // Retorna el nombre del archivo guardado
  } catch (error) {
    console.error("Error al ejecutar el modelo:", error);
    return null;
  }
}

// Función para descargar la imagen de una URL
async function descargarImagen(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Error al descargar la imagen: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer); // Devuelve un buffer de la imagen
}

// Manejador de la ruta para generar la imagen
export default async function handler(req, res) {
  // Aplicar el middleware de CORS
  cors(req, res, async () => {
    if (req.method === 'POST') {
      // Configurar multer para procesar la solicitud
      upload.fields([{ name: 'human_img' }, { name: 'garm_img' }])(req, res, async (err) => {
        if (err) {
          return res.status(400).json({ error: 'Error al procesar las imágenes' });
        }

        try {
          // Verifica que se estén recibiendo las imágenes
          const humanImageUrl = req.body.human_img || (req.files['human_img'] && req.files['human_img'][0].buffer);
          const garmentImageUrl = req.body.garm_img || (req.files['garm_img'] && req.files['garm_img'][0].buffer);

          if (!humanImageUrl || !garmentImageUrl) {
            return res.status(400).send('Faltan imágenes en la solicitud.');
          }

          const humanImgBuffer = await descargarImagen(humanImageUrl);
          const garmImgBuffer = await descargarImagen(garmentImageUrl);

          const fileName = await runModel(humanImgBuffer, garmImgBuffer);
          if (fileName) {
            res.json({ imageUrl: `imagenes/${fileName}` }); // Cambiar localhost a la URL de Vercel
          } else {
            res.status(500).send('Error al generar la imagen');
          }
        } catch (error) {
          console.error("Error en la ruta /generate-image:", error);
          res.status(500).send(`Error interno del servidor: ${error.message}`);
        }
      });
    } else {
      res.setHeader('Allow', ['POST']);
      res.status(405).end(`Método ${req.method} no permitido`);
    }
  });
}
