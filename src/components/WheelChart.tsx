import React from "react";
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { fmtTime } from "../utils/format";

export default function WheelChart({ data, wheel }: { data: { ts: number; speed: number }[]; wheel: 1 | 2 | 3 | 4 }) {
  return (
    <div className="card">
      <div className="card-title">
        Wheel {wheel} <span className="badge">{data.at(-1)?.speed?.toFixed(1) ?? "0.0"} km/h</span>
      </div>
      <div className="chart">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: 0, right: 0, top: 5, bottom: 0 }}>
            <defs>
              <linearGradient id={`wheel${wheel}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopOpacity={0.35} />
                <stop offset="95%" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="ts" tickFormatter={fmtTime} hide />
            <YAxis domain={[0, 100]} hide />
            <Tooltip
              labelFormatter={(l) => fmtTime(Number(l))}
              formatter={(v: any) => [`${v.toFixed?.(1) ?? v} km/h`, "speed"]}
            />
            <Area type="monotone" dataKey="speed" fill={`url(#wheel${wheel})`} strokeOpacity={0.9} strokeWidth={1.6} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
