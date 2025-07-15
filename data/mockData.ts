
import type { InvoiceFile } from '../types';

// Helper to create a mock file object
const createMockFile = (name: string = 'mock.pdf') => new File(["mock content"], name, { type: 'application/pdf' });

export const mockInvoices: InvoiceFile[] = [
  // --- MAERSK --- (Validated Provider)
  {
    id: 'mock-maersk-1',
    file: createMockFile('maersk_inv_1.pdf'),
    preview: '',
    status: 'success',
    error: null,
    extractedData: {
      proveedor: 'Maersk',
      nif: 'A12345678',
      numeroFactura: 'INV-2024-001',
      fechaEmision: '2024-01-15',
      fechaVencimiento: '2024-02-14',
      total: 7500.50,
      baseImponible: 6198.76,
      impuestos: 1301.74,
      lineas: [
        { description: 'Transporte Contenedor 40ft', quantity: 1, unitPrice: 6000, totalPrice: 6000 },
        { description: 'Tasas Portuarias', quantity: 1, unitPrice: 198.76, totalPrice: 198.76 },
      ],
    },
  },
  // --- DUPLICATE of Maersk 1 --- (Triggers Fraud Alert)
  {
    id: 'mock-maersk-1-dup',
    file: createMockFile('maersk_inv_1_dup.pdf'),
    preview: '',
    status: 'success',
    error: null,
    extractedData: {
      proveedor: 'Maersk',
      nif: 'A12345678',
      numeroFactura: 'INV-2024-001', // Same number
      fechaEmision: '2024-01-16', // Slightly different date
      fechaVencimiento: '2024-02-15',
      total: 7500.50, // Same total
      baseImponible: 6198.76,
      impuestos: 1301.74,
      lineas: [
        { description: 'Transporte Contenedor 40ft', quantity: 1, unitPrice: 6000, totalPrice: 6000 },
        { description: 'Tasas Portuarias', quantity: 1, unitPrice: 198.76, totalPrice: 198.76 },
      ],
    },
  },
  {
    id: 'mock-maersk-2',
    file: createMockFile('maersk_inv_2.pdf'),
    preview: '',
    status: 'success',
    error: null,
    extractedData: {
      proveedor: 'Maersk',
      nif: 'A12345678',
      numeroFactura: 'INV-2024-002',
      fechaEmision: '2024-03-10',
      fechaVencimiento: '2024-04-09',
      total: 8200.00,
      baseImponible: 6776.86,
      impuestos: 1423.14,
      lineas: [
        { description: 'Transporte Contenedor 40ft', quantity: 1, unitPrice: 6500, totalPrice: 6500 },
        { description: 'Seguro de Carga', quantity: 1, unitPrice: 200, totalPrice: 200 },
        { description: 'Tasas Portuarias', quantity: 1, unitPrice: 76.86, totalPrice: 76.86 },
      ],
    },
  },
  // --- MSC --- (Validated Provider)
  {
    id: 'mock-msc-1',
    file: createMockFile('msc_inv_1.pdf'),
    preview: '',
    status: 'success',
    error: null,
    extractedData: {
      proveedor: 'MSC',
      nif: 'B87654321',
      numeroFactura: 'MSC-01-2024',
      fechaEmision: '2024-01-20',
      fechaVencimiento: '2024-02-19',
      total: 6800.00,
      baseImponible: 5619.83,
      impuestos: 1180.17,
      lineas: [
        { description: 'Flete Marítimo', quantity: 1, unitPrice: 5500, totalPrice: 5500 },
        { description: 'Gestión Documental', quantity: 1, unitPrice: 119.83, totalPrice: 119.83 },
      ],
    },
  },
  // --- ANOMALY for MSC --- (Triggers Anomaly Alert)
  {
    id: 'mock-msc-2',
    file: createMockFile('msc_inv_2.pdf'),
    preview: '',
    status: 'success',
    error: null,
    extractedData: {
      proveedor: 'MSC',
      nif: 'B87654321',
      numeroFactura: 'MSC-02-2024',
      fechaEmision: '2024-04-05',
      fechaVencimiento: '2024-05-04',
      total: 15000.00, // Much higher than the other one (6800)
      baseImponible: 12396.69,
      impuestos: 2603.31,
      lineas: [
        { description: 'Flete Marítimo Express', quantity: 2, unitPrice: 6000, totalPrice: 12000 },
        { description: 'Recargo por Congestión', quantity: 1, unitPrice: 396.69, totalPrice: 396.69 },
      ],
    },
  },
  // --- SEAWAY LOGISTICS --- (Unvalidated Provider)
  {
    id: 'mock-seaway-1',
    file: createMockFile('seaway_inv_1.pdf'),
    preview: '',
    status: 'success',
    error: null,
    extractedData: {
      proveedor: 'Seaway Logistics',
      nif: 'C99887766',
      numeroFactura: 'SL-04-588',
      fechaEmision: '2024-04-22',
      fechaVencimiento: '2024-05-21',
      total: 1250.75,
      baseImponible: 1033.68,
      impuestos: 217.07,
      lineas: [
        { description: 'Transporte Terrestre Puerto', quantity: 1, unitPrice: 800, totalPrice: 800 },
        { description: 'Almacenaje (3 días)', quantity: 3, unitPrice: 77.89, totalPrice: 233.68 },
      ],
    },
  },
  // --- CMA CGM --- (Validated Provider, different concept)
  {
    id: 'mock-cma-1',
    file: createMockFile('cma_inv_1.pdf'),
    preview: '',
    status: 'success',
    error: null,
    extractedData: {
      proveedor: 'CMA CGM',
      nif: 'D11223344',
      numeroFactura: 'CMA-2024-45',
      fechaEmision: '2024-02-28',
      fechaVencimiento: '2024-03-29',
      total: 980.00,
      baseImponible: 809.92,
      impuestos: 170.08,
      lineas: [
        { description: 'Tasas Portuarias', quantity: 1, unitPrice: 500, totalPrice: 500 },
        { description: 'Gestión Documental', quantity: 1, unitPrice: 309.92, totalPrice: 309.92 },
      ],
    },
  },
  // --- HAPAG-LLOYD --- (Validated, for missing invoice detection)
    {
        id: 'mock-hapag-1',
        file: createMockFile('hapag_inv_jan.pdf'),
        preview: '',
        status: 'success', error: null,
        extractedData: {
        proveedor: 'Hapag-Lloyd', nif: 'E55667788', numeroFactura: 'HL-JAN-24',
        fechaEmision: '2024-01-25', fechaVencimiento: '2024-02-24',
        total: 4500.00, baseImponible: 3719.01, impuestos: 780.99,
        lineas: [{ description: 'Servicios Logísticos Integrales', quantity: 1, unitPrice: 3719.01, totalPrice: 3719.01 }],
        },
    },
    {
        id: 'mock-hapag-2',
        file: createMockFile('hapag_inv_feb.pdf'),
        preview: '',
        status: 'success', error: null,
        extractedData: {
        proveedor: 'Hapag-Lloyd', nif: 'E55667788', numeroFactura: 'HL-FEB-24',
        fechaEmision: '2024-02-25', fechaVencimiento: '2024-03-26',
        total: 4550.00, baseImponible: 3760.33, impuestos: 789.67,
        lineas: [{ description: 'Servicios Logísticos Integrales', quantity: 1, unitPrice: 3760.33, totalPrice: 3760.33 }],
        },
    },
    // MARCH IS MISSING INTENTIONALLY
    {
        id: 'mock-hapag-4',
        file: createMockFile('hapag_inv_apr.pdf'),
        preview: '',
        status: 'success', error: null,
        extractedData: {
        proveedor: 'Hapag-Lloyd', nif: 'E55667788', numeroFactura: 'HL-APR-24',
        fechaEmision: '2024-04-25', fechaVencimiento: '2024-05-24',
        total: 4600.00, baseImponible: 3801.65, impuestos: 798.35,
        lineas: [{ description: 'Servicios Logísticos Integrales', quantity: 1, unitPrice: 3801.65, totalPrice: 3801.65 }],
        },
    },
    // --- COSCO --- (Validated, for cost trend detection)
    {
        id: 'mock-cosco-1',
        file: createMockFile('cosco_inv_1.pdf'),
        preview: '',
        status: 'success', error: null,
        extractedData: {
        proveedor: 'COSCO', nif: 'F99887766', numeroFactura: 'COS-JAN-01',
        fechaEmision: '2024-01-18', fechaVencimiento: '2024-02-17',
        total: 2100.00, baseImponible: 1735.54, impuestos: 364.46,
        lineas: [{ description: 'Almacenamiento en Frío', quantity: 10, unitPrice: 173.55, totalPrice: 1735.54 }],
        },
    },
    {
        id: 'mock-cosco-2',
        file: createMockFile('cosco_inv_2.pdf'),
        preview: '',
        status: 'success', error: null,
        extractedData: {
        proveedor: 'COSCO', nif: 'F99887766', numeroFactura: 'COS-FEB-01',
        fechaEmision: '2024-02-18', fechaVencimiento: '2024-03-19',
        total: 2310.00, // 10% increase
        baseImponible: 1909.09, impuestos: 400.91,
        lineas: [{ description: 'Almacenamiento en Frío', quantity: 10, unitPrice: 190.91, totalPrice: 1909.09 }],
        },
    },
    {
        id: 'mock-cosco-3',
        file: createMockFile('cosco_inv_3.pdf'),
        preview: '',
        status: 'success', error: null,
        extractedData: {
        proveedor: 'COSCO', nif: 'F99887766', numeroFactura: 'COS-MAR-01',
        fechaEmision: '2024-03-18', fechaVencimiento: '2024-04-17',
        total: 2541.00, // another 10% increase
        baseImponible: 2100.00, impuestos: 441.00,
        lineas: [{ description: 'Almacenamiento en Frío', quantity: 10, unitPrice: 210.00, totalPrice: 2100.00 }],
        },
    },
    {
        id: 'mock-cosco-4',
        file: createMockFile('cosco_inv_4.pdf'),
        preview: '',
        status: 'success', error: null,
        extractedData: {
        proveedor: 'COSCO', nif: 'F99887766', numeroFactura: 'COS-APR-01',
        fechaEmision: '2024-04-18', fechaVencimiento: '2024-05-17',
        total: 2795.10, // another 10% increase
        baseImponible: 2310.00, impuestos: 485.10,
        lineas: [{ description: 'Almacenamiento en Frío', quantity: 10, unitPrice: 231.00, totalPrice: 2310.00 }],
        },
    },
];
