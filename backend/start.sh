#!/bin/bash

# 多模态数据生成器后端启动脚本

echo "🚀 启动多模态数据生成器后端服务..."

# 检查Python环境
if ! command -v python3 &> /dev/null; then
    echo "❌ 错误: 未找到 Python 3"
    exit 1
fi

# 创建虚拟环境（如果不存在）
if [ ! -d "venv" ]; then
    echo "📦 创建虚拟环境..."
    python3 -m venv venv
fi

# 激活虚拟环境
echo "🔧 激活虚拟环境..."
source venv/bin/activate

# 安装依赖（使用虚拟环境中的绝对路径）
echo "📚 安装依赖..."
venv/bin/pip install -r requirements.txt -q

# 前端依赖安装与开发服务启动（在项目根目录执行）
# 说明：根据你的需求，这里在项目根目录执行 `npm install` 和 `npm run dev`
# 异常：若系统未安装 npm，将跳过前端步骤且不影响后端启动
echo "🎨 初始化前端开发环境..."
cd ..
if command -v npm >/dev/null 2>&1; then
  # 仅在不存在 node_modules 时执行 npm install
  if [ -d "node_modules" ]; then
    echo "📦 已检测到 node_modules，跳过 npm install"
  else
    echo "📦 安装前端依赖 (npm install)..."
    npm install
  fi
  echo "▶️ 启动前端开发服务 (npm run dev)..."
  nohup npm run dev >/dev/null 2>&1 &
else
  echo "⚠️ 未找到 npm，跳过前端步骤"
fi
cd backend

# 启动服务（使用虚拟环境中的绝对路径）
echo "✅ 启动服务 (http://localhost:8000)"
echo "📖 API文档: http://localhost:8000/docs"
# 后端后台启动，日志重定向到 backend.log
# 若需要切换入口文件，可将 app.py 替换为自定义脚本
nohup venv/bin/python app.py > backend.log 2>&1 &

