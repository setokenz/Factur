
import React from 'react';

interface SectionProps {
    title: string;
    children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, children }) => {
    const id = title.toLowerCase().replace(/\s+/g, '-');
    return (
        <section id={id} className="py-16 sm:py-20 border-t border-slate-200">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">{title}</h2>
            {children}
        </section>
    );
};

export default Section;
