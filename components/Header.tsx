import React from 'react';
import { AlertTriangleIcon } from '../constants';

const Header: React.FC = () => {
    return (
        <header className="bg-slate-800 text-white shadow-lg">
            <div className="bg-amber-400 text-slate-900 text-center py-2.5 px-4 text-sm font-medium">
                <div className="container mx-auto flex items-center justify-center gap-x-3">
                    <AlertTriangleIcon className="h-5 w-5 flex-shrink-0 text-slate-800" />
                    <p><span className="font-bold">MODO DEMOSTRACIÓN:</span> Los datos que suba no se guardarán. Se eliminarán al actualizar o cerrar esta página.</p>
                </div>
            </div>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center max-w-4xl">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight">
                    Propuesta de Servicio: Plataforma de Optimización Financiera
                </h1>
                <p className="mt-6 text-xl text-slate-300">
                    Una solución de IA para revolucionar la gestión financiera y logística marítima en su empresa.
                </p>
                <div className="mt-8">
                     <a href="#proceso" className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-8 rounded-full transition duration-300 ease-in-out transform hover:scale-105">
                        Descubrir la Solución
                    </a>
                </div>
            </div>
        </header>
    );
};

export default Header;