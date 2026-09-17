import React from 'react';
import { motion } from 'framer-motion';

export default function MetricCard({ label, value, sub, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 hover:bg-white/[0.06] transition-colors"
    >
      <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">{label}</p>
      <p className="text-3xl font-semibold text-white mt-3 tabular-nums">{value}</p>
      {sub && <p className="text-xs text-neutral-500 mt-1">{sub}</p>}
    </motion.div>
  );
}