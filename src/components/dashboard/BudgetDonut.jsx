import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatCompact, formatMoney } from "@/lib/format";
import EmptyState from "@/components/EmptyState";
import { Wallet } from "lucide-react";

/** Donut of spend by category (falls back to the planned split before any spend). */
export default function BudgetDonut({ categories = [], spendByCategory = {}, spendTotal = 0, currency = "INR" }) {
  const planned = spendTotal <= 0;
  const data = categories
    .map((c) => ({
      name: c.label,
      value: planned ? Number(c.allocated) || 0 : Number(spendByCategory[c.category]) || 0,
      color: c.color,
    }))
    .filter((d) => d.value > 0);

  const centreValue = planned
    ? categories.reduce((sum, c) => sum + (Number(c.allocated) || 0), 0)
    : spendTotal;

  if (!data.length) {
    return (
      <EmptyState
        icon={Wallet}
        title="No budget split yet"
        description="Your categories appear here as soon as the blueprint is built."
      />
    );
  }

  return (
    <div className="rounded-3xl bg-card p-4 shadow-soft ring-hairline sm:p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-lg text-foreground">{planned ? "Planned split" : "Spend so far"}</h2>
        <span className="text-xs text-muted-foreground">{planned ? "no expenses logged yet" : `${data.length} categories`}</span>
      </div>

      <div className="relative mx-auto h-52 w-full max-w-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="62%"
              outerRadius="92%"
              paddingAngle={2}
              stroke="none"
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatMoney(value, currency)}
              contentStyle={{
                borderRadius: 16,
                border: "1px solid hsl(var(--border))",
                fontSize: 12,
                background: "hsl(var(--card))",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {planned ? "Budget" : "Spent"}
            </p>
            <p className="font-display text-xl text-foreground">{formatCompact(centreValue, currency)}</p>
          </div>
        </div>
      </div>

      <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
        {data.slice(0, 6).map((entry) => (
          <li key={entry.name} className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: entry.color }} aria-hidden="true" />
            <span className="truncate">{entry.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}