
const express = require('express');
const { GoogleGenAI, Type } = require('@google/genai');
const path = require('path');
const multer = require('multer');
const { Readable } = require('stream');

const app = express();
const port = process.env.PORT || 8080;

// Configuración para recibir archivos en memoria
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Servir la aplicación React (construida)
app.use(express.static(path.join(__dirname, 'build')));
app.use(express.json());

// Endpoint seguro para procesar facturas
app.post('/api/process-invoice', upload.single('file'), async (req, res) => {
    if (!process.env.API_KEY) {
        return res.status(500).json({ error: 'La clave de API no está configurada en el servidor.' });
    }
    if (!req.file) {
        return res.status(400).json({ error: 'No se ha subido ningún archivo.' });
    }

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        const schema = {
            type: Type.OBJECT,
            properties: {
                proveedor: { type: Type.STRING },
                nif: { type: Type.STRING },
                numeroFactura: { type: Type.STRING },
                fechaEmision: { type: Type.STRING },
                fechaVencimiento: { type: Type.STRING },
                total: { type: Type.NUMBER },
                baseImponible: { type: Type.NUMBER },
                impuestos: { type: Type.NUMBER },
                lineas: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            description: { type: Type.STRING },
                            quantity: { type: Type.NUMBER },
                            unitPrice: { type: Type.NUMBER },
                            totalPrice: { type: Type.NUMBER },
                        },
                        required: ["description", "totalPrice"]
                    }
                }
            },
            required: ["proveedor", "numeroFactura", "fechaEmision", "total"]
        };

        const imagePart = {
            inlineData: {
                data: req.file.buffer.toString('base64'),
                mimeType: req.file.mimetype,
            },
        };
        
        const prompt = "Extrae los datos estructurados de la siguiente factura, incluyendo las líneas de detalle o conceptos facturados. Responde únicamente con el objeto JSON.";

        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: prompt }, imagePart] },
            config: { responseMimeType: "application/json", responseSchema: schema }
        });

        res.json(JSON.parse(result.text));

    } catch (error) {
        console.error('Error al procesar con Gemini:', error);
        res.status(500).json({ error: 'Error interno al procesar la factura.' });
    }
});


// Servir el index.html para cualquier otra ruta (manejo de rutas de React)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(port, () => {
    console.log(`Servidor escuchando en el puerto ${port}`);
});
