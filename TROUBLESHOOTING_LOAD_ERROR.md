# Troubleshooting: Extension Load Error

## 错误信息
```
Extension "Multi-Platform Chat Bridge" failed to load: [object Event]
```

---

## 🔍 **获取详细错误信息**

### Step 1: 打开浏览器开发者工具

**Chrome / Edge / Brave:**
- 按 `F12` 或 `Ctrl+Shift+I` (Windows/Linux)
- 按 `Cmd+Option+I` (Mac)

**Firefox:**
- 按 `F12` 或 `Ctrl+Shift+K` (Windows/Linux)
- 按 `Cmd+Option+K` (Mac)

### Step 2: 查看 Console 标签

你应该看到类似这样的错误：

**常见错误类型 1: 模块未找到**
```
Failed to load module script: Expected a JavaScript module script but the server responded with a MIME type of "text/html"
GET http://localhost:8000/scripts/extensions/third-party/SillyTavern-Extension-ChatBridge/src/core/CharacterManager.js net::ERR_ABORTED 404 (Not Found)
```

**常见错误类型 2: 语法错误**
```
Uncaught SyntaxError: Unexpected token '<'
    at index-multiplatform.js:5
```

**常见错误类型 3: 导入路径错误**
```
Uncaught TypeError: Failed to resolve module specifier "./src/core/CharacterManager.js"
```

### Step 3: 复制完整错误信息

- 右键点击错误
- 选择 "Copy" 或 "Copy message"
- 或者截图发送

---

## 🔧 **可能的原因和解决方案**

### 原因 1: 使用了错误的分支 ⚠️

**问题**: 新功能在 `feature/character-session-management` 分支，但您可能在 `master` 分支

**症状**:
```
404 (Not Found): CharacterManager.js
404 (Not Found): CommandParser.js
```

**解决方案**:

#### Option A: 切换到 feature 分支（推荐用于测试）
```bash
cd /path/to/SillyTavern/data/default-user/extensions/third-party/SillyTavern-Extension-ChatBridge
git fetch origin
git checkout feature/character-session-management
```

#### Option B: 临时使用旧版本（等待 PR 合并）
```bash
cd /path/to/SillyTavern/data/default-user/extensions/third-party/SillyTavern-Extension-ChatBridge
git checkout master
```

然后在 SillyTavern UI 中：
- 点击扩展设置
- 找到 "Multi-Platform Chat Bridge"
- 将 `js` 入口改为 `index.js`（旧版本）

---

### 原因 2: 文件权限问题

**问题**: 文件没有读取权限

**检查**:
```bash
ls -la src/core/
```

**修复**:
```bash
chmod -R 755 src/
```

---

### 原因 3: Git 同步问题

**问题**: 文件没有正确同步到本地

**检查文件是否存在**:
```bash
ls -la src/core/CharacterManager.js
ls -la src/core/CommandParser.js
```

如果文件不存在：
```bash
git status
git pull origin feature/character-session-management
```

---

### 原因 4: 浏览器缓存

**问题**: 浏览器缓存了旧的脚本

**解决方案**:
1. 按 `Ctrl+F5` (Windows/Linux) 或 `Cmd+Shift+R` (Mac) 硬刷新
2. 或者清除浏览器缓存
3. 重启 SillyTavern 服务器

---

### 原因 5: SillyTavern 版本不兼容

**问题**: SillyTavern 版本太旧，不支持 ES6 模块

**检查 SillyTavern 版本**:
- 在 SillyTavern UI 右上角查看版本号
- 需要 1.10.0 或更高版本

**更新 SillyTavern**:
```bash
cd /path/to/SillyTavern
git pull
npm install
```

---

## 🚀 **快速诊断命令**

在扩展目录运行：

```bash
# 检查当前分支
git branch

# 检查文件是否存在
ls -la src/core/CharacterManager.js
ls -la src/core/CommandParser.js

# 检查文件内容开头（应该看到 export class）
head -20 src/core/CharacterManager.js
head -20 src/core/CommandParser.js

# 检查是否有未提交的更改
git status
```

---

## 📋 **正确的文件结构**

你的扩展目录应该包含：

```
SillyTavern-Extension-ChatBridge/
├── manifest.json
├── index-multiplatform.js (主入口)
├── index-multiplatform.html
├── src/
│   ├── core/
│   │   ├── CharacterManager.js      ← 必需（新）
│   │   ├── CommandParser.js         ← 必需（新）
│   │   ├── SessionManager.js
│   │   └── PlatformAdapter.js
│   └── adapters/
│       ├── TelegramAdapter.js
│       ├── DiscordAdapter.js
│       └── WeChatAdapter.js
├── ChatBridge_APIHijackForwarder.py
└── ...
```

---

## 🔄 **标准修复流程**

### 1. 确认分支
```bash
cd /path/to/extensions/SillyTavern-Extension-ChatBridge
git branch
```

**如果不在 feature/character-session-management:**
```bash
git checkout feature/character-session-management
```

### 2. 确认文件存在
```bash
ls src/core/CharacterManager.js src/core/CommandParser.js
```

**如果文件不存在:**
```bash
git pull origin feature/character-session-management
```

### 3. 刷新浏览器
- 按 `Ctrl+F5` (硬刷新)
- 或重启 SillyTavern

### 4. 检查控制台
- 打开 F12 开发者工具
- 查看 Console 标签
- 应该没有红色错误

---

## 📞 **如果问题仍然存在**

请提供以下信息：

1. **完整的控制台错误** (F12 → Console 标签的红色错误)
2. **当前分支**:
   ```bash
   git branch
   ```
3. **文件检查结果**:
   ```bash
   ls -la src/core/
   ```
4. **SillyTavern 版本** (UI 右上角)
5. **浏览器和版本** (例如：Chrome 120.0)

---

## 💡 **临时解决方案**

如果您想立即继续使用扩展（不使用新的角色管理功能）：

### 切换回旧版本：
```bash
git checkout master
```

### 修改 manifest.json:
```json
{
    "js": "index.js",
    ...
}
```

### 刷新 SillyTavern

这样可以使用 v2.0 的基本功能，等 PR 合并后再更新。

---

## ✅ **成功标志**

修复成功后，你应该看到：

**控制台 (Console):**
```
[Multi-Platform Chat Bridge] Extension loaded
[Multi-Platform Chat Bridge] Character manager initialized
[Multi-Platform Chat Bridge] Command parser initialized
```

**扩展 UI:**
- 扩展卡片正常显示
- "Multi-Platform Chat Bridge" 面板可以打开
- 没有红色错误提示

---

## 🎯 **最可能的原因（90%）**

你很可能需要：
```bash
git checkout feature/character-session-management
```

然后刷新浏览器 (`Ctrl+F5`)

这是因为新功能的文件还在 feature 分支，还没有合并到 master！
