import path from 'path';
import fs from 'fs';
import fetch from 'node-fetch';
import multer from 'multer';
import Replicate from 'replicate';
import Cors from 'cors';

// Inicialización de la API de Replicate
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_KEY
});

// Configuración de almacenamiento de archivos con multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Crear la carpeta 'public/imagenes' si no existe
const imagesDir = path.join(process.cwd(), 'public/imagenes');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Lista de orígenes permitidos
const allowedOrigins = ['https://togs.vercel.app', 'http://localhost:3000'];

// Middleware para CORS dinámico
function dynamicCors(req, res) {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
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
          garm_img: garmImgBuffer,
          human_img: humanImgBuffer,
          garment_des: "cute pink top"
        }
      }
    );

    const imageUrl = output;
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) throw new Error(`Error al descargar la imagen: ${imageResponse.statusText}`);

    const arrayBuffer = await imageResponse.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `output-image_${timestamp}.png`;
    const filePath = path.join(imagesDir, fileName);

    fs.writeFileSync(filePath, imageBuffer);
    console.log(`Imagen guardada como ${filePath}`);

    return fileName;
  } catch (error) {
    console.error("Error al ejecutar el modelo:", error);
    return null;
  }
}

// Manejador de la ruta para generar la imagen
export default async function handler(req, res) {
  // Configurar encabezados CORS dinámicos
  dynamicCors(req, res);

  if (req.method === 'OPTIONS') {
    res.status(200).end(); // Responder OK para preflight de CORS
    return;
  }

  if (req.method === 'POST') {
    upload.fields([{ name: 'human_img' }, { name: 'garm_img' }])(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: 'Error al procesar las imágenes' });
      }

      try {
        const humanImageUrl = req.body.human_img || (req.files['human_img'] && req.files['human_img'][0].buffer);
        const garmentImageUrl = req.body.garm_img || (req.files['garm_img'] && req.files['garm_img'][0].buffer);

        if (!humanImageUrl || !garmentImageUrl) {
          return res.status(400).send('Faltan imágenes en la solicitud.');
        }

        const humanImgBuffer = Buffer.isBuffer(humanImageUrl) ? humanImageUrl : await descargarImagen(humanImageUrl);
        const garmImgBuffer = Buffer.isBuffer(garmentImageUrl) ? garmentImageUrl : await descargarImagen(garmentImageUrl);

        const fileName = await runModel(humanImgBuffer, garmImgBuffer);
        if (fileName) {
          res.json({ imageUrl: `https://togs-fru2.onrender.com/imagenes/${fileName}` });
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
}
