import React, { useState, useEffect, useRef } from 'react';
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
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMessages([
            { role: 'model', text: 'Hola. Soy el asistente de análisis. Puede preguntarme sobre esta propuesta o sobre los datos de las facturas que ha procesado.' }
        ]);
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async (messageText: string) => {
        if (!messageText.trim() || isLoading) return;

        const userMessage: Message = { role: 'user', text: messageText };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    history: messages,
                    message: messageText,
                    context: invoices,
                }),
            });

            if (!response.ok || !response.body) {
                 const errorData = await response.json();
                 throw new Error(errorData.error || `Error del servidor: ${response.statusText}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            
            let modelResponse = '';
            setMessages(prev => [...prev, { role: 'model', text: '' }]);

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const eventLines = chunk.split('\n\n').filter(line => line.trim() !== '');

                for (const line of eventLines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.substring(6));
                            if (data.text) {
                                modelResponse += data.text;
                                setMessages(prev => {
                                    const newMessages = [...prev];
                                    if(newMessages.length > 0) {
                                      newMessages[newMessages.length - 1].text = modelResponse;
                                    }
                                    return newMessages;
                                });
                            }
                        } catch (e) {
                            console.error('Failed to parse stream chunk:', e);
                        }
                    }
                }
            }

        } catch (e) {
            console.error(e);
            const errorMessage = e instanceof Error ? e.message : 'Lo siento, ha ocurrido un error al procesar tu solicitud.';
            setError(errorMessage);
            setMessages(prev => {
                const lastMessage = prev[prev.length - 1];
                if (lastMessage?.role === 'model' && lastMessage?.text === '') {
                    return [...prev.slice(0, -1), { role: 'model', text: `Lo siento, no he podido procesar tu solicitud. ${errorMessage}` }];
                }
                return [...prev, { role: 'model', text: `Lo siento, no he podido procesar tu solicitud. ${errorMessage}` }];
            });
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
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !inputValue.trim()}
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