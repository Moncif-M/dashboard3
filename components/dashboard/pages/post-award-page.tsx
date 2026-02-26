"use client"

import {
  Gavel,
  Scale,
} from "lucide-react"
import type { FilterState } from "../filter-panel"
import { vendors } from "@/lib/vendor-data"
import { KPICard } from "../kpi-card"
import { GaugeChart } from "../gauge-chart"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

interface PostAwardPageProps {
  filters: FilterState
}

type Status = "Open" | "In Progress" | "Closed"
type Criticality = "High" | "Medium" | "Low"

function Pill({ label, tone }: { label: string; tone: "red" | "yellow" | "green" }) {
  const styles =
    tone === "green"
      ? "bg-emerald-100 text-emerald-700"
      : tone === "yellow"
        ? "bg-amber-100 text-amber-700"
        : "bg-red-100 text-red-700"
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${styles}`}>{label}</span>
}

function statusTone(status: Status): "red" | "yellow" | "green" {
  if (status === "Closed") return "green"
  if (status === "In Progress") return "yellow"
  return "red"
}

function critTone(c: Criticality): "red" | "yellow" | "green" {
  if (c === "Low") return "green"
  if (c === "Medium") return "yellow"
  return "red"
}

function DataTable({
  title,
  rows,
}: {
  title: string
  rows: Array<{
    contractor: string
    project: string
    status: Status
    criticality: Criticality
    discipline: string
    count: number
  }>
}) {
  return (
    <div className="bg-card rounded-lg shadow-sm border border-border/50 flex flex-col h-full overflow-hidden">
      <div className="px-3 py-1 border-b border-border/60 flex-shrink-0">
        <p className="text-xs font-semibold text-foreground">{title}</p>
      </div>
      <div className="overflow-y-auto flex-1">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-muted/60">
              <th className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm px-2 py-1 text-left text-[10px] font-semibold text-muted-foreground uppercase border-b border-border">Contractor</th>
              <th className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm px-2 py-1 text-left text-[10px] font-semibold text-muted-foreground uppercase border-b border-border">Project</th>
              <th className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm px-2 py-1 text-left text-[10px] font-semibold text-muted-foreground uppercase border-b border-border">Status</th>
              <th className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm px-2 py-1 text-left text-[10px] font-semibold text-muted-foreground uppercase border-b border-border">Criticality</th>
              <th className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm px-2 py-1 text-left text-[10px] font-semibold text-muted-foreground uppercase border-b border-border">Discipline</th>
              <th className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm px-2 py-1 text-right text-[10px] font-semibold text-muted-foreground uppercase border-b border-border">Count</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r, idx) => (
              <tr key={`${r.contractor}-${idx}`} className="hover:bg-muted/20">
                <td className="px-2 py-1 text-xs text-foreground">{r.contractor}</td>
                <td className="px-2 py-1 text-xs text-muted-foreground">{r.project}</td>
                <td className="px-2 py-1"><Pill label={r.status} tone={statusTone(r.status)} /></td>
                <td className="px-2 py-1"><Pill label={r.criticality} tone={critTone(r.criticality)} /></td>
                <td className="px-2 py-1 text-xs text-muted-foreground">{r.discipline}</td>
                <td className="px-2 py-1 text-xs font-semibold text-foreground text-right">{r.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function PostAwardPage({ filters }: PostAwardPageProps) {
  const filtered = vendors.filter((v) => {
    if (filters.fournisseur !== "all" && v.name !== filters.fournisseur) return false
    if (filters.category !== "all" && v.category !== filters.category) return false
    if (filters.sousCategory !== "all" && v.subCategory !== filters.sousCategory) return false
    if (filters.bu !== "all" && v.bu !== filters.bu) return false
    if (filters.projects !== "all" && v.project !== filters.projects) return false
    if (filters.tiering !== "all" && v.tiering !== filters.tiering) return false
    if (filters.region !== "all" && v.region !== filters.region) return false
    return true
  })

  const safe = filtered.length ? filtered : vendors
  const count = safe.length

  const sums = safe.reduce(
    (acc, v) => {
      acc.avgScoreClosed += v.postAward.averageScoreClosed
      acc.claims += v.postAward.claimsCount
      acc.changeRequests += v.postAward.changeRequestsCount
      return acc
    },
    { avgScoreClosed: 0, claims: 0, changeRequests: 0 }
  )

  const avgScoreClosed = Math.round((sums.avgScoreClosed / count) * 10) / 10

  const years = ["2022", "2023", "2024", "2025", "2026"]
  const caDependanceData = years.map((year, idx) => {
    const caAvg = safe.reduce((s, v) => s + (v.preAward.chiffreAffaire[idx] ?? 0), 0) / count
    const depAvg = safe.reduce((s, v) => s + v.preAward.dependanceJesa, 0) / count
    return { year, ca: Number(caAvg.toFixed(1)), dependance: Math.round(depAvg) }
  })

  const disciplineFromVendor = (v: typeof vendors[number]) => {
    if (v.category === "Construction") return "Civil"
    if (v.category === "Engineering") return "Mechanical"
    if (v.category === "Manufacturing") return "Process"
    return "Piping"
  }

  const statusFromCount = (n: number): Status => {
    if (n <= 1) return "Closed"
    if (n <= 4) return "In Progress"
    return "Open"
  }

  const criticalityFromCount = (n: number): Criticality => {
    if (n <= 2) return "Low"
    if (n <= 5) return "Medium"
    return "High"
  }

  const ncrRows = safe
    .filter((v) => v.postAward.ncrCount > 0)
    .map((v) => ({
      contractor: v.name,
      project: v.project,
      status: statusFromCount(v.postAward.ncrCount),
      criticality: criticalityFromCount(v.postAward.ncrCount),
      discipline: disciplineFromVendor(v),
      count: v.postAward.ncrCount,
    }))

  const qorRows = safe
    .filter((v) => v.postAward.qorCount > 0)
    .map((v) => ({
      contractor: v.name,
      project: v.project,
      status: statusFromCount(v.postAward.qorCount),
      criticality: criticalityFromCount(v.postAward.qorCount),
      discipline: disciplineFromVendor(v),
      count: v.postAward.qorCount,
    }))

  return (
    <div className="space-y-1.5">

      {/* ── ROW 1: Line chart + KPI cards ── */}
      <div className="flex gap-1.5 h-[180px]">

        {/* Line chart */}
        <div className="bg-card rounded-lg p-2 shadow-sm border border-border/50 flex flex-col flex-1 min-w-0">
          <h3 className="text-xs font-semibold text-foreground mb-1 flex-shrink-0">
            Chiffre d&apos;Affaire &amp; JESA Dependence
          </h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={caDependanceData} margin={{ left: 0, right: 24, top: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="year" tick={{ fontSize: 9 }} stroke="#9ca3af" />
                <YAxis yAxisId="left" tick={{ fontSize: 9 }} stroke="#6366f1" width={24} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9 }} stroke="#10b981" width={24} domain={[0, 100]} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: "9px", paddingTop: "4px" }} iconSize={8} />
                <Line yAxisId="left" type="monotone" dataKey="ca" stroke="#4f46e5" strokeWidth={1.5} dot={{ fill: "#4f46e5", r: 2 }} name="Chiffre d'Affaire (M MAD)" />
                <Line yAxisId="right" type="monotone" dataKey="dependance" stroke="#10b981" strokeWidth={1.5} dot={{ fill: "#10b981", r: 2 }} name="Dependence to JESA (%)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* KPI panel: 2 cards top row + gauge bottom */}
        <div className="flex flex-col gap-1.5 w-[260px] flex-shrink-0">
          <div className="flex gap-1.5 flex-1">
            <div className="flex-1">
              <KPICard
                title="Change Requests"
                value={sums.changeRequests}
                icon={<Scale className="w-4 h-4" />}
                variant="blue"
              />
            </div>
            <div className="flex-1">
              <KPICard
                title="Count of Claims"
                value={sums.claims}
                icon={<Gavel className="w-4 h-4" />}
                variant="red"
              />
            </div>
          </div>
          {/* Gauge spanning full width of panel */}
          <div className="flex-1 bg-card rounded-lg shadow-sm border border-border/50 flex items-center justify-center">
            <GaugeChart
              value={Number(((sums.avgScoreClosed / count) * 20).toFixed(1))}
              maxValue={100}
              title="Avg Score Closed"
              size="sm"
              suffix="%"
            />
          </div>
        </div>
      </div>

      {/* ── ROW 2: NCR & QOR tables ── */}
      <div className="grid grid-cols-2 gap-1.5">
        <div className="h-[240px] flex flex-col">
          <DataTable title="NCR Count by Status / Contractor / Project" rows={ncrRows} />
        </div>
        <div className="h-[240px] flex flex-col">
          <DataTable title="QOR Count by Status / Contractor / Project" rows={qorRows} />
        </div>
      </div>

    </div>
  )
}