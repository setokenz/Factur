
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import type { InvoiceFile, Alert } from '../types';
import { TrendingUpIcon, UserPlusIcon } from '../constants';
import AlertsTable from './AlertsTable';

const StatCard: React.FC<{ title: string; value: string | number; icon?: React.ReactNode; change?: string; changeType?: 'up' | 'down' }> = ({ title, value, icon, change, changeType }) => (
    <div className="bg-white p-6 rounded-xl shadow">
        <div className="flex justify-between items-start">
            <h4 className="text-sm font-medium text-slate-500">{title}</h4>
            {icon && <div className="text-slate-400">{icon}</div>}
        </div>
        <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
        {change && (
             <p className={`text-sm mt-1 flex items-center ${changeType === 'up' ? 'text-red-500' : 'text-green-500'}`}>
               {changeType === 'up' ? '▲' : '▼'} {change} vs mes anterior
            </p>
        )}
    </div>
);

// A pre-defined list of providers that are considered "validated" for demo purposes.
const VALIDATED_PROVIDERS = new Set(['Maersk', 'MSC', 'CMA CGM', 'COSCO', 'Hapag-Lloyd', 'Yang Ming']);
const ANOMALY_THRESHOLD = 1.75; // An invoice is an anomaly if it's 75% higher than the provider's average

