import { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import axios from "axios";
import { FormData } from "formdata-node";
import { fileFromPath } from "formdata-node/file-from-path";

interface PinataFile {
  id: string;
  ipfs_pin_hash: string;
  size: number;
  user_id: string;
  name: string;
  date_pinned: string;
  metadata: {
    name?: string;
    keyvalues?: Record<string, string>;
  };
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 确保环境变量存在
  if (!process.env.PINATA_JWT || !process.env.NEXT_PUBLIC_GATEWAY_URL) {
    console.error("缺少必要的环境变量");
    return res.status(500).json({ error: "服务器配置错误" });
  }

  if (req.method === "GET") {
    try {
      // 调用 Pinata API 获取文件列表
      const response = await axios.get('https://api.pinata.cloud/data/pinList?status=pinned', {
        headers: {
          'Authorization': `Bearer ${process.env.PINATA_JWT}`
        }
      });
      
      if (response.status !== 200) {
        throw new Error(`Pinata API error: ${response.statusText}`);
      }
      
      // 处理文件列表，添加网关 URL
      const files = response.data.rows.map((file: PinataFile) => ({
        id: file.id,
        name: file.metadata?.name || file.name,
        ipfsHash: file.ipfs_pin_hash,
        size: file.size,
        datePinned: file.date_pinned,
        url: `https://${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${file.ipfs_pin_hash}`
      }));
      
      return res.status(200).json(files);
    } catch (error) {
      console.error("Error fetching files:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  } else if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // POST 请求处理上传文件

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
