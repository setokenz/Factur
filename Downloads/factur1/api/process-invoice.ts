import { GoogleGenAI, Type } from "@google/genai";

// Esta función se ejecutará en el servidor de Vercel, no en el navegador.
export default async function handler(request: any, response: any) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Método no permitido' });
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return response.status(500).json({ error: 'La clave de API no está configurada en el servidor.' });
  }

  try {
    const { base64Data, mimeType } = request.body;
    if (!base64Data || !mimeType) {
        return response.status(400).json({ error: 'Faltan datos de la imagen (base64) o el tipo MIME.' });
    }

    const ai = new GoogleGenAI({ apiKey });

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
            data: base64Data,
            mimeType: mimeType,
        },
    };
    
    const prompt = "Extrae los datos estructurados de la siguiente factura, incluyendo las líneas de detalle o conceptos facturados. Responde únicamente con el objeto JSON.";

    const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text: prompt }, imagePart] },
        config: { responseMimeType: "application/json", responseSchema: schema }
    });
    
    // Vercel recomienda usar JSON.parse(result.text) si la respuesta es un string JSON
    // pero si el SDK ya lo parsea, se podría usar directamente result.json()
    // Por seguridad, parseamos el texto que sabemos que es un string.
    return response.status(200).json(JSON.parse(result.text));

  } catch (error) {
    console.error('Error al procesar con Gemini:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return response.status(500).json({ error: `Error interno del servidor: ${errorMessage}` });
  }
}
