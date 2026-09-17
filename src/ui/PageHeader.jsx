import React from 'react';

export default function PageHeader({ eyebrow, title, description, children }) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
      <div>
        {eyebrow && (
          <p className="text-[11px] uppercase tracking-[0.25em] text-lime-300/80 mb-3">{eyebrow}</p>
        )}
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white">{title}</h1>
        {description && <p className="text-neutral-400 mt-2 max-w-xl text-sm leading-relaxed">{description}</p>}
      </div>
      <div className="flex items-center gap-3 flex-wrap">{children}</div>
    </div>
  );
}