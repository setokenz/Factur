import React from 'react';
import type { Alert } from '../types';
import { ShieldAlertIcon, UserPlusIcon, TrendingUpIcon, FileSearchIcon, SignalIcon } from '../constants';

const AlertIcon: React.FC<{ type: Alert['type'] }> = ({ type }) => {
    switch (type) {
        case 'fraud':
            return <ShieldAlertIcon className="h-5 w-5 text-red-500" />;
        case 'anomaly':
            return <TrendingUpIcon className="h-5 w-5 text-amber-500" />;
        case 'new_provider':
            return <UserPlusIcon className="h-5 w-5 text-blue-500" />;
        case 'missing_invoice':
            return <FileSearchIcon className="h-5 w-5 text-purple-500" />;
        case 'cost_trend':
            return <SignalIcon className="h-5 w-5 text-orange-500" />;
        default:
            return null;
    }
};

const AlertsTable: React.FC<{ alerts: Alert[] }> = ({ alerts }) => {
    if (alerts.length === 0) {
        return <p className="text-center text-slate-500 py-4">No hay alertas activas.</p>
    }

    return (
        <div className="flow-root">
            <ul role="list" className="-mb-8">
                {alerts.map((alert, alertIdx) => (
                    <li key={alert.id}>
                        <div className="relative pb-8">
                            {alertIdx !== alerts.length - 1 ? (
                                <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-slate-200" aria-hidden="true" />
                            ) : null}
                            <div className="relative flex space-x-3">
                                <div>
                                    <span className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center ring-8 ring-white">
                                        <AlertIcon type={alert.type} />
                                    </span>
                                </div>
                                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-700">{alert.title}</p>
                                        <p className="text-sm text-slate-500">{alert.description}</p>
                                    </div>
                                    <div className="whitespace-nowrap text-right text-sm text-slate-500">
                                        <time dateTime={alert.date}>{alert.date}</time>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default AlertsTable;