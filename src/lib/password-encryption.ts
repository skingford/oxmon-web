const PUBLIC_KEY_PEM_HEADER = "-----BEGIN PUBLIC KEY-----"
const PUBLIC_KEY_PEM_FOOTER = "-----END PUBLIC KEY-----"

function getSubtleCrypto() {
  const subtle = globalThis.crypto?.subtle

  if (!subtle || typeof window === "undefined") {
    throw new Error("当前环境不支持 Web Crypto")
  }

  return subtle
}

function pemToArrayBuffer(publicKeyPem: string) {
  const normalized = publicKeyPem
    .replace(PUBLIC_KEY_PEM_HEADER, "")
    .replace(PUBLIC_KEY_PEM_FOOTER, "")
    .replace(/\s+/g, "")

  if (!normalized) {
    throw new Error("无效的 RSA 公钥")
  }

  const binary = window.atob(normalized)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return bytes.buffer
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer)
  const chunkSize = 0x8000
  let binary = ""

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize)
    binary += String.fromCharCode(...chunk)
  }

  return window.btoa(binary)
}

export async function encryptPasswordWithPublicKey(
  publicKeyPem: string,
  password: string,
  timestamp = Math.floor(Date.now() / 1000)
) {
  const subtle = getSubtleCrypto()
  const keyData = pemToArrayBuffer(publicKeyPem)
  const key = await subtle.importKey(
    "spki",
    keyData,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    false,
    ["encrypt"]
  )

  const payload = JSON.stringify({
    password,
    timestamp,
  })

  const encodedPayload = new TextEncoder().encode(payload)
  const encryptedPayload = await subtle.encrypt(
    {
      name: "RSA-OAEP",
    },
    key,
    encodedPayload
  )

  return arrayBufferToBase64(encryptedPayload)
}
