
export interface ChartData {
    name: string;
    value: number;
}

export interface LineChartData {
    name: string;
    gasto: number;
}

export interface Message {
    role: 'user' | 'model';
    text: string;
}

export type ProcessingStatus = 'idle' | 'processing' | 'success' | 'error';

export interface InvoiceLineItem {
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

export interface ExtractedInvoiceData {
    proveedor: string;
    nif: string;
    numeroFactura: string;
    fechaEmision: string;
    fechaVencimiento: string;
    total: number;
    baseImponible: number;
    impuestos: number;
    lineas?: InvoiceLineItem[];
}

export interface InvoiceFile {
    id: string;
    file: File;
    preview: string;
    status: ProcessingStatus;
    extractedData: ExtractedInvoiceData | null;
    error: string | null;
}

export interface Provider {
    id: string;
    name: string;
    status: 'validated' | 'unvalidated';
}

export interface Alert {
    id: string;
    type: 'fraud' | 'anomaly' | 'new_provider' | 'missing_invoice' | 'cost_trend';
    title: string;
    description: string;
    date: string;
    invoiceId?: string;
}