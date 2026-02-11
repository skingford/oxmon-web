'use client'

import { useMemo, useState } from 'react'
import type { Certificate } from '@/lib/types'
import { analyzeCertificateTrust } from '@/actions/ai'
import { createId } from '@/lib/id'
import { useI18n } from '@/contexts/I18nContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import {
  ArrowRight,
  BadgeCheck,
  Brain,
  Search,
  Shield,
  ShieldPlus,
  Sparkles,
  TriangleAlert,
  Workflow,
  X,
  type LucideIcon,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Sheet, SheetContent } from '@/components/ui/sheet'

interface CertificatesProps {
  certificates: Certificate[]
  onAddCertificate: (cert: Certificate) => void
  onDeleteCertificate: (id: string) => void
  onRenewCertificate: (id: string) => void
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void
}

const Certificates: React.FC<CertificatesProps> = ({
  certificates,
  onAddCertificate,
  onDeleteCertificate,
  onRenewCertificate,
  onShowToast,
}) => {
  const { tr } = useI18n()
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newCert, setNewCert] = useState({ domain: '', issuer: '', expiry: '' })
  const [detailCert, setDetailCert] = useState<Certificate | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<string | null>(null)

  const filteredCertificates = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return certificates

    return certificates.filter(
      (cert) =>
        cert.domain.toLowerCase().includes(term) ||
        cert.issuer.toLowerCase().includes(term),
    )
  }, [certificates, searchTerm])

  const stats = useMemo<
    Array<{ label: string; val: number; color: string; icon: LucideIcon }>
  >(
    () => [
      {
        label: tr('Domains Protected'),
        val: certificates.length,
        color: 'text-text-main',
        icon: Shield,
      },
      {
        label: tr('Secure Gradient'),
        val: certificates.filter((c) => c.status === 'Valid').length,
        color: 'text-success',
        icon: ShieldPlus,
      },
      {
        label: tr('Expiring Soon'),
        val: certificates.filter((c) => c.status === 'Expiring').length,
        color: 'text-warning',
        icon: TriangleAlert,
      },
      {
        label: tr('TTL Overdue'),
        val: certificates.filter((c) => c.status === 'Expired').length,
        color: 'text-danger',
        icon: X,
      },
    ],
    [certificates, tr],
  )

  const handleAnalyzeTrust = async (cert: Certificate) => {
    setIsAnalyzing(true)
    setAnalysisResult(null)

    try {
      const result = await analyzeCertificateTrust(
        cert.domain,
        cert.issuer,
        cert.daysRemaining,
      )
      setAnalysisResult(result)
    } catch {
      onShowToast(tr('Neural audit handshake failed.'), 'error')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()

    const cert: Certificate = {
      id: createId('cert'),
      domain: newCert.domain,
      issuer: newCert.issuer,
      status: 'Valid',
      expiryDate: new Date(newCert.expiry).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      daysRemaining: Math.floor(
        (new Date(newCert.expiry).getTime() - new Date().getTime()) /
          (1000 * 3600 * 24),
      ),
      lastCheck: tr('Just now'),
    }

    onAddCertificate(cert)
    setIsModalOpen(false)
    setNewCert({ domain: '', issuer: '', expiry: '' })
    onShowToast(`Monitor active for ${cert.domain}.`, 'success')
  }

  return (
    <div className="space-y-12 pb-20 animate-fade-in">
      <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
        <div className="space-y-3">
          <h2 className="text-5xl font-black uppercase tracking-tighter text-text-main">
            {tr('Trust Perimeter')}
          </h2>
          <p className="text-base font-medium text-secondary">
            {tr(
              'Global lifecycle management for TLS/SSL credentials and distributed trust chains.',
            )}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="group relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[22px] text-secondary transition-colors group-focus-within:text-primary" />
            <Input
              type="text"
              placeholder={tr('Filter domains...')}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-72 rounded-2xl border border-border bg-white py-3.5 pl-12 pr-6 text-sm font-bold shadow-soft outline-none transition-all focus:ring-8 focus:ring-primary/5"
            />
          </div>

          <Button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-3 rounded-2xl bg-primary px-10 py-3.5 text-[11px] font-black uppercase tracking-widest text-white shadow-2xl shadow-primary/30 transition-all hover:bg-primary-hover active:scale-95"
          >
            <ShieldPlus className="text-[24px]" />
            {tr('Deploy Monitor')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const StatIcon = stat.icon

          return (
            <div
              key={stat.label}
              className="relative flex h-48 flex-col justify-between overflow-hidden rounded-[3rem] border border-border bg-white p-10 shadow-soft transition-all group hover:border-primary/20"
            >
              <div className="absolute right-0 top-0 p-8 opacity-5 transition-transform group-hover:scale-110">
                <StatIcon className={`text-8xl ${stat.color}`} />
              </div>

              <p className="relative z-10 text-[11px] font-black uppercase tracking-[0.4em] text-secondary">
                {stat.label}
              </p>

              <div className="relative z-10 flex items-end justify-between">
                <span
                  className={`text-6xl font-black tracking-tighter ${stat.color}`}
                >
                  {stat.val}
                </span>
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 transition-all group-hover:scale-110 group-hover:shadow-xl ${stat.color}`}
                >
                  <StatIcon className="text-[32px]" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="overflow-hidden rounded-[3.5rem] border border-border bg-white shadow-soft">
        <Table className="w-full border-collapse text-left">
          <TableHeader className="border-b border-border bg-[#FBFBFD]">
            <TableRow>
              <TableHead className="px-12 py-7 text-[11px] font-black uppercase tracking-[0.4em] text-secondary">
                {tr('Domain Endpoint')}
              </TableHead>
              <TableHead className="px-12 py-7 text-[11px] font-black uppercase tracking-[0.4em] text-secondary">
                {tr('Trust Integrity')}
              </TableHead>
              <TableHead className="px-12 py-7 text-[11px] font-black uppercase tracking-[0.4em] text-secondary">
                {tr('CA Entity')}
              </TableHead>
              <TableHead className="px-12 py-7 text-[11px] font-black uppercase tracking-[0.4em] text-secondary">
                {tr('TTL Remaining')}
              </TableHead>
              <TableHead className="w-16 px-12 py-7" />
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-border">
            {filteredCertificates.length > 0 ? (
              filteredCertificates.map((cert) => (
                <TableRow
                  key={cert.id}
                  className="group cursor-pointer transition-all hover:bg-gray-50/50"
                  onClick={() => setDetailCert(cert)}
                >
                  <TableCell className="px-12 py-8">
                    <span className="font-mono text-base font-black tracking-tight text-text-main transition-colors group-hover:text-primary">
                      {cert.domain}
                    </span>
                  </TableCell>

                  <TableCell className="px-12 py-8">
                    <div
                      className={`inline-flex items-center gap-3 rounded-full border-2 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest ${
                        cert.status === 'Valid'
                          ? 'border-green-100 bg-green-50 text-success shadow-sm'
                          : cert.status === 'Expiring'
                            ? 'border-orange-100 bg-orange-50 text-warning shadow-sm'
                            : 'border-red-100 bg-red-50 text-danger shadow-sm'
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${cert.status === 'Valid' ? 'animate-pulse bg-success shadow-lg shadow-success/40' : 'bg-danger'}`}
                      />
                      {tr(cert.status)}
                    </div>
                  </TableCell>

                  <TableCell className="px-12 py-8 text-[12px] font-bold uppercase tracking-widest text-secondary opacity-60">
                    {cert.issuer}
                  </TableCell>

                  <TableCell className="px-12 py-8">
                    <div className="flex flex-col">
                      <span
                        className={`text-lg font-black tracking-tight ${cert.daysRemaining < 15 ? 'text-danger' : 'text-text-main'}`}
                      >
                        {cert.daysRemaining} {tr('Days')}
                      </span>
                      <span className="mt-1 text-[10px] font-black uppercase tracking-widest text-secondary opacity-40">
                        {cert.expiryDate}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="px-12 py-8 text-right">
                    <ArrowRight className="text-[28px] text-gray-200 transition-all group-hover:translate-x-3 group-hover:text-primary" />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="py-32 text-center opacity-30">
                  <div className="flex flex-col items-center gap-6">
                    <Workflow className="text-6xl" />
                    <p className="text-[12px] font-black uppercase tracking-[0.5em]">
                      {tr('No matching trust assets identified.')}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet
        open={Boolean(detailCert)}
        onOpenChange={(open) => {
          if (!open) {
            setDetailCert(null)
            setAnalysisResult(null)
          }
        }}
      >
        <SheetContent
          side="right"
          className="flex h-full w-full max-w-2xl flex-col overflow-hidden border-l border-border bg-white p-16 shadow-3xl"
        >
          {detailCert ? (
            <>
              <div className="mb-16 flex items-start justify-between">
                <div className="space-y-2">
                  <h3 className="text-3xl font-black uppercase leading-none tracking-tighter text-text-main">
                    {tr('Trust Analysis')}
                  </h3>
                  <p className="font-mono text-[11px] font-black uppercase tracking-[0.4em] text-secondary opacity-50">
                    {detailCert.domain}
                  </p>
                </div>

                <Button
                  onClick={() => {
                    setDetailCert(null)
                    setAnalysisResult(null)
                  }}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 text-secondary transition-all hover:text-text-main"
                >
                  <X />
                </Button>
              </div>

              <div className="custom-scrollbar flex-1 space-y-14 overflow-y-auto pr-4">
                <div className="group relative overflow-hidden rounded-[3.5rem] border border-indigo-100 bg-gradient-to-br from-indigo-50/50 to-white p-12 shadow-soft">
                  <div className="absolute right-0 top-0 p-12 opacity-5 transition-transform group-hover:scale-110">
                    <BadgeCheck className="text-[150px] text-primary" />
                  </div>

                  <p className="mb-8 text-[11px] font-black uppercase tracking-[0.5em] text-primary">
                    {tr('Asset Telemetry')}
                  </p>

                  <div className="grid grid-cols-2 gap-10">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-secondary opacity-40">
                        {tr('Status')}
                      </p>
                      <p className="text-xl font-black uppercase tracking-tight text-indigo-950">
                        {tr(detailCert.status)}
                      </p>
                    </div>
                    <div className="space-y-2 text-right">
                      <p className="text-[10px] font-black uppercase tracking-widest text-secondary opacity-40">
                        {tr('TTL')}
                      </p>
                      <p className="text-xl font-black tracking-tight text-indigo-950">
                        {detailCert.daysRemaining} {tr('Days')}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-secondary opacity-40">
                        {tr('Authority')}
                      </p>
                      <p className="text-[13px] font-black uppercase tracking-widest text-indigo-950">
                        {detailCert.issuer}
                      </p>
                    </div>
                    <div className="space-y-2 text-right">
                      <p className="text-[10px] font-black uppercase tracking-widest text-secondary opacity-40">
                        {tr('Last Sync')}
                      </p>
                      <p className="text-[13px] font-black uppercase tracking-widest text-indigo-950">
                        {detailCert.lastCheck}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <h5 className="text-[11px] font-black uppercase tracking-[0.5em] text-secondary">
                      {tr('Neural Trust Audit')}
                    </h5>
                    <Button
                      onClick={() => handleAnalyzeTrust(detailCert)}
                      disabled={isAnalyzing}
                      className="group/audit flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-primary disabled:opacity-50"
                    >
                      <Sparkles
                        className={`text-[20px] ${isAnalyzing ? 'animate-spin' : ''}`}
                      />
                      {isAnalyzing ? tr('Scanning...') : tr('Run Neural Scan')}
                    </Button>
                  </div>

                  <div>
                    {analysisResult ? (
                      <div className="group relative overflow-hidden rounded-[3rem] border border-white/5 bg-[#0F172A] p-12 text-white shadow-3xl animate-fade-in-up">
                        <div className="pointer-events-none absolute right-0 top-0 p-12 opacity-5 transition-transform group-hover:scale-110">
                          <Brain className="text-[120px]" />
                        </div>
                        <div className="prose prose-invert relative z-10 whitespace-pre-wrap text-[15px] font-medium leading-[2.2] text-indigo-100/90">
                          {analysisResult}
                        </div>
                      </div>
                    ) : isAnalyzing ? (
                      <div className="animate-pulse space-y-6">
                        <div className="h-6 w-full rounded-full bg-gray-50" />
                        <div className="h-6 w-[94%] rounded-full bg-gray-50" />
                        <div className="h-6 w-[88%] rounded-full bg-gray-50" />
                      </div>
                    ) : (
                      <div className="group space-y-8 rounded-[3.5rem] border-4 border-dashed border-gray-100 p-24 text-center transition-all hover:border-primary/20">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 text-gray-300 transition-colors group-hover:text-primary">
                          <Shield className="text-4xl" />
                        </div>
                        <p className="text-[11px] font-black uppercase tracking-[0.5em] leading-[2.5] text-secondary">
                          {tr(
                            'Establish neural link for high-fidelity trust chain vulnerability assessment',
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-5 border-t border-border pt-12">
                <Button
                  onClick={() => {
                    onRenewCertificate(detailCert.id)
                    setDetailCert(null)
                  }}
                  className="flex-1 rounded-[2rem] bg-primary py-6 text-[11px] font-black uppercase tracking-[0.4em] text-white shadow-3xl shadow-primary/40 transition-all hover:bg-primary-hover active:scale-95"
                >
                  {tr('Renew Trust Asset')}
                </Button>
                <Button
                  onClick={() => {
                    onDeleteCertificate(detailCert.id)
                    setDetailCert(null)
                  }}
                  className="rounded-[2rem] border-2 border-border px-10 py-6 text-[11px] font-black uppercase tracking-[0.4em] text-danger transition-all hover:border-red-100 hover:bg-red-50 active:scale-95"
                >
                  {tr('Decommission')}
                </Button>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent
          className="w-full max-w-xl rounded-[2rem] border border-white/20 p-0 ring-1 ring-black/5"
          showCloseButton={false}
        >
          <div className="p-10 sm:p-16">
            <DialogHeader className="mb-12">
              <div className="flex items-center gap-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/5 text-primary shadow-inner">
                  <ShieldPlus className="text-4xl" />
                </div>
                <DialogTitle className="text-3xl font-black uppercase leading-none tracking-tighter text-text-main">
                  {tr('Provision Monitor')}
                </DialogTitle>
              </div>
              <DialogDescription className="sr-only">
                {tr('Provision Monitor')}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-10">
              <div className="space-y-3">
                <Label className="ml-1 block text-[11px] font-black uppercase tracking-[0.4em] text-secondary opacity-50">
                  {tr('FQDN / Endpoint Identifier')}
                </Label>
                <Input
                  required
                  type="text"
                  value={newCert.domain}
                  onChange={(event) =>
                    setNewCert({ ...newCert, domain: event.target.value })
                  }
                  placeholder={tr('e.g. sentinel.oxmon.io')}
                  className="w-full rounded-[2rem] border border-border bg-gray-50 px-8 py-5 text-base font-bold outline-none transition-all placeholder:text-gray-300 focus:bg-white focus:ring-8 focus:ring-primary/5"
                />
              </div>

              <div className="space-y-3">
                <Label className="ml-1 block text-[11px] font-black uppercase tracking-[0.4em] text-secondary opacity-50">
                  {tr('CA Issuing Authority')}
                </Label>
                <Input
                  required
                  type="text"
                  value={newCert.issuer}
                  onChange={(event) =>
                    setNewCert({ ...newCert, issuer: event.target.value })
                  }
                  placeholder={tr('e.g. DigiCert Global G2')}
                  className="w-full rounded-[2rem] border border-border bg-gray-50 px-8 py-5 text-base font-bold outline-none transition-all placeholder:text-gray-300 focus:bg-white focus:ring-8 focus:ring-primary/5"
                />
              </div>

              <div className="space-y-3">
                <Label className="ml-1 block text-[11px] font-black uppercase tracking-[0.4em] text-secondary opacity-50">
                  {tr('Handshake Expiry')}
                </Label>
                <Input
                  required
                  type="date"
                  value={newCert.expiry}
                  onChange={(event) =>
                    setNewCert({ ...newCert, expiry: event.target.value })
                  }
                  className="w-full rounded-[2rem] border border-border bg-gray-50 px-8 py-5 text-base font-bold outline-none transition-all focus:bg-white focus:ring-8 focus:ring-primary/5"
                />
              </div>

              <DialogFooter className="flex justify-end gap-5 pt-8 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  variant="ghost"
                  className="rounded-2xl px-8 py-5 text-[11px] font-black uppercase tracking-[0.4em] text-secondary transition-colors hover:text-text-main"
                >
                  {tr('Discard')}
                </Button>
                <Button
                  type="submit"
                  className="rounded-[2rem] bg-primary px-12 py-5 text-[11px] font-black uppercase tracking-[0.4em] text-white shadow-3xl shadow-primary/30 transition-all hover:bg-primary-hover active:scale-95"
                >
                  {tr('Enable Monitor')}
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Certificates
