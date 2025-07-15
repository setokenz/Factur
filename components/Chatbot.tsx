import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import type { Message, InvoiceFile } from '../types';
import { SendHorizonalIcon, BotMessageSquareIcon } from '../constants';

const examplePrompts = [
    "¿Cuál es el gasto total?",
    "Lista las facturas de Maersk",
    "¿Hay alguna anomalía en los datos?",
];

interface ChatbotProps {
    invoices: InvoiceFile[];
}

const Chatbot: React.FC<ChatbotProps> = ({ invoices }) => {
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!process.env.API_KEY) {
            setError('Error: La clave de API no está configurada.');
            setIsLoading(true); // Disable input
            return;
        }
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const chatSession = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction: `Eres un asistente experto en una plataforma de optimización financiera. Tu propósito es doble:
1.  Responder preguntas generales sobre la propuesta de servicio, sus características, tecnologías y beneficios. Sé claro, conciso y profesional.
2.  Analizar los datos de facturación que se te proporcionan en formato JSON dentro de la conversación. Utiliza estos datos para responder a preguntas específicas sobre gastos, proveedores, fechas, totales, etc. Si el usuario pregunta algo sobre los datos y no tienes información suficiente en el JSON, indícalo claramente. No inventes datos.

Mantén un tono servicial y analítico.`,
                }
            });
            setChat(chatSession);
            setMessages([
                { role: 'model', text: 'Hola. Soy el asistente de análisis. Puede preguntarme sobre esta propuesta o sobre los datos de las facturas que ha procesado.' }
            ]);
        } catch (e) {
            console.error(e);
            setError('Error al inicializar el asistente de IA. Asegúrate de que la clave de API esté configurada.');
        }
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async (messageText: string) => {
        if (!messageText.trim() || isLoading || !chat) return;

        const userMessage: Message = { role: 'user', text: messageText };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);
        setError(null);

        let finalMessage = messageText;
        const hasData = invoices && invoices.length > 0;
        
        if (hasData) {
            const dataContext = invoices.map(f => f.extractedData).filter(Boolean);
            if(dataContext.length > 0) {
                 const contextString = JSON.stringify(dataContext, null, 2);
                finalMessage = `Basado en los siguientes datos de facturas:\n\n\`\`\`json\n${contextString}\n\`\`\`\n\nResponde a la siguiente pregunta: ${messageText}`;
            }
        }


        try {
            const stream = await chat.sendMessageStream({ message: finalMessage });
            
            let modelResponse = '';
            setMessages(prev => [...prev, { role: 'model', text: '' }]);

            for await (const chunk of stream) {
                modelResponse += chunk.text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1].text = modelResponse;
                    return newMessages;
                });
            }
        } catch (e) {
            console.error(e);
            setError('Lo siento, ha ocurrido un error al procesar tu solicitud.');
            setMessages(prev => [...prev, { role: 'model', text: 'Lo siento, no he podido procesar tu solicitud en este momento.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(inputValue);
    };

    return (
        <div className="w-full max-w-3xl mx-auto bg-white rounded-xl shadow-lg border border-slate-200 flex flex-col h-[600px]">
            <div className="p-4 border-b border-slate-200 flex items-center space-x-3">
                <div className="p-2 bg-cyan-100 rounded-full">
                    <BotMessageSquareIcon />
                </div>
                <div>
                    <h3 className="font-bold text-slate-800">Asistente de Análisis</h3>
                    <p className="text-sm text-slate-500">Potenciado por Gemini</p>
                </div>
            </div>
            <div className="flex-grow p-4 overflow-y-auto bg-slate-50">
                <div className="space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-lg px-4 py-2 rounded-xl ${msg.role === 'user' ? 'bg-cyan-600 text-white' : 'bg-slate-200 text-slate-800'}`}>
                                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && messages[messages.length - 1]?.role === 'user' && (
                        <div className="flex justify-start">
                            <div className="max-w-lg px-4 py-2 rounded-xl bg-slate-200 text-slate-800">
                                <div className="flex items-center space-x-2">
                                    <span className="h-2 w-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="h-2 w-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="h-2 w-2 bg-slate-500 rounded-full animate-bounce"></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>
            {error && <p className="p-4 text-sm text-red-600 bg-red-50 border-t">{error}</p>}
            <div className="p-4 border-t border-slate-200 bg-white space-y-4">
                <div>
                     <p className="text-xs text-slate-500 mb-2">Sugerencias (si hay datos cargados):</p>
                    <div className="flex flex-wrap gap-2">
                        {examplePrompts.map((prompt, i) => (
                            <button
                                key={i}
                                onClick={() => sendMessage(prompt)}
                                disabled={isLoading || invoices.length === 0}
                                className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-sm hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {prompt}
                            </button>
                        ))}
                    </div>
                </div>
                <form onSubmit={handleFormSubmit} className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Escribe tu pregunta aquí..."
                        className="flex-grow px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        disabled={isLoading || !chat}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !inputValue.trim() || !chat}
                        className="bg-cyan-600 text-white p-3 rounded-lg hover:bg-cyan-700 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                        aria-label="Enviar mensaje"
                    >
                        <SendHorizonalIcon />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Chatbot;
