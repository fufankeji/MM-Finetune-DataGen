"""
多模态微调数据生成器后端API

支持功能：
1. 图片上传
2. 调用视觉模型API生成图片描述
3. 生成JSONL格式训练数据
4. 数据下载
"""

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from typing import List, Optional
import os
import json
import base64
import httpx
from pathlib import Path
from datetime import datetime
import uuid

app = FastAPI(title="多模态数据生成器API", version="1.0.0")

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite默认端口
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 配置路径
BASE_DIR = Path(__file__).parent
UPLOAD_DIR = BASE_DIR / "uploads"
OUTPUT_DIR = BASE_DIR / "outputs"

# 确保目录存在
UPLOAD_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)


class DataGenerator:
    """数据生成器类"""
    
    def __init__(self):
        self.generated_data = []
        
    async def call_vision_api(
        self, 
        image_path: str, 
        api_endpoint: str, 
        api_key: Optional[str], 
        system_prompt: str,
        temperature: float = 0.7
    ) -> str:
        """
        调用视觉模型API - 支持多种API格式
        """
        try:
            # 读取图片并转换为base64
            with open(image_path, "rb") as f:
                image_base64 = base64.b64encode(f.read()).decode()
            
            # 根据API endpoint判断使用哪种格式
            if "dashscope" in api_endpoint or "qwen" in api_endpoint.lower():
                # ========== 通义千问VL格式 ==========
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {api_key}" if api_key else ""
                }
                
                payload = {
                    "model": "qwen3-vl-plus",  # 或 qwen-vl-max
                    "input": {
                        "messages": [
                            {
                                "role": "system",
                                "content": [{"text": system_prompt}]
                            },
                            {
                                "role": "user",
                                "content": [
                                    {"image": f"data:image/jpeg;base64,{image_base64}"},
                                    {"text": "请描述这张图片的内容"}
                                ]
                            }
                        ]
                    },
                    "parameters": {
                        "temperature": temperature
                    }
                }
                
                async with httpx.AsyncClient(timeout=60.0) as client:
                    response = await client.post(
                        api_endpoint,
                        headers=headers,
                        json=payload
                    )
                    response.raise_for_status()
                    result = response.json()
                    
                    # 通义千问的响应格式
                    description = result["output"]["choices"][0]["message"]["content"][0]["text"]
                    return description
                    
            else:
                # ========== OpenAI Vision格式（默认） ==========
                headers = {
                    "Content-Type": "application/json",
                }
                if api_key:
                    headers["Authorization"] = f"Bearer {api_key}"
                
                payload = {
                    "model": "gpt-4-vision-preview",
                    "messages": [
                        {
                            "role": "system",
                            "content": system_prompt
                        },
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "text",
                                    "text": "请描述这张图片的内容"
                                },
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:image/jpeg;base64,{image_base64}"
                                    }
                                }
                            ]
                        }
                    ],
                    "temperature": temperature,
                    "max_tokens": 500
                }
                
                async with httpx.AsyncClient(timeout=60.0) as client:
                    response = await client.post(
                        api_endpoint,
                        headers=headers,
                        json=payload
                    )
                    response.raise_for_status()
                    
                    result = response.json()
                    description = result["choices"][0]["message"]["content"]
                    return description
                    
        except Exception as e:
            # 打印详细错误信息便于调试
            print(f"❌ API调用失败: {str(e)}")
            import traceback
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"调用API失败: {str(e)}")
    
    def create_training_data(
    self, 
    image_filename: str,
    original_filename: str,  # 新增参数
    description: str
    ) -> dict:
        """
        创建训练数据格式
        
        Args:
            image_filename: 保存的文件名（UUID）
            original_filename: 原始文件名
            description: 图片描述
            
        Returns:
            训练数据字典
        """
        return {
            "messages": [
                {
                    "role": "user",
                    "content": "<image>请描述这张图片"
                },
                {
                    "role": "assistant",
                    "content": description
                }
            ],
            "images": [original_filename]  # 使用原始文件名
        }


# 全局数据生成器实例
data_generator = DataGenerator()


@app.get("/")
async def root():
    """健康检查"""
    return {"status": "ok", "message": "多模态数据生成器API运行中"}


@app.post("/api/upload")
async def upload_images(files: List[UploadFile] = File(...)):
    """
    上传图片
    
    Args:
        files: 图片文件列表
        
    Returns:
        上传成功的文件信息
    """
    uploaded_files = []
    
    for file in files:
        # 验证文件类型
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail=f"文件 {file.filename} 不是图片")
        
        # 生成唯一文件名
        file_ext = os.path.splitext(file.filename)[1]
        new_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = UPLOAD_DIR / new_filename
        
        # 保存文件
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        uploaded_files.append({
            "original_name": file.filename,
            "saved_name": new_filename,
            "size": len(content)
        })
    
    return {
        "success": True,
        "files": uploaded_files,
        "count": len(uploaded_files)
    }


