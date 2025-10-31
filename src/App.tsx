import { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Upload, Settings, FileText, Image as ImageIcon, BarChart3, Sparkles } from 'lucide-react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Textarea } from './components/ui/textarea';
import { Slider } from './components/ui/slider';
import { Progress } from './components/ui/progress';
import { Label } from './components/ui/label';

export default function App() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedModel, setSelectedModel] = useState('');
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [temperature, setTemperature] = useState([0.7]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [failureCount, setFailureCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const useDefaultTemplate = () => {
    setSystemPrompt('你是一个专业的图像分析助手。请详细描述图片中的内容，包括主要对象、场景、颜色、情感氛围等细节。');
  };

  const handleGenerate = async () => {
    if (selectedFiles.length === 0) {
      alert('请先上传图片');
      return;
    }
    
    if (!apiEndpoint) {
      alert('请输入模型接口地址');
      return;
    }
    
    if (!systemPrompt) {
      alert('请输入系统提示词');
      return;
    }
    
    setIsGenerating(true);
    setProgress(0);
    setSuccessCount(0);
    setFailureCount(0);
    
    try {
      // 1. 上传图片
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });
      
      const uploadResponse = await fetch('http://localhost:8000/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!uploadResponse.ok) {
        throw new Error('图片上传失败');
      }
      
      const uploadResult = await uploadResponse.json();
      setProgress(30);
      
      // 2. 生成数据
      const generateFormData = new FormData();
      generateFormData.append('api_endpoint', apiEndpoint);
      if (apiKey) {
        generateFormData.append('api_key', apiKey);
      }
      generateFormData.append('system_prompt', systemPrompt);
      generateFormData.append('temperature', temperature[0].toString());
      generateFormData.append('file_names', JSON.stringify(
        uploadResult.files.map((f: any) => f.saved_name)
      ));

      const fileMapping: Record<string, string> = {};
      uploadResult.files.forEach((f: any) => {
        fileMapping[f.saved_name] = f.original_name;
      });
      generateFormData.append('file_mapping', JSON.stringify(fileMapping));
      
      const generateResponse = await fetch('http://localhost:8000/api/generate', {
        method: 'POST',
        body: generateFormData,
      });
      
      if (!generateResponse.ok) {
        throw new Error('数据生成失败');
      }
      
      const generateResult = await generateResponse.json();
      setProgress(100);
      setSuccessCount(generateResult.success);
      setFailureCount(generateResult.failed);
      
      // 3. 自动下载生成的文件
      if (generateResult.output_file) {
        const downloadLink = document.createElement('a');
        downloadLink.href = `http://localhost:8000/api/download/${generateResult.output_file}`;
        downloadLink.download = generateResult.output_file;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        alert(`✅ 成功生成 ${generateResult.success} 条数据！文件已开始下载。`);
      }
      
    } catch (error) {
      console.error('生成失败:', error);
      alert(`❌ 生成失败: ${error instanceof Error ? error.message : '未知错误'}`);
      setFailureCount(selectedFiles.length);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{
      background: 'linear-gradient(135deg, #0E1A3B 0%, #1A2650 100%)'
    }}>
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-blue-400/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 container mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-white mb-2 flex items-center justify-center gap-3">
            <Sparkles className="w-8 h-8 text-blue-400" />
            多模态微调数据生成器
            <Sparkles className="w-8 h-8 text-blue-400" />
          </h1>
          <p className="text-blue-200/60">AI 驱动的智能数据标注平台</p>
        </motion.div>

        {/* Grid Layout: 2 rows × 3 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {/* Top Row - Card 1: Upload Images */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ y: -4 }}
            className="glass-card p-6 rounded-2xl backdrop-blur-xl border border-blue-400/20"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              boxShadow: '0 0 30px rgba(43, 111, 255, 0.15), inset 0 0 20px rgba(255, 255, 255, 0.05)',
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Upload className="w-5 h-5 text-blue-400" />
              <h3 className="text-white">上传图片</h3>
            </div>
            
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
                isDragging 
                  ? 'border-blue-400 bg-blue-400/10 shadow-[0_0_20px_rgba(43,111,255,0.3)]' 
                  : 'border-blue-400/30 hover:border-blue-400/60'
              }`}
            >
              <Upload className={`w-12 h-12 mx-auto mb-3 transition-colors ${
                isDragging ? 'text-blue-400' : 'text-blue-400/60'
              }`} />
              <p className="text-white/80 mb-1">拖拽图片到此处或点击上传</p>
              <p className="text-blue-200/50">支持 JPG/PNG/WebP</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
            
            <div className="mt-4 text-center">
              <p className="text-blue-200/70">
                已选择 <span className="text-blue-400">{selectedFiles.length}</span> 个文件
              </p>
            </div>
          </motion.div>

          {/* Top Row - Card 2: Model Configuration */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ y: -4 }}
            className="glass-card p-6 rounded-2xl backdrop-blur-xl border border-blue-400/20"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              boxShadow: '0 0 30px rgba(43, 111, 255, 0.15), inset 0 0 20px rgba(255, 255, 255, 0.05)',
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Settings className="w-5 h-5 text-blue-400" />
              <h3 className="text-white">模型配置</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label className="text-blue-200/80 mb-2 block">选择模型</Label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="bg-white/5 border-blue-400/30 text-white hover:border-blue-400/60 transition-colors">
                    <SelectValue placeholder="请选择模型" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A2650] border-blue-400/30">
                    <SelectItem value="gpt-4-vision">GPT-4 Vision</SelectItem>
                    <SelectItem value="claude-3">Claude 3 Opus</SelectItem>
                    <SelectItem value="gemini-pro">Gemini Pro Vision</SelectItem>
                    <SelectItem value="qwen-vl">通义千问 VL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-blue-200/80 mb-2 block">模型接口地址</Label>
                <Input
                  value={apiEndpoint}
                  onChange={(e) => setApiEndpoint(e.target.value)}
                  placeholder="https://api.example.com/v1"
                  className="bg-white/5 border-blue-400/30 text-white placeholder:text-blue-200/30 hover:border-blue-400/60 focus:border-blue-400 transition-colors"
                />
              </div>
              
              <div>
                <Label className="text-blue-200/80 mb-2 block">API Key（可选）</Label>
                <Input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="bg-white/5 border-blue-400/30 text-white placeholder:text-blue-200/30 hover:border-blue-400/60 focus:border-blue-400 transition-colors"
                />
                <p className="text-blue-200/40 mt-2">留空则使用环境变量中的密钥</p>
              </div>
            </div>
          </motion.div>

          {/* Top Row - Card 3: System Prompt and Parameters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ y: -4 }}
            className="glass-card p-6 rounded-2xl backdrop-blur-xl border border-blue-400/20"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              boxShadow: '0 0 30px rgba(43, 111, 255, 0.15), inset 0 0 20px rgba(255, 255, 255, 0.05)',
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-5 h-5 text-blue-400" />
              <h3 className="text-white">系统提示词与参数</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <Textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="输入系统提示词..."
                  rows={6}
                  className="bg-white/5 border-blue-400/30 text-white placeholder:text-blue-200/30 hover:border-blue-400/60 focus:border-blue-400 transition-colors resize-none"
                />
                <Button
                  onClick={useDefaultTemplate}
                  variant="ghost"
                  className="mt-2 text-blue-300 hover:text-blue-200 hover:bg-blue-400/10"
                >
                  使用默认模板
                </Button>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-blue-200/80">模型温度</Label>
                  <span className="text-blue-400">{temperature[0].toFixed(1)}</span>
                </div>
                <Slider
                  value={temperature}
                  onValueChange={setTemperature}
                  min={0}
                  max={1}
                  step={0.1}
                  className="cursor-pointer"
                />
                <div className="flex justify-between mt-1">
                  <span className="text-blue-200/40">0.0</span>
                  <span className="text-blue-200/40">1.0</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Bottom Row - Card 4: Image Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ y: -4 }}
            className="glass-card p-6 rounded-2xl backdrop-blur-xl border border-blue-400/20"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              boxShadow: '0 0 30px rgba(43, 111, 255, 0.15), inset 0 0 20px rgba(255, 255, 255, 0.05)',
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <ImageIcon className="w-5 h-5 text-blue-400" />
              <h3 className="text-white">图片预览</h3>
            </div>
            
            {selectedFiles.length > 0 ? (
              <div className="space-y-3">
                <div className="relative rounded-xl overflow-hidden bg-black/20 aspect-video border border-blue-400/20">
                  <img
                    src={URL.createObjectURL(selectedFiles[0])}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-blue-200/70">
                  <p className="truncate">{selectedFiles[0].name}</p>
                  <p className="mt-1">
                    {(selectedFiles[0].size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center border-2 border-dashed border-blue-400/20 rounded-xl">
                <div className="text-center">
                  <ImageIcon className="w-12 h-12 mx-auto mb-2 text-blue-400/40" />
                  <p className="text-blue-200/50">暂无图片</p>
                </div>
              </div>
            )}
          </motion.div>

          {/* Bottom Row - Card 5: Generation Progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ y: -4 }}
            className="glass-card p-6 rounded-2xl backdrop-blur-xl border border-blue-400/20"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              boxShadow: '0 0 30px rgba(43, 111, 255, 0.15), inset 0 0 20px rgba(255, 255, 255, 0.05)',
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              <h3 className="text-white">生成进度</h3>
            </div>
            
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-xl animate-pulse" />
                <Progress 
                  value={progress} 
                  className="h-6 relative bg-white/10"
                  style={{
                    boxShadow: progress > 0 ? '0 0 20px rgba(43, 111, 255, 0.5)' : 'none'
                  }}
                />
              </div>
              
              <div className="text-center">
                <p className="text-blue-400 mb-3">{progress.toFixed(0)}%</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-500/10 border border-green-400/30 rounded-lg p-3">
                    <p className="text-green-400">成功</p>
                    <p className="text-green-300">{successCount}</p>
                  </div>
                  <div className="bg-red-500/10 border border-red-400/30 rounded-lg p-3">
                    <p className="text-red-400">失败</p>
                    <p className="text-red-300">{failureCount}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Bottom Row - Card 6: Start Generation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            whileHover={{ y: -4 }}
            className="glass-card p-6 rounded-2xl backdrop-blur-xl border border-blue-400/20"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              boxShadow: '0 0 30px rgba(43, 111, 255, 0.15), inset 0 0 20px rgba(255, 255, 255, 0.05)',
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-5 h-5 text-blue-400" />
              <h3 className="text-white">执行任务</h3>
            </div>
            
            <div className="flex flex-col items-center justify-center h-48">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-2xl opacity-50 animate-pulse" />
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || selectedFiles.length === 0}
                  className="relative px-12 py-8 text-white rounded-2xl transition-all duration-300 disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, #2B6FFF 0%, #5F89FF 100%)',
                    boxShadow: '0 10px 40px rgba(43, 111, 255, 0.4), inset 0 0 20px rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <Sparkles className="w-6 h-6 mr-2 inline" />
                  {isGenerating ? '生成中...' : '开始生成'}
                </Button>
              </motion.div>
              
              <p className="text-blue-200/60 mt-6 text-center">
                {selectedFiles.length === 0 
                  ? '请先上传图片' 
                  : `准备处理 ${selectedFiles.length} 张图片`
                }
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&display=swap');
        
        * {
          font-family: 'Noto Sans SC', sans-serif;
        }
        
        .glass-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .glass-card:hover {
          box-shadow: 0 0 40px rgba(43, 111, 255, 0.25), inset 0 0 30px rgba(255, 255, 255, 0.08);
        }
      `}</style>
    </div>
  );
}
