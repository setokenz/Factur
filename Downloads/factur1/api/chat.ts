import { GoogleGenAI } from "@google/genai";
import type { Message, InvoiceFile } from "../types";

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'API key not configured on server.' });
    }

    try {
        const { history, message, context } = req.body as { history: Message[], message: string, context: InvoiceFile[] };

        if (!message) {
            return res.status(400).json({ error: 'Message is required.' });
        }

        let finalMessage = message;
        const hasData = context && context.length > 0;
        if (hasData) {
            const dataContext = context.map(f => f.extractedData).filter(Boolean);
            if (dataContext.length > 0) {
                 const contextString = JSON.stringify(dataContext, null, 2);
                finalMessage = `Basado en los siguientes datos de facturas:\n\n\`\`\`json\n${contextString}\n\`\`\`\n\nResponde a la siguiente pregunta: ${message}`;
            }
        }
        
        const ai = new GoogleGenAI({ apiKey });
        const chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            history: history.map((msg: Message) => ({
                role: msg.role,
                parts: [{ text: msg.text }],
            })),
            config: {
                systemInstruction: `Eres un asistente experto en una plataforma de optimización financiera. Tu propósito es doble:
1.  Responder preguntas generales sobre la propuesta de servicio, sus características, tecnologías y beneficios. Sé claro, conciso y profesional.
2.  Analizar los datos de facturación que se te proporcionan en formato JSON dentro de la conversación. Utiliza estos datos para responder a preguntas específicas sobre gastos, proveedores, fechas, totales, etc. Si el usuario pregunta algo sobre los datos y no tienes información suficiente en el JSON, indícalo claramente. No inventes datos.

Mantén un tono servicial y analítico.`,
            }
        });

        const stream = await chat.sendMessageStream({ message: finalMessage });
        
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders(); 

        for await (const chunk of stream) {
            const chunkText = chunk.text;
            if (chunkText) {
                res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
            }
        }
        
        res.end();

    } catch (error) {
        console.error('Error processing chat:', error);
        if (!res.headersSent) {
             const errorMessage = error instanceof Error ? error.message : 'Unknown error';
             res.status(500).json({ error: `Internal server error: ${errorMessage}` });
        } else {
            res.end();
        }
    }
}
