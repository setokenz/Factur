
import React from 'react';
import { ArrowDownIcon } from '../constants';

const WorkflowStep: React.FC<{ title: string; description: string; className?: string }> = ({ title, description, className = '' }) => (
    <div className={`bg-white p-4 rounded-lg shadow-md border text-center ${className}`}>
        <h4 className="font-bold text-cyan-700">{title}</h4>
        <p className="text-sm text-slate-600 mt-1">{description}</p>
    </div>
);

const Arrow: React.FC = () => (
    <div className="flex-shrink-0 mx-4 flex items-center justify-center text-slate-400">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 hidden md:block"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 md:hidden"><path d="M12 5v14"/><path d="m19 12-7 7-7 7"/></svg>
    </div>
);


const WorkflowDiagram: React.FC = () => {
    return (
        <div className="bg-slate-100 p-6 rounded-xl shadow-inner">
            <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-4">
                <WorkflowStep title="1. Carga de Facturas" description="PDF o Imágenes" />
                <Arrow />
                <WorkflowStep title="2. Extracción con IA" description="OCR y NLP" />
                <Arrow />
                <WorkflowStep title="3. Validación Humana" description="Asistida y opcional" className="border-cyan-500 border-2" />
                <Arrow />
                <WorkflowStep title="4. Almacenamiento y Análisis" description="Base de Datos y Dashboard" />
            </div>
        </div>
    );
};

export default WorkflowDiagram;
