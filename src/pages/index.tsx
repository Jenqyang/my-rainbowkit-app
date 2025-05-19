import { ConnectButton } from '@rainbow-me/rainbowkit';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect, ChangeEvent } from 'react';
import { useAccount } from 'wagmi';

interface FileItem {
  id: string;
  name: string;
  ipfsHash: string;
  size: number;
  datePinned: string;
  url: string;
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const Home: NextPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileType, setFileType] = useState<string>('');
  const [filesList, setFilesList] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'explore' | 'upload'>('explore');
  const [showNftOption, setShowNftOption] = useState(false);
  const [isMintingNft, setIsMintingNft] = useState(false);
  const [mintProgress, setMintProgress] = useState(0);
  const [nftMinted, setNftMinted] = useState(false);
  const [currentFileHash, setCurrentFileHash] = useState<string>('');
  
  // 使用 wagmi 的 useAccount hook 检查钱包连接状态
  const { address, isConnected } = useAccount();
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // 如果已经有一个本地预览URL，先释放它
      if (fileUrl && fileUrl.startsWith('blob:')) {
        URL.revokeObjectURL(fileUrl);
      }
      
      const selectedFile = files[0];
      setFile(selectedFile);
      setFileType(selectedFile.type);
      
      // Create a URL for the file preview
      const url = URL.createObjectURL(selectedFile);
      setFileUrl(url);
    }
  };
  
  // 获取文件列表
  const fetchFiles = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/files');
      if (!response.ok) {
        throw new Error('Failed to fetch files');
      }
      const data = await response.json();
      setFilesList(data);
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 页面加载时获取文件列表
  useEffect(() => {
    fetchFiles();
  }, []);
  
  const handleUpload = async () => {
    if (!file || !isConnected) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    // Show upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + 5;
      });
    }, 300);
    
    try {
      // Upload file to Pinata through our API route
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/files', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      // Get the Pinata URL from the response
      const pinataData = await response.json();
      const pinataUrl = pinataData.url || pinataData;
      const ipfsHash = pinataData.IpfsHash || (typeof pinataData === 'string' ? pinataData.split('/').pop() : '');
      
      clearInterval(interval);
      setUploadProgress(100);
      
      // 清除本地缓存的文件预览URL
      if (fileUrl && fileUrl.startsWith('blob:')) {
        URL.revokeObjectURL(fileUrl);
      }
      
      // 重置文件选择状态，但保留文件URL用于NFT铸造
      setFile(null);
      
      setFileUrl(pinataUrl); // Update the file URL to the Pinata URL
      setCurrentFileHash(ipfsHash);
      
      // 使用更现代的通知而不是alert
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg transform transition-all duration-500 ease-in-out';
      notification.textContent = 'File uploaded successfully to IPFS via Pinata!';
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.classList.add('opacity-0');
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 500);
      }, 3000);
      
      // 显示NFT铸造选项
      setShowNftOption(true);
      
      // 刷新文件列表
      fetchFiles();
      // 上传成功后保持在上传标签，让用户可以选择铸造NFT
      // setActiveTab('explore');
    } catch (error) {
      console.error('Error uploading file:', error);
      
      // 错误通知
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg';
      notification.textContent = 'Failed to upload file';
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.classList.add('opacity-0');
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 500);
      }, 3000);
    } finally {
      setIsUploading(false);
    }
  };
  
  // 模拟铸造NFT的函数
  const mintNFT = async () => {
    if (!fileUrl || !currentFileHash || !isConnected) return;
    
    setIsMintingNft(true);
    setMintProgress(0);
    
    // 模拟铸造过程
    const mintInterval = setInterval(() => {
      setMintProgress(prev => {
        if (prev >= 95) {
          clearInterval(mintInterval);
          return 95;
        }
        return prev + 5;
      });
    }, 300);
    
    try {
      // 模拟铸造延迟
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // 模拟铸造成功
      clearInterval(mintInterval);
      setMintProgress(100);
      setNftMinted(true);
      
      // 铸造成功通知
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-purple-500 text-white px-4 py-2 rounded-lg shadow-lg transform transition-all duration-500 ease-in-out';
      notification.textContent = 'Sound successfully minted as NFT!';
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.classList.add('opacity-0');
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 500);
      }, 3000);
      
      // 铸造成功后切换到浏览标签
      setTimeout(() => {
        // 清除本地缓存的文件预览URL和所有状态
        if (fileUrl && fileUrl.startsWith('blob:')) {
          URL.revokeObjectURL(fileUrl);
        }
        setFileUrl(null);
        setActiveTab('explore');
        // 重置所有状态
        setShowNftOption(false);
        setIsMintingNft(false);
        setNftMinted(false);
        setFile(null);
        setFileType('');
        setCurrentFileHash('');
      }, 2000);
      
    } catch (error) {
      console.error('Error minting NFT:', error);
      
      // 错误通知
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg';
      notification.textContent = 'Failed to mint NFT';
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.classList.add('opacity-0');
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 500);
      }, 3000);
    } finally {
      setIsMintingNft(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <Head>
        <title>Sound Capsule | Bitcoin NFT Audio Storage</title>
        <meta
          content="Sound Capsule - Permanently preserve precious sounds on the Bitcoin blockchain"
          name="description"
        />
        <link href="/favicon.ico" rel="icon" />
      </Head>

      {/* 导航栏 */}
      <nav className="border-b border-gray-800 backdrop-blur-md bg-black/30 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500">
                Sound Capsule
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <ConnectButton />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 英雄区域 */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500">
            Sound Capsule - Bitcoin NFT Edition
          </h1>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto">
            Permanently preserve precious sounds on the Bitcoin blockchain. Hometown accents, baby&#39;s first words, special event recordings - never to be lost.
          </p>
        </div>

        {/* 标签切换 */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-md shadow-sm bg-gray-800 p-1">
            <button
              onClick={() => setActiveTab('explore')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                activeTab === 'explore'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              Explore Sounds
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                activeTab === 'upload'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              Upload New Sound
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="max-w-6xl mx-auto">
          {activeTab === 'explore' ? (
            <div>
              <h2 className="text-2xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                Explore Sound Capsules
              </h2>
              
              {isLoading ? (
                <div className="flex justify-center items-center py-16">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                </div>
              ) : filesList.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filesList.map((item) => (
                    <div key={item.id} className="bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-indigo-500/20 transition-all duration-300 hover:transform hover:scale-[1.02] border border-gray-700">
                      <div className="h-48 bg-gray-700 flex items-center justify-center overflow-hidden">
                        {item.name.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                          <img 
                            src={item.url} 
                            alt={item.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : item.name.match(/\.(mp4|webm|ogg)$/i) ? (
                          <div className="relative w-full h-full">
                            <video 
                              src={item.url}
                              className="w-full h-full object-cover"
                              muted
                              loop
                              autoPlay
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                          </div>
                        ) : item.name.match(/\.(mp3|wav|ogg)$/i) ? (
                          <div className="flex flex-col items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                            </svg>
                            <p className="mt-2 text-gray-300">Sound Capsule</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="mt-2 text-gray-300">{item.name.split('.').pop()?.toUpperCase() || 'File'}</p>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-lg mb-1 truncate" title={item.name}>{item.name}</h3>
                        <div className="flex items-center text-sm text-gray-400 mb-2">
                          <span className="font-mono truncate" title={item.ipfsHash}>
                            {item.ipfsHash.substring(0, 6)}...{item.ipfsHash.substring(item.ipfsHash.length - 4)}
                          </span>
                          <button 
                            onClick={() => {navigator.clipboard.writeText(item.ipfsHash); 
                              // 复制提示
                              const notification = document.createElement('div');
                              notification.className = 'fixed top-4 right-4 bg-gray-700 text-white px-4 py-2 rounded-lg shadow-lg';
                              notification.textContent = 'CID copied to clipboard';
                              document.body.appendChild(notification);
                              setTimeout(() => {
                                notification.classList.add('opacity-0');
                                setTimeout(() => {
                                  document.body.removeChild(notification);
                                }, 500);
                              }, 2000);
                            }}
                            className="ml-2 text-indigo-400 hover:text-indigo-300"
                            title="Copy full CID"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400">{formatFileSize(item.size)}</span>
                          <span className="text-gray-400">{new Date(item.datePinned).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="border-t border-gray-700 p-4">
                        <a 
                          href={item.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="w-full flex items-center justify-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium rounded-md transition-colors"
                        >
                          Play Sound
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-gray-800/50 rounded-xl border border-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                  <p className="text-xl text-gray-400">No sound capsules yet</p>
                  <button 
                    onClick={() => setActiveTab('upload')}
                    className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-md transition-colors"
                  >
                    Upload your first sound capsule
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-orange-400">
                Upload Sound Capsule
              </h2>
              
              <div className="max-w-xl mx-auto">
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-6">
                  <div 
                    className={`border-2 border-dashed ${isConnected ? 'border-gray-600 hover:border-indigo-500 cursor-pointer' : 'border-gray-700 opacity-60 cursor-not-allowed'} rounded-xl p-8 mb-6 transition-colors`}
                    onClick={() => isConnected && document.getElementById('file-upload')?.click()}
                  >
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                      disabled={isUploading || !isConnected}
                    />
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 mb-4 rounded-full bg-gray-700 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <p className="text-lg font-medium text-gray-300 mb-1">
                        {file ? file.name : isConnected ? 'Drag and drop or click to upload sound file' : 'Please connect your wallet first'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {isConnected ? 'Upload sound file to IPFS, then inscribe on Bitcoin blockchain' : 'Connect wallet to start uploading your precious sound'}
                      </p>
                    </div>
                  </div>
                  
                  {fileUrl && !showNftOption && (
                    <div className="mb-6 bg-gray-900 rounded-lg p-4 border border-gray-700">
                      <p className="text-sm font-medium mb-3 text-gray-300">Preview:</p>
                      <div className="flex justify-center">
                        {fileType.startsWith('image/') ? (
                          <img 
                            src={fileUrl} 
                            alt="Uploaded file" 
                            className="rounded-lg max-h-64 object-contain" 
                          />
                        ) : fileType.startsWith('audio/') ? (
                          <audio
                            controls
                            src={fileUrl}
                            className="w-full"
                          />
                        ) : fileType.startsWith('video/') ? (
                          <video
                            controls
                            src={fileUrl}
                            className="w-full max-h-64 rounded-lg"
                          />
                        ) : (
                          <div className="p-4 bg-gray-800 rounded-lg w-full text-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-sm text-gray-300">File: <span className="font-medium">{file?.name}</span></p>
                            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 text-sm mt-2 inline-block">
                              Preview file
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {isUploading ? (
                    <div className="w-full">
                      <div className="h-1 w-full bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between items-center mt-2 text-sm">
                        <p className="text-gray-400">Uploading to IPFS...</p>
                        <p className="text-gray-300 font-medium">{uploadProgress}%</p>
                      </div>
                    </div>
                  ) : showNftOption ? (
                    <div className="w-full">
                      {isMintingNft ? (
                        <div className="w-full">
                          <div className="h-1 w-full bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                              style={{ width: `${mintProgress}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between items-center mt-2 text-sm">
                            <p className="text-gray-400">Minting NFT...</p>
                            <p className="text-gray-300 font-medium">{mintProgress}%</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                            <h4 className="text-lg font-medium text-white mb-2">Sound successfully uploaded to IPFS!</h4>
                            <p className="text-gray-300 mb-4">You can now choose to mint this sound as an NFT, permanently preserving it on the blockchain.</p>
                            <div className="flex space-x-3">
                              <button
                                onClick={mintNFT}
                                disabled={!isConnected}
                                className="flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-300 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg hover:shadow-purple-500/25"
                              >
                                Mint as NFT
                              </button>
                              <button
                                onClick={() => {
                                  // Clear all states
                                  setShowNftOption(false);
                                  setActiveTab('explore');
                                  setFile(null);
                                  setFileType('');
                                  if (fileUrl && fileUrl.startsWith('blob:')) {
                                    URL.revokeObjectURL(fileUrl);
                                  }
                                  setFileUrl(null);
                                }}
                                className="flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-300 bg-gray-600 hover:bg-gray-500 text-white"
                              >
                                Maybe Later
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={handleUpload}
                      disabled={!file || !isConnected}
                      className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
                        file && isConnected
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg hover:shadow-indigo-500/25' 
                          : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {!isConnected ? 'Please connect wallet' : file ? 'Upload to IPFS' : 'Select a sound file'}
                    </button>
                  )}
                </div>
                
                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                  <h3 className="text-lg font-medium mb-4 text-gray-300">Why preserve sound capsules?</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-400">Permanently preserve precious local dialects and family voices</span>
                    </li>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-400">Bitcoin blockchain ensures sound memories never fade</span>
                    </li>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-400">Sound NFTs can serve as unique digital collectibles</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      
      <footer className="border-t border-gray-800 mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} Sound Capsule. Powered by Bitcoin blockchain and IPFS.
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Terms
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Privacy
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Documentation
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
