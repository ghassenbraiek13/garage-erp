import axios from 'axios'
import { Download, Eye, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import api from '@/utils/api'

type QuotePdfButtonsProps = {
  entity: 'quotes' | 'invoices'
  id: string
  fileName: string
  size?: 'sm' | 'default'
}

export function QuotePdfButtons({ entity, id, fileName, size = 'default' }: QuotePdfButtonsProps) {
  const { t } = useTranslation('quotes')
  const [previewLoading, setPreviewLoading] = useState(false)
  const [downloadLoading, setDownloadLoading] = useState(false)

  const fetchPdf = async () => {
    const res = await api.get(`/${entity}/${id}/pdf`, { responseType: 'blob' })
    return new Blob([res.data], { type: 'application/pdf' })
  }

  const handlePreviewPDF = async () => {
    setPreviewLoading(true)
    try {
      const blob = await fetchPdf()
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
      setTimeout(() => URL.revokeObjectURL(url), 10_000)
    } catch {
      toast.error(t('pdfPreviewError'))
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    setDownloadLoading(true)
    try {
      const blob = await fetchPdf()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        toast.error(t('pdfDownloadError'))
      } else {
        toast.error(t('pdfDownloadError'))
      }
    } finally {
      setDownloadLoading(false)
    }
  }

  const btnSize = size === 'sm' ? 'sm' : 'default'

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="secondary"
        size={btnSize}
        disabled={previewLoading || downloadLoading}
        onClick={() => void handlePreviewPDF()}
      >
        {previewLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
        {previewLoading ? t('pdfGenerating') : t('previewPdf')}
      </Button>
      <Button
        type="button"
        variant="secondary"
        size={btnSize}
        disabled={previewLoading || downloadLoading}
        onClick={() => void handleDownloadPDF()}
      >
        {downloadLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        {t('downloadPdf')}
      </Button>
    </div>
  )
}
