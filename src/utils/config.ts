import { PinataSDK } from "pinata"

// 只在服务器端初始化 Pinata SDK
const getPinataInstance = () => {
  // 确保只在服务器端运行
  if (typeof window === 'undefined') {
    return new PinataSDK({
      pinataJwt: process.env.PINATA_JWT,
      pinataGateway: process.env.NEXT_PUBLIC_GATEWAY_URL
    })
  }
  return null
}

export const pinata = getPinataInstance()
