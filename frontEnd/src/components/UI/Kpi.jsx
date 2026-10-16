// src/components/UI/Kpi.jsx
import React from 'react';
import { LuArrowUpRight, LuArrowDownRight } from 'react-icons/lu';
import Sparkline from '../Chart/Sparkline';
import { trend } from '../../lib/format';

export default function Kpi({ label, icon: Icon, value, delta, deltaLabel, foot, spark, badge, className = '' }) {
  const t = trend(delta?.raw);
  return (
    <div className={`card kpi ${className}`}>
      <div className="kpi-top">
        <span className="kpi-label">{Icon && <Icon aria-hidden="true" />}{label}</span>
        {badge}
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-foot">
        <span>
          {delta && (
            <span className={`delta ${t}`}>
              {t === 'up' && <LuArrowUpRight aria-hidden="true" />}
              {t === 'down' && <LuArrowDownRight aria-hidden="true" />}
              {delta.text}
            </span>
          )}
          {deltaLabel && <span> {deltaLabel}</span>}
          {foot}
        </span>
        {spark && <Sparkline values={spark} tone={t === 'down' ? 'down' : 'accent'} />}
      </div>
    </div>
  );
}