@app.post("/api/generate")
async def generate_data(
    api_endpoint: str = Form(...),
    api_key: Optional[str] = Form(None),
    system_prompt: str = Form(...),
    temperature: float = Form(0.7),
    file_names: str = Form(...),
    file_mapping: str = Form("{}")  
):
    # ===== 添加这些调试日志 =====
    print("\n" + "="*60)
    print("🔍 开始生成数据...")
    print(f"📍 API端点: {api_endpoint}")
    print(f"🔑 API密钥: {'已提供' if api_key else '未提供'}")
    print(f"📝 系统提示词: {system_prompt[:50]}...")
    print(f"🌡️  温度: {temperature}")
    print("="*60 + "\n")
    # ===== 添加结束 =====
    """
    生成训练数据
    
    Args:
        api_endpoint: 模型API端点
        api_key: API密钥（可选）
        system_prompt: 系统提示词
        temperature: 温度参数
        file_names: 要处理的文件名列表（JSON字符串）
        
    Returns:
        生成结果统计
    """
    try:
        file_list = json.loads(file_names)
        print(f"📁 要处理的文件: {file_list}")
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="文件名列表格式错误")
    
    # 解析文件名映射
    try:
        print(f"🗺️  接收到的 file_mapping: {file_mapping}")
        mapping = json.loads(file_mapping)
        print(f"✅ 解析后的映射: {mapping}")
    except json.JSONDecodeError as e:
        print(f"❌ file_mapping 解析失败: {e}")
        mapping = {}  # 如果解析失败，使用空字典
    
    results = {
        "success": 0,
        "failed": 0,
        "details": []
    }
    generated_data = []
    
    for filename in file_list:
        file_path = UPLOAD_DIR / filename
        
        if not file_path.exists():
            results["failed"] += 1
            results["details"].append({
                "file": filename,
                "status": "failed",
                "error": "文件不存在"
            })
            continue
        
        try:
            print(f"\n🔄 正在处理文件: {filename}")
            
            # 调用视觉模型API
            description = await data_generator.call_vision_api(
                str(file_path),
                api_endpoint,
                api_key,
                system_prompt,
                temperature
            )
            
            print(f"✅ API 返回描述 (前100字符): {description[:100]}...")
            
            # 创建训练数据
            original_name = mapping.get(filename, filename)  # 获取原始文件名
            print(f"📝 使用原始文件名: {original_name}")
            
            training_data = data_generator.create_training_data(
                filename,
                original_name,  # 传递原始文件名
                description
            )
            generated_data.append(training_data)
            
            results["success"] += 1
            results["details"].append({
                "file": filename,
                "status": "success",
                "description": description
            })
            print(f"✅ 文件 {filename} 处理成功")
            
        except Exception as e:
            print(f"❌ 处理文件 {filename} 时出错: {str(e)}")
            import traceback
            traceback.print_exc()
            
            results["failed"] += 1
            results["details"].append({
                "file": filename,
                "status": "failed",
                "error": str(e)
            })
    
    # 保存生成的数据
    if generated_data:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = OUTPUT_DIR / f"train_{timestamp}.jsonl"
        
        print(f"\n💾 保存数据到: {output_file}")
        with open(output_file, "w", encoding="utf-8") as f:
            for item in generated_data:
                f.write(json.dumps(item, ensure_ascii=False) + "\n")
        
        results["output_file"] = output_file.name
        print(f"✅ 数据保存成功！成功: {results['success']}, 失败: {results['failed']}")
    else:
        print(f"⚠️  没有生成任何数据！失败: {results['failed']}")
    
    print("="*60 + "\n")
    return results


@app.get("/api/download/{filename}")
async def download_file(filename: str):
    """
    下载生成的训练数据
    
    Args:
        filename: 文件名
        
    Returns:
        文件下载响应
    """
    file_path = OUTPUT_DIR / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="文件不存在")
    
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="application/json"
    )


@app.get("/api/outputs")
async def list_outputs():
    """
    列出所有生成的输出文件
    
    Returns:
        输出文件列表
    """
    files = []
    for file_path in OUTPUT_DIR.glob("*.jsonl"):
        stat = file_path.stat()
        files.append({
            "name": file_path.name,
            "size": stat.st_size,
            "created_at": datetime.fromtimestamp(stat.st_ctime).isoformat()
        })
    
    files.sort(key=lambda x: x["created_at"], reverse=True)
    return {"files": files}


@app.delete("/api/uploads/{filename}")
async def delete_upload(filename: str):
    """
    删除上传的文件
    
    Args:
        filename: 文件名
        
    Returns:
        删除结果
    """
    file_path = UPLOAD_DIR / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="文件不存在")
    
    file_path.unlink()
    return {"success": True, "message": f"文件 {filename} 已删除"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

