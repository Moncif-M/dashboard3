"use client"

import {
  Layers,
  ShieldAlert,
  Trophy,
  Coins,
  FileText,
  Gavel,
  BadgeCheck,
  PieChart,
  Users,
  RotateCcw,
  Scale,
} from "lucide-react"
import { KPICard } from "../kpi-card"
import type { FilterState } from "../filter-panel"
import { vendors } from "@/lib/vendor-data"
import { GaugeChart } from "../gauge-chart"

interface PreAwardPageProps {
  filters: FilterState
}

function riskLabelFromValue(v: number) {
  if (v <= 30) return "Low"
  if (v <= 50) return "Medium"
  return "High"
}

function scoreColor(score: number) {
  if (score > 100) return "#3b82f6"
  if (score >= 80) return "#10b981"
  if (score >= 60) return "#f59e0b"
  return "#ef4444"
}

function riskColor(v: number) {
  if (v <= 30) return "#10b981"
  if (v <= 50) return "#f59e0b"
  return "#ef4444"
}

function stableDisplayValue(values: Array<string | number>) {
  const first = values[0]
  if (values.every((v) => v === first)) return String(first)
  return "All"
}

function formatMillions(value: number) {
  return `${value.toFixed(1)}M`
}

export function PreAwardPage({ filters }: PreAwardPageProps) {
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

  const sum = safe.reduce(
    (acc, v) => {
      acc.ecosystem += v.preAward.ecosystemScore
      acc.hse += v.preAward.hseScore
      acc.sustainability += v.preAward.sustainabilityScore
      acc.compliance += v.preAward.complianceRate
      acc.risk += v.preAward.globalRiskLevel
      acc.successfulAwards += v.preAward.successfulAwards
      acc.ongoingPO += v.preAward.packagesOngoing
      acc.ongoingBids += v.preAward.projectsOngoing
      acc.jesaScope += v.preAward.jesaScope
      acc.dependance += v.preAward.dependanceJesa
      acc.awardingVolume += v.preAward.chiffreAffaire[v.preAward.chiffreAffaire.length - 1] ?? 0
      acc.disciplineMaterial += v.postAward.disciplineScores.material
      acc.disciplineContract += v.postAward.disciplineScores.contract
      acc.contractants += v.postAward.contractantsCount
      acc.contracts += v.postAward.contractsCount
      acc.claims += v.postAward.claimsCount
      acc.changeRequests += v.postAward.changeRequestsCount
      return acc
    },
    {
      ecosystem: 0,
      hse: 0,
      sustainability: 0,
      compliance: 0,
      risk: 0,
      successfulAwards: 0,
      ongoingPO: 0,
      ongoingBids: 0,
      jesaScope: 0,
      dependance: 0,
      awardingVolume: 0,
      disciplineMaterial: 0,
      disciplineContract: 0,
      contractants: 0,
      contracts: 0,
      claims: 0,
      changeRequests: 0,
    }
  )

  const avgScores = {
    ecosystem: Math.round(sum.ecosystem / count),
    hse: Math.round(sum.hse / count),
    sustainability: Math.round(sum.sustainability / count),
    compliance: Math.round(sum.compliance / count),
  }

  const scorePreAward = Math.round(
    (avgScores.ecosystem + avgScores.hse + avgScores.sustainability + avgScores.compliance) / 4
  )

  const scorePostAwardMM = Math.round(sum.disciplineMaterial / count)
  const scorePostAwardContract = Math.round(sum.disciplineContract / count)

  const overallStatus = scorePreAward >= 80 ? "Good" : scorePreAward >= 60 ? "Medium" : "Poor"
  const overallTone =
    overallStatus === "Good"
      ? "bg-emerald-100 text-emerald-700"
      : overallStatus === "Medium"
        ? "bg-amber-100 text-amber-700"
        : "bg-red-100 text-red-700"
  const overallTextColor =
    overallStatus === "Good"
      ? "text-emerald-700"
      : overallStatus === "Medium"
        ? "text-amber-700"
        : "text-red-700"

  const vendorLabel = filters.fournisseur !== "all" ? filters.fournisseur : "All vendors"
  const totalVendors = vendors.length

  const tierCounts = safe.reduce(
    (acc, v) => {
      if (v.tiering === "Tier 1") acc.tier1 += 1
      else if (v.tiering === "Tier 2") acc.tier2 += 1
      else if (v.tiering === "Tier 3") acc.tier3 += 1
      else acc.na += 1
      return acc
    },
    { tier1: 0, tier2: 0, tier3: 0, na: 0 }
  )

  const tierTotal = tierCounts.tier1 + tierCounts.tier2 + tierCounts.tier3 + tierCounts.na || 1
  const tierPct = {
    tier1: Math.round((tierCounts.tier1 / tierTotal) * 100),
    tier2: Math.round((tierCounts.tier2 / tierTotal) * 100),
    tier3: Math.round((tierCounts.tier3 / tierTotal) * 100),
    na: Math.round((tierCounts.na / tierTotal) * 100),
  }

  const selectedTier =
    safe.length === 1 ? safe[0].tiering : stableDisplayValue(safe.map((v) => v.tiering))

  const statusLabel =
    scorePreAward >= 90 ? "Very good" : scorePreAward >= 80 ? "Good" : scorePreAward >= 60 ? "Medium" : "Low"

  const riskValue = Math.round(sum.risk / count)
  const riskLabel = riskLabelFromValue(riskValue)

  function ScoreCard({ label, value }: { label: string; value: number }) {
    return (
      <div className="bg-card rounded-lg p-2 shadow-sm border border-border/50 flex flex-col justify-between">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-left">{label}</p>
        <p className="text-lg font-bold text-left" style={{ color: scoreColor(value) }}>{value}%</p>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${Math.min(value, 100)}%`, backgroundColor: scoreColor(value) }} />
        </div>
      </div>
    )
  }

 function RiskCard({ label, value }: { label: string; value: number }) {
  const color = riskColor(value)
  const riskLbl = riskLabelFromValue(value)
  return (
    <div className="bg-card rounded-lg p-2 shadow-sm border border-border/50 flex flex-col justify-between">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-left">{label}</p>
      <p className="text-2xl font-bold text-left" style={{ color }}>{riskLbl}</p>
      <p className="text-[10px] text-muted-foreground text-left">Global risk level</p>
    </div>
  )
}

  return (
    <div className="space-y-2">

      {/* ── ROW 1: 5 cols ── */}
      <div className="grid grid-cols-5 gap-1.5 min-h-[90px]">

        {/* Overall Status */}
        <div className="bg-card rounded-lg p-3 shadow-sm border border-border/50 relative overflow-hidden h-full">
          <div className="absolute top-0 right-0 w-16 h-16 rounded-full -mr-6 -mt-6 bg-muted" />
          <div className="relative flex flex-col justify-between h-full items-start">
            <p className="text-xs text-muted-foreground font-medium text-left w-full">Overall Status</p>
            <div className="relative flex items-center h-8 w-full">
              <div className="p-1.5 rounded-md flex-shrink-0 z-10 bg-muted">
                <BadgeCheck className="w-4 h-4 text-muted-foreground" />
              </div>
              <span className="absolute inset-0 flex flex-col items-center justify-center gap-0">
                <span className={`text-[11px] font-semibold truncate max-w-full px-1 -mt-3 ${overallTextColor}`}>
                  {vendorLabel}
                </span>
                <span className={`inline-flex px-2 py-px rounded-full font-semibold text-xs ${overallTone}`}>
                  {statusLabel}
                </span>
              </span>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg p-2 shadow-sm border border-border/50 flex items-center justify-center">
          <GaugeChart value={scorePreAward} title="Score Pre Award" size="sm" suffix="%" />
        </div>
        <div className="bg-card rounded-lg p-2 shadow-sm border border-border/50 flex items-center justify-center">
          <GaugeChart value={scorePostAwardContract} title="Score Post Award Contract" size="sm" suffix="%" />
        </div>
        <div className="bg-card rounded-lg p-2 shadow-sm border border-border/50 flex items-center justify-center">
          <GaugeChart value={scorePostAwardMM} title="Score Post Award MM" size="sm" suffix="%" />
        </div>
        <KPICard
          title="Vendors in view"
          value={`${safe.length} / ${totalVendors}`}
          icon={<Users className="w-4 h-4" />}
          variant="blue"
        />
      </div>

      {/* ── ROW A: 5-col grid — HSE | Ecosystem | Sustainability | Compliance | Global Risk ── */}
      <div className="grid grid-cols-5 gap-1.5 min-h-[95px]">
        <ScoreCard label="HSE" value={avgScores.hse} />
        <ScoreCard label="Ecosystem" value={avgScores.ecosystem} />
        <ScoreCard label="Sustainability" value={avgScores.sustainability} />
        <ScoreCard label="Compliance" value={avgScores.compliance} />
        <RiskCard label="Vendor Global Risk" value={riskValue} />
      </div>

      {/* ── ROW B: 5-col grid ── */}
      <div className="grid grid-cols-5 gap-1.5 min-h-[95px]">

        {/* Tiering */}
        <div className="rounded-lg p-2 shadow-sm border border-border/50 bg-card relative overflow-hidden">
          <div className="absolute top-0 right-0 w-14 h-14 rounded-full -mr-5 -mt-5 bg-muted" />
          <div className="relative flex flex-col h-full">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <div className="p-1.5 rounded-md bg-muted">
                  <Layers className="w-3 h-3 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium text-left">Tiering</p>
                  <p className="text-[10px] text-muted-foreground text-left">Distribution</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Selected</p>
                <p className="text-xs font-semibold text-foreground">{selectedTier}</p>
              </div>
            </div>
            <div className="flex flex-col gap-px -mt-1">
              {[
                { label: "Tier 1", value: tierPct.tier1 },
                { label: "Tier 2", value: tierPct.tier2 },
                { label: "Tier 3", value: tierPct.tier3 },
                { label: "N/A",    value: tierPct.na },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-[8.5px] text-muted-foreground">{label}</span>
                  <span className="text-[8.5px] font-bold text-[#666666]">{value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <KPICard title="Ongoing Bids" value={sum.ongoingBids} icon={<Gavel className="w-4 h-4" />} variant="default" />
        <KPICard title="Ongoing PO / Contracts" value={sum.ongoingPO} icon={<FileText className="w-4 h-4" />} variant="default" />
        <KPICard title="Change Requests" value={sum.changeRequests} icon={<Scale className="w-4 h-4" />} variant="blue" />
        <KPICard title="Awarding Volume" value={formatMillions(sum.awardingVolume)} icon={<Coins className="w-4 h-4" />} variant="orange" />
      </div>

      {/* ── ROW C: 5-col grid ── */}
      <div className="grid grid-cols-5 gap-1.5 min-h-[110px]">
        <KPICard title="Nbre Contractants" value={sum.contractants} icon={<Users className="w-4 h-4" />} variant="yellow" />
        <KPICard title="Nbre de contrat" value={sum.contracts} icon={<RotateCcw className="w-4 h-4" />} variant="blue" />
        <KPICard title="Successful Awards" value={sum.successfulAwards} icon={<Trophy className="w-4 h-4" />} variant="green" />
        <KPICard title="% of JESA Scope" value={`${Math.round(sum.jesaScope / count)}%`} icon={<PieChart className="w-4 h-4" />} variant="blue" />
        <KPICard title="Count of Claims" value={sum.claims} icon={<Gavel className="w-4 h-4" />} variant="red" />
      </div>

    </div>
  )
}