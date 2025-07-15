import React, { useState } from 'react';
import type { InvoiceFile } from '../types';
import { FileTextIcon, ArrowDownIcon, FileWarningIcon } from '../constants';

// A specific row component for the detailed view
const DetailRow: React.FC<{ label: string; value: string | number | undefined | null; isTotal?: boolean }> = ({ label, value, isTotal = false }) => (
    <div className={`flex justify-between items-start py-3 ${!isTotal ? 'border-b border-slate-100' : ''}`}>
        <dt className="text-sm text-slate-500">{label}</dt>
        <dd className={`text-sm text-right font-medium text-slate-800 ${isTotal ? 'text-lg font-bold text-cyan-700' : 'font-semibold'}`}>{value || 'N/A'}</dd>
    </div>
);


const ExtractedDataCard: React.FC<{ file: InvoiceFile }> = ({ file }) => {
    const { extractedData: data, preview, file: fileInfo } = file;
    const [isExpanded, setIsExpanded] = useState(false);

    if (!data) return null;

    const formattedTotal = data.total ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(data.total) : 'N/A';

    const renderLineItems = () => {
        if (!data.lineas || data.lineas.length === 0) {
            return null;
        }

        return (
            <div className="mt-6">
                <h5 className="text-md font-semibold text-slate-700 mb-3">Conceptos Facturados</h5>
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-sm text-left text-slate-600">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                            <tr>
                                <th scope="col" className="px-4 py-3">Descripción</th>
                                <th scope="col" className="px-4 py-3 text-right">Cantidad</th>
                                <th scope="col" className="px-4 py-3 text-right">P. Unitario</th>
                                <th scope="col" className="px-4 py-3 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.lineas.map((line, index) => (
                                <tr key={index} className="bg-white border-b border-slate-100 last:border-b-0">
                                    <td className="px-4 py-3 font-medium text-slate-900">{line.description || 'N/A'}</td>
                                    <td className="px-4 py-3 text-right">{line.quantity ?? 'N/A'}</td>
                                    <td className="px-4 py-3 text-right">{line.unitPrice ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(line.unitPrice) : 'N/A'}</td>
                                    <td className="px-4 py-3 text-right font-semibold">{line.totalPrice ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(line.totalPrice) : 'N/A'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-slate-200 overflow-hidden">
            {/* Collapsed Row View */}
            <div 
                className="flex items-center justify-between p-4 cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
                role="button"
                aria-expanded={isExpanded}
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        setIsExpanded(!isExpanded);
                    }
                }}
            >
                <div className="flex items-center space-x-4 min-w-0 flex-1">
                    <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-cyan-600 flex items-center justify-center text-white">
                        <FileTextIcon />
                    </div>
                    <div className="min-w-0">
                        <p className="text-base font-bold text-slate-800 truncate" title={data.proveedor || "Proveedor Desconocido"}>{data.proveedor || "Proveedor Desconocido"}</p>
                        <p className="text-sm text-slate-500">
                            Factura #{data.numeroFactura || 'N/A'}
                        </p>
                    </div>
                </div>
                
                <div className="hidden md:flex items-center space-x-8 text-sm mx-4">
                     <div className="text-center">
                        <p className="text-slate-500 text-xs">Fecha</p>
                        <p className="font-medium text-slate-800">{data.fechaEmision || 'N/A'}</p>
                    </div>
                     <div className="text-center">
                        <p className="text-slate-500 text-xs">Total</p>
                        <p className="font-bold text-cyan-700 text-base">{formattedTotal}</p>
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    {/* Total for mobile view */}
                    <div className="md:hidden text-right">
                        <p className="font-bold text-cyan-700 text-base">{formattedTotal}</p>
                    </div>
                    <ArrowDownIcon className={`h-5 w-5 text-slate-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="p-6 pt-4 border-t border-slate-200 animate-fade-in-down">
                     <style>{`.animate-fade-in-down { animation: fadeInDown 0.4s ease-in-out; } @keyframes fadeInDown { 0% { opacity: 0; transform: translateY(-10px); } 100% { opacity: 1; transform: translateY(0); } }`}</style>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left Column: All Extracted Data */}
                        <div>
                             <h4 className="text-lg font-bold text-slate-800 mb-2">Detalles de la Factura</h4>
                             <dl className="mt-4">
                                <DetailRow label="Proveedor" value={data.proveedor} />
                                <DetailRow label="NIF/CIF" value={data.nif} />
                                <DetailRow label="Nº Factura" value={data.numeroFactura} />
                                <DetailRow label="Fecha Emisión" value={data.fechaEmision} />
                                <DetailRow label="Fecha Vencimiento" value={data.fechaVencimiento} />
                                <DetailRow label="Base Imponible" value={data.baseImponible ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(data.baseImponible) : 'N/A'} />
                                <DetailRow label="IVA / Impuestos" value={data.impuestos ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(data.impuestos) : 'N/A'} />
                                <DetailRow label="Total Factura" value={formattedTotal} isTotal />
                            </dl>
                            {renderLineItems()}
                        </div>

                        {/* Right Column: Invoice Preview */}
                        <div className="w-full h-96 lg:h-full min-h-[500px] rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center p-2">
                             {preview ? (
                                <img 
                                    src={preview} 
                                    alt={`Previsualización de ${fileInfo.name}`} 
                                    className="w-full h-full object-contain" 
                                />
                            ) : (
                                <div className="text-center text-slate-500 flex flex-col items-center justify-center h-full p-4">
                                    <FileWarningIcon />
                                    <p className="mt-4 font-semibold">No se pudo generar la previsualización</p>
                                    <p className="mt-1 text-sm">Hubo un problema al procesar el archivo PDF.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExtractedDataCard;