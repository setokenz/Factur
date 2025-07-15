import React, { useState, useRef, useMemo, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { UploadCloudIcon, LoaderCircleIcon, Trash2Icon, FileCheckIcon, FileBadgeIcon, FileDownIcon, FilterXIcon, ChevronDownIcon } from '../constants';
import type { InvoiceFile, ExtractedInvoiceData } from '../types';
import ExtractedDataCard from './ExtractedDataCard';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });
};

const generatePdfPreview = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (event) => {
            if (!event.target?.result) {
                return reject(new Error("No se pudo leer el archivo PDF."));
            }
            try {
                const pdfData = new Uint8Array(event.target.result as ArrayBuffer);
                const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
                const page = await pdf.getPage(1);
                const viewport = page.getViewport({ scale: 1.5 });

                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                if (!context) {
                    return reject(new Error("No se pudo obtener el contexto del canvas."));
                }

                canvas.height = viewport.height;
                canvas.width = viewport.width;

                await page.render({ canvasContext: context, viewport }).promise;
                resolve(canvas.toDataURL('image/png'));
            } catch (error) {
                console.error('Error al generar la previsualización del PDF:', error);
                resolve(''); // Resuelve con cadena vacía para no bloquear
            }
        };
        reader.onerror = (error) => {
            console.error('Error al leer el archivo PDF:', error);
            reject(error);
        };
        reader.readAsArrayBuffer(file);
    });
};

const INITIAL_FILTERS = {
    proveedor: '',
    nif: '',
    numeroFactura: '',
    fechaDesde: '',
    fechaHasta: '',
};

interface InvoiceUploaderProps {
    onDataProcessed: (files: InvoiceFile[]) => void;
}

const InvoiceUploader: React.FC<InvoiceUploaderProps> = ({ onDataProcessed }) => {
    const [files, setFiles] = useState<InvoiceFile[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [globalError, setGlobalError] = useState<string | null>(null);
    const [filters, setFilters] = useState(INITIAL_FILTERS);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [csvMenuOpen, setCsvMenuOpen] = useState(false);
    const [pdfMenuOpen, setPdfMenuOpen] = useState(false);
    const csvMenuRef = useRef<HTMLDivElement>(null);
    const pdfMenuRef = useRef<HTMLDivElement>(null);

    const successfullyProcessedFiles = useMemo(() => files.filter(f => f.status === 'success' && f.extractedData), [files]);

    useEffect(() => {
        onDataProcessed(successfullyProcessedFiles);
    }, [successfullyProcessedFiles, onDataProcessed]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (csvMenuRef.current && !csvMenuRef.current.contains(event.target as Node)) {
                setCsvMenuOpen(false);
            }
            if (pdfMenuRef.current && !pdfMenuRef.current.contains(event.target as Node)) {
                setPdfMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const createInvoiceFile = async (file: File): Promise<InvoiceFile> => {
        let preview = '';
        try {
             preview = file.type === 'application/pdf' ? await generatePdfPreview(file) : URL.createObjectURL(file);
        } catch(e) {
            console.error(`Failed to create preview for ${file.name}`, e);
        }
       
        return {
            id: `${file.name}-${file.lastModified}-${file.size}`,
            file,
            preview,
            status: 'idle',
            extractedData: null,
            error: null,
        };
    };

    const handleFileChange = async (selectedFiles: FileList | null) => {
        if (!selectedFiles || selectedFiles.length === 0) return;
        const validFiles = Array.from(selectedFiles).filter(f => f.type.startsWith('image/') || f.type === 'application/pdf');
        if (validFiles.length === 0) return;

        try {
            const newFilePromises = validFiles.map(createInvoiceFile);
            const newFiles = await Promise.all(newFilePromises);
            setFiles(prev => {
                const existingIds = new Set(prev.map(f => f.id));
                const uniqueNewFiles = newFiles.filter(f => !existingIds.has(f.id));
                return [...prev, ...uniqueNewFiles];
            });
        } catch (error) {
             console.error("Error creating file objects:", error);
             setGlobalError("Hubo un error al preparar los archivos para la carga.");
        }

        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleRemoveFile = (id: string) => {
        const fileToRemove = files.find(f => f.id === id);
        if (fileToRemove?.preview.startsWith('blob:')) {
            URL.revokeObjectURL(fileToRemove.preview);
        }
        setFiles(files.filter(file => file.id !== id));
    };
    
    const onDragOver = (e: React.DragEvent) => e.preventDefault();
    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        handleFileChange(e.dataTransfer.files);
    };
    
    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };
    
    const clearFilters = () => setFilters(INITIAL_FILTERS);

    const handleProcessInvoices = async () => {
        setIsProcessing(true);
        setGlobalError(null);
        
        const processFile = async (invoiceFile: InvoiceFile) => {
            try {
                setFiles(prev => prev.map(f => f.id === invoiceFile.id ? { ...f, status: 'processing' } : f));
                
                const base64Data = await fileToBase64(invoiceFile.file);

                const response = await fetch('/api/process-invoice', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        base64Data,
                        mimeType: invoiceFile.file.type,
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `Error del servidor: ${response.statusText}`);
                }

                const data = await response.json() as ExtractedInvoiceData;
                setFiles(prev => prev.map(f => f.id === invoiceFile.id ? { ...f, status: 'success', extractedData: data } : f));
            } catch (e) {
                const errorMessage = e instanceof Error ? e.message : 'No se pudieron extraer los datos.';
                console.error(`Error processing ${invoiceFile.file.name}:`, e);
                setFiles(prev => prev.map(f => f.id === invoiceFile.id ? { ...f, status: 'error', error: errorMessage } : f));
            }
        };

        await Promise.all(files.filter(f => f.status === 'idle').map(processFile));
        setIsProcessing(false);
    };

    const filteredFiles = useMemo(() => {
        return successfullyProcessedFiles.filter(file => {
            const data = file.extractedData;
            if (!data) return false;

            const normalizeDate = (dateStr: string) => {
                const date = new Date(dateStr);
                date.setUTCHours(0, 0, 0, 0);
                return date;
            };

            const fechaEmision = data.fechaEmision ? normalizeDate(data.fechaEmision) : null;
            const fechaDesde = filters.fechaDesde ? normalizeDate(filters.fechaDesde) : null;
            const fechaHasta = filters.fechaHasta ? normalizeDate(filters.fechaHasta) : null;
            
            return (
                (data.proveedor || '').toLowerCase().includes(filters.proveedor.toLowerCase()) &&
                (data.nif || '').toLowerCase().includes(filters.nif.toLowerCase()) &&
                (data.numeroFactura || '').toLowerCase().includes(filters.numeroFactura.toLowerCase()) &&
                (!fechaDesde || (fechaEmision && fechaEmision >= fechaDesde)) &&
                (!fechaHasta || (fechaEmision && fechaEmision <= fechaHasta))
            );
        });
    }, [successfullyProcessedFiles, filters]);
    
    const downloadFile = (content: string, fileName: string, mimeType: string) => {
        const link = document.createElement('a');
        link.setAttribute('href', encodeURI(`${mimeType},${content}`));
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportEssentialToCSV = () => {
        const headers = ["Proveedor", "NIF/CIF", "Nº Factura", "Fecha Emisión", "Fecha Vencimiento", "Base Imponible", "Impuestos", "Total Factura"];
        const rows = filteredFiles.map(f => {
            const d = f.extractedData;
            const row = [
                d?.proveedor, d?.nif, d?.numeroFactura, d?.fechaEmision, d?.fechaVencimiento,
                d?.baseImponible, d?.impuestos, d?.total
            ];
            return row.map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(',');
        });
        const csvContent = [headers.join(','), ...rows].join('\n');
        downloadFile(csvContent, 'facturas_esencial.csv', 'data:text/csv;charset=utf-8');
    };

    const exportDetailedToCSV = () => {
        const headers = ["Proveedor", "NIF/CIF", "Nº Factura", "Fecha Emisión", "Fecha Vencimiento", "Base Imponible", "Impuestos", "Total Factura", "Concepto - Descripción", "Concepto - Cantidad", "Concepto - Precio Unitario", "Concepto - Total"];
        const rows: string[] = [];
        filteredFiles.forEach(f => {
            const d = f.extractedData;
            const invoiceHeader = [d?.proveedor, d?.nif, d?.numeroFactura, d?.fechaEmision, d?.fechaVencimiento, d?.baseImponible, d?.impuestos, d?.total];
            if (d?.lineas && d.lineas.length > 0) {
                d.lineas.forEach(line => {
                    const lineData = [line.description, line.quantity, line.unitPrice, line.totalPrice];
                    rows.push([...invoiceHeader, ...lineData].map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(','));
                });
            } else {
                rows.push([...invoiceHeader, '', '', '', ''].map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(','));
            }
        });
        const csvContent = [headers.join(','), ...rows].join('\n');
        downloadFile(csvContent, 'facturas_detallado.csv', 'data:text/csv;charset=utf-8');
    };

    const exportEssentialToPDF = () => {
        const doc = new jsPDF();
        const tableColumn = ["Proveedor", "Nº Factura", "Fecha Emisión", "Total"];
        const tableRows: (string | number)[][] = filteredFiles.map(file => {
            const data = file.extractedData;
            return [
                data?.proveedor || 'N/A',
                data?.numeroFactura || 'N/A',
                data?.fechaEmision || 'N/A',
                new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(data?.total || 0)
            ];
        });
        doc.text("Listado Esencial de Facturas", 14, 15);
        autoTable(doc, { head: [tableColumn], body: tableRows, startY: 20 });
        doc.save(`facturas_esencial.pdf`);
    };

    const exportDetailedToPDF = () => {
        const doc = new jsPDF({ orientation: 'landscape' });
        doc.setFontSize(18);
        doc.text("Listado Detallado de Facturas", 14, 22);

        const tableColumn = [
            "Proveedor",
            "NIF/CIF",
            "Nº Factura",
            "Fecha Emisión",
            "Fecha Vencimiento",
            "Base Imponible",
            "IVA / Impuestos",
            "Total"
        ];
        
        const tableRows: (string | number)[][] = filteredFiles.map(file => {
            const data = file.extractedData;
            if (!data) return [];
            
            const formatCurrency = (value: number | undefined | null) => 
                value ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value) : 'N/A';

            return [
                data.proveedor || 'N/A',
                data.nif || 'N/A',
                data.numeroFactura || 'N/A',
                data.fechaEmision || 'N/A',
                data.fechaVencimiento || 'N/A',
                formatCurrency(data.baseImponible),
                formatCurrency(data.impuestos),
                formatCurrency(data.total)
            ];
        }).filter(row => row.length > 0);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 30,
            theme: 'striped',
            headStyles: { fillColor: [55, 65, 81] },
            styles: { fontSize: 9, cellPadding: 2 },
            columnStyles: {
                0: { cellWidth: 'auto' }, // Proveedor
                1: { cellWidth: 35 },     // NIF
                2: { cellWidth: 40 },     // Nº Factura
                3: { cellWidth: 25 },     // Fecha Emisión
                4: { cellWidth: 28 },     // Fecha Vencimiento
                5: { cellWidth: 28, halign: 'right' }, // Base
                6: { cellWidth: 28, halign: 'right' }, // IVA
                7: { cellWidth: 28, halign: 'right' }  // Total
            }
        });

        doc.save('facturas_detallado.pdf');
    };

    const StatusIcon = ({ status }: { status: InvoiceFile['status'] }) => {
        switch (status) {
            case 'processing': return <LoaderCircleIcon />;
            case 'success': return <FileCheckIcon />;
            case 'error': return <span className="text-red-500">✖</span>;
            default: return null;
        }
    };
    
    return (
        <div className="w-full bg-white p-8 rounded-xl shadow-md border border-slate-200">
            <div className="flex flex-col items-center justify-center w-full">
                <input type="file" multiple accept="image/png, image/jpeg, application/pdf" ref={fileInputRef} onChange={(e) => handleFileChange(e.target.files)} className="hidden"/>
                <div className="flex flex-col items-center justify-center w-full h-64 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100" onClick={() => fileInputRef.current?.click()} onDragOver={onDragOver} onDrop={onDrop}>
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadCloudIcon />
                        <p className="mb-2 text-sm text-slate-500"><span className="font-semibold">Click para cargar</span> o arrastra y suelta</p>
                        <p className="text-xs text-slate-500">PNG, JPG o PDF (múltiples archivos permitidos)</p>
                    </div>
                </div>
                
                {files.length > 0 && (
                    <div className="w-full mt-8">
                        <h4 className="font-semibold text-slate-700 mb-2">Archivos Seleccionados:</h4>
                        <ul className="space-y-3">
                            {files.map(file => (
                                <li key={file.id} className="flex items-center justify-between bg-slate-100 p-3 rounded-lg">
                                    <div className="flex items-center space-x-3 min-w-0">
                                        {file.preview ? <img src={file.preview} alt={file.file.name} className="h-10 w-10 rounded-md object-cover flex-shrink-0 bg-slate-200"/> : <div className="h-10 w-10 rounded-md bg-slate-200 flex items-center justify-center flex-shrink-0"><FileBadgeIcon /></div>}
                                        <span className="text-sm font-medium text-slate-800 truncate">{file.file.name}</span>
                                        <div className="text-cyan-600"><StatusIcon status={file.status} /></div>
                                    </div>
                                    <button onClick={() => handleRemoveFile(file.id)} className="text-slate-500 hover:text-red-600 ml-4 flex-shrink-0"><Trash2Icon /></button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {globalError && <p className="mt-4 text-sm text-red-600">{globalError}</p>}
                 <button onClick={handleProcessInvoices} disabled={isProcessing || files.length === 0 || files.every(f => f.status !== 'idle')} className="mt-6 w-full sm:w-auto bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-12 rounded-lg transition duration-300 disabled:bg-slate-400 disabled:cursor-not-allowed">
                    {isProcessing ? 'Procesando...' : `Procesar ${files.filter(f=> f.status === 'idle').length} Facturas`}
                </button>
            </div>
            
            {successfullyProcessedFiles.length > 0 && (
                <div className="mt-12">
                    <h3 className="text-2xl font-bold text-slate-800 mb-6 border-b pb-3">Resultados de la Extracción</h3>
                    
                    {/* Filtros y Exportación */}
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <input type="text" name="proveedor" placeholder="Filtrar por proveedor..." value={filters.proveedor} onChange={handleFilterChange} className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"/>
                            <input type="text" name="nif" placeholder="Filtrar por NIF/CIF..." value={filters.nif} onChange={handleFilterChange} className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"/>
                            <input type="text" name="numeroFactura" placeholder="Filtrar por Nº Factura..." value={filters.numeroFactura} onChange={handleFilterChange} className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"/>
                            <div className="lg:col-span-2">
                                <label className="text-xs text-slate-500">Fecha de emisión entre:</label>
                                <div className="flex items-center space-x-2">
                                    <input type="date" name="fechaDesde" value={filters.fechaDesde} onChange={handleFilterChange} className="px-3 py-2 border border-slate-300 rounded-md text-sm w-full focus:outline-none focus:ring-1 focus:ring-cyan-500"/>
                                    <span className="text-slate-500">-</span>
                                    <input type="date" name="fechaHasta" value={filters.fechaHasta} onChange={handleFilterChange} className="px-3 py-2 border border-slate-300 rounded-md text-sm w-full focus:outline-none focus:ring-1 focus:ring-cyan-500"/>
                                </div>
                            </div>
                            <div className="flex items-end space-x-2">
                                <button onClick={clearFilters} className="w-full flex items-center justify-center bg-slate-600 hover:bg-slate-700 text-white text-sm font-semibold py-2 px-4 rounded-md transition duration-300">
                                    <FilterXIcon/> Limpiar
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center justify-end space-x-2 mt-4 pt-4 border-t border-slate-200">
                            {/* CSV Export Dropdown */}
                            <div className="relative" ref={csvMenuRef}>
                                <button onClick={() => setCsvMenuOpen(!csvMenuOpen)} disabled={filteredFiles.length === 0} className="flex items-center bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2 px-4 rounded-md transition duration-300 disabled:bg-slate-300">
                                    <FileDownIcon/> CSV <ChevronDownIcon className="ml-1 h-4 w-4"/>
                                </button>
                                {csvMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-slate-200">
                                        <button onClick={() => { exportEssentialToCSV(); setCsvMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Esencial</button>
                                        <button onClick={() => { exportDetailedToCSV(); setCsvMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Detallado</button>
                                    </div>
                                )}
                            </div>
                            {/* PDF Export Dropdown */}
                            <div className="relative" ref={pdfMenuRef}>
                                <button onClick={() => setPdfMenuOpen(!pdfMenuOpen)} disabled={filteredFiles.length === 0} className="flex items-center bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2 px-4 rounded-md transition duration-300 disabled:bg-slate-300">
                                    <FileDownIcon/> PDF <ChevronDownIcon className="ml-1 h-4 w-4"/>
                                </button>
                                {pdfMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-slate-200">
                                        <button onClick={() => { exportEssentialToPDF(); setPdfMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Esencial</button>
                                        <button onClick={() => { exportDetailedToPDF(); setPdfMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Detallado</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {filteredFiles.length > 0 ? (
                           filteredFiles.map(file => <ExtractedDataCard key={file.id} file={file} />)
                        ) : (
                           <p className="text-center text-slate-500 py-8">No se encontraron facturas que coincidan con los filtros aplicados.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default InvoiceUploader;
