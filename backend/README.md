# 后端API服务

多模态微调数据生成器的后端服务，基于 FastAPI 构建。

## 📦 安装

```bash
# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
# Linux/Mac:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt
```

## 🚀 运行

### 方式1: 使用启动脚本（推荐）

```bash
# Linux/Mac
bash start.sh

# Windows
start.bat
```

### 方式2: 直接运行

#### 生产模式（连接真实API）
```bash
python app.py
```

#### 演示模式（无需真实API）
```bash
python demo_mode.py
```

## 📋 模式说明

### 生产模式 (`app.py`)

- 连接真实的视觉模型API（GPT-4 Vision、Claude 3等）
- 生成真实的AI标注数据
- 需要配置API密钥

### 演示模式 (`demo_mode.py`)

- 使用模拟的图片描述
- 无需真实API密钥
- 适合快速测试和演示
- 完全离线运行

## 🔌 API端点

### 健康检查
```http
GET /
```

### 上传图片
```http
POST /api/upload
Content-Type: multipart/form-data

Body:
- files: 图片文件（支持多个）
```

### 生成数据
```http
POST /api/generate
Content-Type: multipart/form-data

Body:
- api_endpoint: API接口地址
- api_key: API密钥（可选）
- system_prompt: 系统提示词
- temperature: 温度参数
- file_names: 文件名JSON数组
```

### 下载文件
```http
GET /api/download/{filename}
```

### 列出输出文件
```http
GET /api/outputs
```

### 删除上传文件
```http
DELETE /api/uploads/{filename}
```

## 📁 目录结构

```
backend/
├── app.py              # 生产模式主程序
├── demo_mode.py        # 演示模式程序
├── requirements.txt    # Python依赖
├── start.sh           # Linux/Mac启动脚本
├── start.bat          # Windows启动脚本
├── uploads/           # 上传文件存储（自动创建）
├── outputs/           # 生成文件存储（自动创建）
└── README.md          # 本文档
```

## 🔧 配置

### 环境变量（可选）

创建 `.env` 文件：

```env
DEFAULT_API_ENDPOINT=https://api.openai.com/v1/chat/completions
DEFAULT_API_KEY=sk-...
DEFAULT_MODEL=gpt-4-vision-preview
```

### 支持的API

#### OpenAI GPT-4 Vision
```
端点: https://api.openai.com/v1/chat/completions
模型: gpt-4-vision-preview
```

#### Claude 3
```
端点: https://api.anthropic.com/v1/messages
模型: claude-3-opus-20240229
```

#### 通义千问VL
```
端点: https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation
模型: qwen-vl-plus
```

## 📝 开发说明

### 添加新的模型支持

在 `app.py` 的 `call_vision_api` 方法中添加新的API格式支持：

```python
async def call_vision_api(self, ...):
    # 根据不同API构建请求
    if "anthropic" in api_endpoint:
        # Claude格式
        payload = {...}
    elif "dashscope" in api_endpoint:
        # 通义千问格式
        payload = {...}
    else:
        # OpenAI格式
        payload = {...}
```

### 自定义数据格式

修改 `create_training_data` 方法以生成不同的数据格式：

```python
def create_training_data(self, image_filename, description):
    return {
        # 自定义你的数据格式
    }
```

## 🐛 故障排除

### 端口已被占用

```bash
# 查找占用端口的进程
lsof -i:8000  # Mac/Linux
netstat -ano | findstr 8000  # Windows

# 杀死进程或修改app.py中的端口
```

### API调用失败

1. 检查API端点是否正确
2. 验证API密钥是否有效
3. 确认API余额充足
4. 查看终端输出的错误信息

### 图片上传失败

1. 检查文件大小（默认限制100MB）
2. 确认文件格式是图片
3. 检查uploads目录权限

## 📊 性能优化

### 批量处理优化

```python
# 使用异步并发处理
import asyncio

results = await asyncio.gather(*[
    process_image(file) for file in files
])
```

### 缓存配置

```python
# 添加响应缓存
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
```

## 🔒 安全建议

1. **不要提交API密钥到版本控制**
2. **使用环境变量存储敏感信息**
3. **在生产环境启用HTTPS**
4. **添加请求频率限制**
5. **验证上传文件类型和大小**

## 📚 相关文档

- [FastAPI官方文档](https://fastapi.tiangolo.com/)
- [OpenAI API文档](https://platform.openai.com/docs/api-reference)
- [Claude API文档](https://docs.anthropic.com/claude/reference)
- [通义千问API文档](https://help.aliyun.com/document_detail/2712575.html)

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📄 许可证

MIT License

