// 1. Importación corregida
import { GoogleGenerativeAI } from "@google/generative-ai";
import { VercelRequest, VercelResponse } from "@vercel/node";

// Esta función se ejecutará en el servidor de Vercel, no en el navegador.
export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Método no permitido' });
  }

  // 2. Variable de entorno: ¡Asegúrate de que este nombre coincida con el de Vercel!
  const apiKey = process.env.API_KEY; 
  if (!apiKey) {
    // Se ha cambiado el código de estado a 500 (Error del servidor) que es más apropiado
    return response.status(500).json({ error: 'La clave de API no está configurada en el servidor.' });
  }

  try {
    const { base64Data, mimeType } = request.body;
    if (!base64Data || !mimeType) {
        return response.status(400).json({ error: 'Faltan datos de la imagen (base64) o el tipo MIME.' });
    }

    // 3. Creación del cliente corregida
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // 4. Se obtiene el modelo y se configura la respuesta JSON
    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash-latest", // Nombre de modelo actualizado y válido
        generationConfig: {
            responseMimeType: "application/json",
        },
    });

    // 5. Esquema con los tipos de datos como strings
    const schema = {
        type: 'object',
        properties: {
            proveedor: { type: 'string' },
            nif: { type: 'string' },
            numeroFactura: { type: 'string' },
            fechaEmision: { type: 'string' },
            fechaVencimiento: { type: 'string' },
            total: { type: 'number' },
            baseImponible: { type: 'number' },
            impuestos: { type: 'number' },
            lineas: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        description: { type: 'string' },
                        quantity: { type: 'number' },
                        unitPrice: { type: 'number' },
                        totalPrice: { type: 'number' },
                    },
                    required: ["description", "totalPrice"]
                }
            }
        },
        required: ["proveedor", "numeroFactura", "fechaEmision", "total"]
    };

    const imagePart = {
        inlineData: {
            data: base64Data,
            mimeType: mimeType,
        },
    };
    
    const prompt = `Extrae los datos estructurados de la siguiente factura, incluyendo las líneas de detalle o conceptos facturados. Responde únicamente con el objeto JSON definido en el siguiente esquema: ${JSON.stringify(schema)}`;

    // 6. Llamada a generateContent corregida
    const result = await model.generateContent([prompt, imagePart]);
    
    // 7. Acceso a la respuesta corregido
    const jsonResponse = result.response.text();
    
    return response.status(200).json(JSON.parse(jsonResponse));

  } catch (error) {
    console.error('Error al procesar con Gemini:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return response.status(500).json({ error: `Error interno del servidor: ${errorMessage}` });
  }
}