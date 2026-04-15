import QRCode from 'qrcode'

export async function qrToBase64(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, { width: 256, margin: 1 })
}
