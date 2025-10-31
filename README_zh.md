<div align="center">
  <h1>多模态微调数据生成器</h1>
  <p><em>上传图片 生成 用于多模态微调的训练数据 JSONL</em></p>
  <span>中文 | <a href="./README.md">English</a></span>
</div>

## ⚡ 项目简介

本项目用于从图片生成用于多模态微调的训练数据（JSONL），附带前端操作页面。

## 👀 项目演示



## 🚀 使用指南

### 脚本一键启动
Linux/macOS 系统下，执行以下命令启动项目：
```bash
cd backend
bash start.sh
```
Windows 系统下，执行以下命令启动项目：
```bash
cd backend
start.bat
```

## 💡 常见问题

### Q: 支持哪些图片格式？
A: JPG、PNG、WebP，建议单张不超过10MB

### Q: 如何批量处理大量图片？
A: 一次可上传多张图片，建议每批不超过50张以保证稳定性

### Q: 生成的数据保存在哪里？
A: 后端服务器的 `backend/outputs/` 目录，同时会自动下载到你的电脑

### Q: 可以自定义数据格式吗？
A: 可以！修改 `backend/app.py` 中的 `create_training_data` 方法


## 🤝 贡献

欢迎提交 Issue 与 Pull Request 帮助改进项目（功能增强、Bug 修复、文档优化等）。

## 😎 技术交流
探索我们的技术社区 👉 [大模型技术社区丨赋范空间](https://kq4b3vgg5b.feishu.cn/wiki/JuJSwfbwmiwvbqkiQ7LcN1N1nhd)

扫描添加小可爱，加入技术交流群，与其他小伙伴一起交流学习。
<div align="center">
<img src="assets\交流群.jpg" width="200" alt="技术交流群二维码">
<div>

