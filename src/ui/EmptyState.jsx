import React from 'react';

export default function EmptyState({ icon: Icon, title, description, children }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-20 px-8 text-center">
      {Icon && <Icon className="w-8 h-8 text-neutral-600 mx-auto mb-5" />}
      <p className="text-white text-lg font-medium">{title}</p>
      {description && <p className="text-neutral-500 text-sm mt-2 max-w-sm mx-auto">{description}</p>}
      <div className="mt-6 flex justify-center">{children}</div>
    </div>
  );
}