const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const DashboardMockup: React.FC<{ invoices: InvoiceFile[] }> = ({ invoices }) => {
    
    const dashboardData = useMemo(() => {
        if (invoices.length === 0) {
            return {
                totalBilled: 0,
                providerData: [],
                alerts: [],
                unvalidatedProvidersCount: 0,
                providerSpending: {},
                conceptSpending: {},
                uniqueProviders: [],
                uniqueConcepts: [],
            };
        }

        const alerts: Alert[] = [];
        const providerStats: { [key: string]: { total: number; count: number; invoices: InvoiceFile[] } } = {};
        const seenInvoices = new Set<string>();
        const seenProviders = new Set<string>();

        // First pass: aggregate data and find duplicates/new providers
        invoices.forEach(invoice => {
            const data = invoice.extractedData;
            if (!data || !data.proveedor) return;

            // Aggregate stats per provider
            if (!providerStats[data.proveedor]) {
                providerStats[data.proveedor] = { total: 0, count: 0, invoices: [] };
            }
            providerStats[data.proveedor].total += data.total || 0;
            providerStats[data.proveedor].count += 1;
            providerStats[data.proveedor].invoices.push(invoice);
            
            // Detect new providers
            if (!seenProviders.has(data.proveedor) && !VALIDATED_PROVIDERS.has(data.proveedor)) {
                alerts.push({
                    id: `new-${invoice.id}`,
                    type: 'new_provider',
                    title: 'Nuevo Proveedor Detectado',
                    description: `Se ha recibido una factura de "${data.proveedor}".`,
                    date: data.fechaEmision || new Date().toISOString().split('T')[0],
                    invoiceId: invoice.id,
                });
            }
            seenProviders.add(data.proveedor);

            // Detect duplicates
            const uniqueInvoiceKey = `${data.proveedor}-${data.numeroFactura}-${data.total}`;
            if (seenInvoices.has(uniqueInvoiceKey)) {
                alerts.push({
                    id: `dup-${invoice.id}`,
                    type: 'fraud',
                    title: 'Posible Factura Duplicada',
                    description: `Factura #${data.numeroFactura} de ${data.proveedor} parece duplicada.`,
                    date: data.fechaEmision || new Date().toISOString().split('T')[0],
                    invoiceId: invoice.id,
                });
            } else {
                seenInvoices.add(uniqueInvoiceKey);
            }
        });

        // Second pass: detect anomalies
        Object.values(providerStats).forEach(stats => {
            const avg = stats.total / stats.count;
            stats.invoices.forEach(invoice => {
                const data = invoice.extractedData;
                if(data && data.total && data.total > avg * ANOMALY_THRESHOLD) {
                     alerts.push({
                        id: `anom-${invoice.id}`,
                        type: 'anomaly',
                        title: 'Anomalía en Coste',
                        description: `Factura de ${data.proveedor} (${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(data.total)}) es un ${((data.total/avg - 1)*100).toFixed(0)}% superior a la media.`,
                        date: data.fechaEmision || new Date().toISOString().split('T')[0],
                        invoiceId: invoice.id,
                    });
                }
            });
        });
        
        // Third pass: detect patterns (missing invoices, cost trends)
        const providerMonths: { [provider: string]: Set<number> } = {};
        const providerInvoices: { [provider: string]: InvoiceFile[] } = {};

        invoices.forEach(invoice => {
            const data = invoice.extractedData;
            if (!data || !data.proveedor || !data.fechaEmision) return;
            
            if (!providerInvoices[data.proveedor]) {
                providerInvoices[data.proveedor] = [];
            }
            providerInvoices[data.proveedor].push(invoice);

            const month = new Date(data.fechaEmision).getUTCMonth(); // 0-11
            if (!providerMonths[data.proveedor]) {
                providerMonths[data.proveedor] = new Set();
            }
            providerMonths[data.proveedor].add(month);
        });

        // Detect missing recurring invoices
        const currentMonth = new Date().getUTCMonth();
        Object.entries(providerMonths).forEach(([provider, months]) => {
            if (months.size >= 3) { // Assume recurring if we have invoices for 3+ different months
                const sortedMonths = Array.from(months).sort((a, b) => a - b);
                const minMonth = sortedMonths[0];
                const maxMonth = sortedMonths[sortedMonths.length - 1];

                for (let m = minMonth; m <= maxMonth; m++) {
                    if (!months.has(m) && m < currentMonth) { // Only alert for past missing months
                        alerts.push({
                            id: `miss-${provider}-${m}`,
                            type: 'missing_invoice',
                            title: 'Posible Factura Faltante',
                            description: `No se ha recibido factura de ${provider} para ${monthNames[m]}.`,
                            date: new Date().toISOString().split('T')[0],
                        });
                    }
                }
            }
        });

        // Detect cost trends
        Object.values(providerInvoices).forEach(provInvoices => {
            if (provInvoices.length < 3) return;
            const conceptHistory: { [concept: string]: { date: string, total: number, invoiceId: string }[] } = {};

            provInvoices.forEach(invoice => {
                invoice.extractedData?.lineas?.forEach(line => {
                    if (!line.description) return;
                    if (!conceptHistory[line.description]) {
                        conceptHistory[line.description] = [];
                    }
                    conceptHistory[line.description].push({
                        date: invoice.extractedData!.fechaEmision,
                        total: line.totalPrice,
                        invoiceId: invoice.id
                    });
                });
            });

            Object.entries(conceptHistory).forEach(([concept, history]) => {
                if (history.length >= 3) {
                    history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                    
                    let increasingCount = 0;
                    for (let i = 1; i < history.length; i++) {
                        if (history[i].total > history[i - 1].total) {
                            increasingCount++;
                        }
                    }
                    
                    if (increasingCount === history.length - 1) { // If all are increasing sequentially
                        const first = history[0];
                        const last = history[history.length - 1];
                        const percentageIncrease = ((last.total - first.total) / first.total) * 100;

                        if (percentageIncrease > 15) { // Trend alert if total increase is > 15%
                            alerts.push({
                                id: `trend-${provInvoices[0].extractedData!.proveedor}-${concept}`,
                                type: 'cost_trend',
                                title: 'Tendencia de Costes Alcista',
                                description: `El coste de "${concept}" de ${provInvoices[0].extractedData!.proveedor} ha subido un ${percentageIncrease.toFixed(0)}%.`,
                                date: last.date,
                                invoiceId: last.invoiceId
                            });
                        }
                    }
                }
            });
        });
        
        const unvalidatedProvidersCount = Array.from(seenProviders).filter(p => !VALIDATED_PROVIDERS.has(p)).length;
        
        const totalBilled = Object.values(providerStats).reduce((acc, curr) => acc + curr.total, 0);
        
        const providerData = Object.entries(providerStats).map(([name, { total }]) => ({ name, value: total })).sort((a, b) => b.value - a.value);

        // Prepare data for line charts
        const providerSpending: { [key: string]: { name: string; gasto: number }[] } = {};
        const conceptSpending: { [key: string]: { name: string; gasto: number }[] } = {};
        const uniqueConcepts = new Set<string>();
        
        invoices.forEach(invoice => {
            const data = invoice.extractedData;
            if (!data || !data.proveedor || !data.fechaEmision) return;
            
            const month = new Date(data.fechaEmision).getMonth();
            const year = new Date(data.fechaEmision).getFullYear();
            const monthKey = `${monthNames[month]} '${String(year).slice(-2)}`;
            
            // Provider spending over time
            if (!providerSpending[data.proveedor]) providerSpending[data.proveedor] = [];
            let providerMonthEntry = providerSpending[data.proveedor].find(e => e.name === monthKey);
            if(providerMonthEntry){
                providerMonthEntry.gasto += data.total || 0;
            } else {
                providerSpending[data.proveedor].push({ name: monthKey, gasto: data.total || 0 });
            }

            // Concept spending over time
            data.lineas?.forEach(line => {
                if(!line.description) return;
                uniqueConcepts.add(line.description);
                if (!conceptSpending[line.description]) conceptSpending[line.description] = [];
                let conceptMonthEntry = conceptSpending[line.description].find(e => e.name === monthKey);
                if(conceptMonthEntry){
                     conceptMonthEntry.gasto += line.totalPrice || 0;
                } else {
                     conceptSpending[line.description].push({ name: monthKey, gasto: line.totalPrice || 0 });
                }
            });
        });
        
        // Sort chart data by date
        Object.values(providerSpending).forEach(arr => arr.sort((a,b) => monthNames.indexOf(a.name.split(' ')[0]) - monthNames.indexOf(b.name.split(' ')[0])));
        Object.values(conceptSpending).forEach(arr => arr.sort((a,b) => monthNames.indexOf(a.name.split(' ')[0]) - monthNames.indexOf(b.name.split(' ')[0])));


        return {
            totalBilled,
            providerData,
            alerts: alerts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
            unvalidatedProvidersCount,
            providerSpending,
            conceptSpending,
            uniqueProviders: Object.keys(providerStats),
            uniqueConcepts: Array.from(uniqueConcepts),
        };
    }, [invoices]);

    const [selectedProvider, setSelectedProvider] = useState(dashboardData.uniqueProviders[0] || '');
    const [selectedConcept, setSelectedConcept] = useState(dashboardData.uniqueConcepts[0] || '');
    
     React.useEffect(() => {
        if (!selectedProvider && dashboardData.uniqueProviders.length > 0) {
            setSelectedProvider(dashboardData.uniqueProviders[0]);
        }
        if (!selectedConcept && dashboardData.uniqueConcepts.length > 0) {
            setSelectedConcept(dashboardData.uniqueConcepts[0]);
        }
    }, [dashboardData.uniqueProviders, dashboardData.uniqueConcepts, selectedProvider, selectedConcept]);


    if (invoices.length === 0) {
        return (
            <div className="bg-slate-100 p-8 rounded-2xl shadow-inner text-center">
                <h3 className="text-lg font-semibold text-slate-700">El dashboard está listo para el análisis.</h3>
                <p className="text-slate-500 mt-2">Cargue algunas facturas para empezar a visualizar los datos.</p>
            </div>
        );
    }
    
    return (
        <div className="bg-slate-100 p-4 sm:p-6 lg:p-8 rounded-2xl shadow-inner">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="Total Facturado" value={new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(dashboardData.totalBilled)} icon={<TrendingUpIcon className="h-6 w-6"/>} />
                <StatCard title="Facturas Procesadas" value={invoices.length} />
                <StatCard title="Proveedores no Validados" value={dashboardData.unvalidatedProvidersCount} icon={<UserPlusIcon className="h-6 w-6"/>} />
                <StatCard title="Alertas Activas" value={dashboardData.alerts.length} changeType="up" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                 <div className="bg-white p-6 rounded-xl shadow h-[400px]">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg text-slate-800">Análisis de Proveedor</h3>
                        <select value={selectedProvider} onChange={e => setSelectedProvider(e.target.value)} className="text-sm border-slate-200 rounded-md" disabled={dashboardData.uniqueProviders.length === 0}>
                            {dashboardData.uniqueProviders.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <ResponsiveContainer width="100%" height="85%">
                        <LineChart data={dashboardData.providerSpending[selectedProvider]} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis tickFormatter={(value) => `€${value / 1000}k`} />
                            <Tooltip formatter={(value) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(Number(value))}/>
                            <Legend />
                            <Line type="monotone" dataKey="gasto" stroke="#06b6d4" strokeWidth={2} activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-white p-6 rounded-xl shadow h-[400px]">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg text-slate-800">Variación de Precios por Concepto</h3>
                         <select value={selectedConcept} onChange={e => setSelectedConcept(e.target.value)} className="text-sm border-slate-200 rounded-md" disabled={dashboardData.uniqueConcepts.length === 0}>
                           {dashboardData.uniqueConcepts.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <ResponsiveContainer width="100%" height="85%">
                        <LineChart data={dashboardData.conceptSpending[selectedConcept]} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis tickFormatter={(value) => `€${value}`}/>
                            <Tooltip formatter={(value) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(Number(value))}/>
                            <Legend />
                            <Line type="monotone" dataKey="gasto" name="Gasto Total" stroke="#0e7490" strokeWidth={2} activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow">
                    <h3 className="font-bold text-lg text-slate-800 mb-4">Control y Alertas de Seguridad</h3>
                    <AlertsTable alerts={dashboardData.alerts} />
                </div>
                 <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow h-[400px]">
                    <h3 className="font-bold text-lg text-slate-800 mb-4">Gasto por Proveedor (Total)</h3>
                    <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={dashboardData.providerData} layout="vertical" margin={{ top: 0, right: 30, left: 50, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" tickFormatter={(value) => `€${Number(value) / 1000}k`} />
                            <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} interval={0} />
                            <Tooltip formatter={(value) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(Number(value))}/>
                            <Legend />
                            <Bar dataKey="value" name="Gasto Total" fill="#0891b2" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default DashboardMockup;