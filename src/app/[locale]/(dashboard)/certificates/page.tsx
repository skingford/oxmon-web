'use client'

import { useAppContext } from '@/contexts/AppContext'
import Certificates from '@/components/Certificates'

export default function CertificatesPage() {
  const { certificates, setCertificates, showToast } = useAppContext()

  return (
    <Certificates
      certificates={certificates}
      onAddCertificate={(cert) => setCertificates(prev => [...prev, cert])}
      onDeleteCertificate={(id) => setCertificates(prev => prev.filter(c => c.id !== id))}
      onRenewCertificate={(id) => {
        setCertificates(prev => prev.map(c => c.id === id ? { ...c, status: 'Valid', daysRemaining: 90 } : c))
        showToast('Certificate renewal initiated.', 'success')
      }}
      onShowToast={showToast}
    />
  )
}
