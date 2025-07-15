
import React, { useState, useMemo } from 'react';
import Header from './components/Header';
import Section from './components/Section';
import FeatureCard from './components/FeatureCard';
import DashboardMockup from './components/DashboardMockup';
import InvoiceUploader from './components/InvoiceUploader';
import WorkflowDiagram from './components/WorkflowDiagram';
import Chatbot from './components/Chatbot';
import { BrainCircuitIcon, DatabaseZapIcon, FileCheckIcon, FileTextIcon, GanttChartSquareIcon, ShieldCheckIcon, UserCheckIcon, WalletCardsIcon } from './constants';
import type { InvoiceFile } from './types';
import { mockInvoices } from './data/mockData';

const App: React.FC = () => {
    const [userInvoices, setUserInvoices] = useState<InvoiceFile[]>([]);
    
    // Combine mock data with user-processed data for a rich initial experience
    const combinedInvoices = useMemo(() => [...mockInvoices, ...userInvoices], [userInvoices]);

    return (
        <div className="min-h-screen bg-slate-50">
            <Header />

            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-7xl">
                {/* Section 1: Intelligent Invoice Processing */}
                <Section title="Procesamiento Inteligente de Facturas Recibidas">
                    <p className="mt-4 text-lg text-slate-600">
                        Una solución integral para automatizar la recepción, extracción de datos y registro de facturas de proveedores, eliminando errores manuales y creando un repositorio de datos centralizado y auditable.
                    </p>
                    <div className="mt-8">
                         <h3 className="text-2xl font-bold text-slate-800 mb-4">Flujo de Trabajo Automatizado</h3>
                        <WorkflowDiagram />
                    </div>
                    <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        <FeatureCard
                            icon={<FileTextIcon />}
                            title="Extracción Exhaustiva de Datos"
                            description="Utilizando OCR avanzado y NLP, extraemos todos los campos clave de facturas en PDF o imagen, desde datos de cabecera hasta el último detalle de línea."
                        />
                        <FeatureCard
                            icon={<DatabaseZapIcon />}
                            title="Base de Datos Segura y Escalable"
                            description="Los datos se estructuran y almacenan en una base de datos optimizada para consultas rápidas, análisis y trazabilidad completa del ciclo de vida de la factura."
                        />
                         <FeatureCard
                            icon={<FileCheckIcon />}
                            title="Validación 'Human-in-the-Loop'"
                            description="Un sistema de validación asistida permite a los usuarios revisar y corregir datos con baja confianza, entrenando al modelo para mejorar su precisión continuamente."
                        />
                    </div>
                    <div className="mt-12">
                        <h3 className="text-2xl font-bold text-slate-800 mb-4">Carga y Procesamiento de Facturas</h3>
                        <InvoiceUploader onDataProcessed={setUserInvoices} />
                    </div>
                </Section>
                
                {/* Section 2: Interactive Dashboard */}
                <Section title="Dashboard Interactivo para Análisis Financiero">
                     <p className="mt-4 text-lg text-slate-600">
                        Visualice sus datos financieros como nunca antes. Identifique patrones, detecte anomalías y tome decisiones estratégicas basadas en información en tiempo real.
                    </p>
                    <div className="mt-8">
                        <DashboardMockup invoices={combinedInvoices} />
                    </div>
                     <div className="mt-12 grid gap-8 md:grid-cols-2">
                        <FeatureCard
                            icon={<WalletCardsIcon />}
                            title="Análisis de Patrones de Gasto"
                            description="Explore tendencias de gasto por proveedor, categoría o período. Entienda a dónde va su dinero y optimice presupuestos."
                        />
                        <FeatureCard
                            icon={<GanttChartSquareIcon />}
                            title="Detección de Anomalías y Duplicados"
                            description="Nuestro algoritmo identifica automáticamente facturas duplicadas, importes atípicos y desviaciones para prevenir pagos erróneos y fraudes."
                        />
                    </div>
                </Section>

                {/* Section 3: AI Assistant */}
                <Section title="Asistente de Análisis IA">
                    <p className="mt-4 text-lg text-slate-600">
                        Converse con nuestra IA para analizar los datos de sus facturas. Pregunte por gastos, proveedores o fechas y descubra información valiosa de forma instantánea.
                    </p>
                    <div className="mt-8">
                        <Chatbot invoices={combinedInvoices} />
                    </div>
                </Section>

                {/* Section 4: Crucial Considerations */}
                <Section title="Consideraciones Cruciales">
                    <p className="mt-4 text-lg text-slate-600">
                       Nuestra plataforma se construye sobre tres pilares fundamentales: tecnología de punta, seguridad robusta y una colaboración transparente entre la IA y el equipo humano.
                    </p>
                    <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        <FeatureCard
                            icon={<BrainCircuitIcon />}
                            title="Tecnologías de IA"
                            description="Combinamos OCR con Machine Learning, NLP para la interpretación de conceptos y algoritmos de clustering para la detección de anomalías."
                        />
                        <FeatureCard
                            icon={<ShieldCheckIcon />}
                            title="Seguridad y Privacidad (GDPR)"
                            description="Garantizamos la encriptación de datos en tránsito y en reposo, controles de acceso basados en roles y cumplimiento estricto con la normativa GDPR."
                        />
                        <FeatureCard
                            icon={<UserCheckIcon />}
                            title="Explicabilidad (XAI) y Auditoría"
                            description="Ofrecemos trazabilidad completa. Cada dato extraído y cada anomalía detectada se vincula a su origen en el documento, asegurando una total comprensibilidad y auditabilidad."
                        />
                    </div>
                </section>

            </main>
            <footer className="text-center py-8 bg-slate-800 text-slate-400">
                <p>&copy; {new Date().getFullYear()} Propuesta de Servicio. Todos los derechos reservados.</p>
            </footer>
        </div>
    );
};

export default App;
