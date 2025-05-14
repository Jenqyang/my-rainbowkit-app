import { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs";
import path from "path";
import axios from "axios";
import { FormData } from "formdata-node";
import { fileFromPath } from "formdata-node/file-from-path";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 确保环境变量存在
  if (!process.env.PINATA_JWT || !process.env.NEXT_PUBLIC_GATEWAY_URL) {
    console.error("缺少必要的环境变量");
    return res.status(500).json({ error: "服务器配置错误" });
  }

  try {
    const form = formidable({});
    
    const [fields, files] = await form.parse(req);
    const file = files.file?.[0];

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // 创建 FormData 对象
    const formData = new FormData();
    
    // 从文件路径创建文件对象
    const fileObject = await fileFromPath(file.filepath, 
      file.originalFilename || "uploaded-file", 
      { type: file.mimetype || 'application/octet-stream' }
    );
    
    // 添加到 FormData
    formData.set('file', fileObject);
    
    // 使用 axios 调用 Pinata API
    const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
      headers: {
        'Authorization': `Bearer ${process.env.PINATA_JWT}`,
        'Content-Type': 'multipart/form-data'
      },
      maxContentLength: Infinity, // 允许上传大文件
      maxBodyLength: Infinity
    });
    
    if (response.status !== 200) {
      throw new Error(`Pinata API error: ${response.statusText}`);
    }
    
    const cid = response.data.IpfsHash;
    
    // 构建 Pinata 网关 URL
    const gatewayUrl = `https://${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${cid}`;
    
    return res.status(200).json(gatewayUrl);
  } catch (error) {
    console.error("Error uploading file:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
