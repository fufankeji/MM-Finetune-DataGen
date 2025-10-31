@echo off
REM 多模态数据生成器后端启动脚本 (Windows)

echo 🚀 启动多模态数据生成器后端服务...

REM 检查Python环境
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 未找到 Python
    exit /b 1
)

REM 创建虚拟环境（如果不存在）
if not exist venv (
    echo 📦 创建虚拟环境...
    python -m venv venv
)

REM 激活虚拟环境
echo 🔧 激活虚拟环境...
call venv\Scripts\activate.bat

REM 安装依赖
echo 📚 安装依赖...
pip install -r requirements.txt -q

REM 前端依赖安装与开发服务启动（在项目根目录执行）
REM 说明：根据你的需求，这里在项目根目录执行 `npm install` 和 `npm run dev`
REM 异常：若未安装 Node/npm，将跳过前端步骤且不影响后端启动
echo 🎨 初始化前端开发环境...
pushd ..
REM 仅在不存在 node_modules 时执行 npm install
if exist node_modules (
    echo 📦 已检测到 node_modules，跳过 npm install
) else (
    echo 📦 安装前端依赖 (npm install)...
    npm install
)
echo ▶️ 启动前端开发服务 (npm run dev)...
start "Frontend Dev Server" cmd /c "npm run dev"
popd

REM 启动服务
echo ✅ 启动服务 (http://localhost:8000)
echo 📖 API文档: http://localhost:8000/docs
REM 后端后台启动，日志输出到 backend.log
REM 说明：如需更换入口文件，将 app.py 替换为你的脚本
start "Backend Server" /B cmd /c "python app.py > backend.log 2>&1"

