// src/components/UI/ActionPill.jsx : agent decision (acheter / vendre / conserver)
import React from 'react';
import { LuArrowUpRight, LuArrowDownRight, LuMinus } from 'react-icons/lu';

const MAP = {
  buy: { label: 'Acheter', cls: 'pill-buy', Icon: LuArrowUpRight },
  sell: { label: 'Vendre', cls: 'pill-sell', Icon: LuArrowDownRight },
  hold: { label: 'Conserver', cls: 'pill-hold', Icon: LuMinus },
};

export default function ActionPill({ action }) {
  const a = MAP[String(action).toLowerCase()] || MAP.hold;
  const { Icon } = a;
  return (
    <span className={`pill-action ${a.cls}`}>
      <Icon aria-hidden="true" />
      {a.label}
    </span>
  );
}
