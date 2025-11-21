# 🎯 LLM Provider Options: Complete Guide

## Overview

The workstation now supports **5 LLM providers** with both cloud-based and local/offline options, ensuring you can use AI-powered workflow features regardless of internet connectivity or budget.

---

## 🌐 Cloud Providers (Require API Keys)

### 1. OpenAI (GPT-4, GPT-3.5)

**Best For:** High-quality workflow generation, complex reasoning

**Setup:**
```bash
./one-click-deploy.sh
# Choose option 1
# Enter API key from https://platform.openai.com/api-keys
```

**Cost:** ~$0.03 per workflow generation

**Models:**
- `gpt-4` - Highest quality (default)
- `gpt-3.5-turbo` - Faster, lower cost

**Pros:**
- ✅ Best reasoning capabilities
- ✅ Largest context window
- ✅ Most reliable

**Cons:**
- ❌ Requires internet
- ❌ Pay per use
- ❌ Data sent to OpenAI

---

### 2. Anthropic (Claude 3 Opus, Sonnet)

**Best For:** Long-form workflow descriptions, detailed analysis

**Setup:**
```bash
./one-click-deploy.sh
# Choose option 2
# Enter API key from https://console.anthropic.com/
```

**Cost:** ~$0.05 per workflow generation

**Models:**
- `claude-3-opus-20240229` - Highest capability (default)
- `claude-3-sonnet-20240229` - Balanced quality/cost

**Pros:**
- ✅ Excellent at following instructions
- ✅ Strong code understanding
- ✅ Good for complex workflows

**Cons:**
- ❌ Requires internet
- ❌ Pay per use
- ❌ Data sent to Anthropic

---

## 💻 Local Providers (FREE, Works Offline)

### 3. Ollama (Qwen, Llama3, Mistral, CodeLlama)

**Best For:** Privacy-conscious users, offline work, unlimited usage

**Setup:**
```bash
# Install Ollama
curl https://ollama.ai/install.sh | sh

# Run deployment
./one-click-deploy.sh
# Choose option 3
# Select model (recommended: qwen2.5:7b or qwen2.5-coder:7b)

# Pull the model
ollama pull qwen2.5-coder:7b
```

**Cost:** FREE (hardware costs only)

**Recommended Qwen Models:**

**General Purpose:**
- `qwen2.5:0.5b` - Ultra-fast, minimal memory (500MB)
- `qwen2.5:1.5b` - Fast, good quality (1.5GB)
- `qwen2.5:7b` ⭐ **RECOMMENDED** - Best balance (7GB)
- `qwen2.5:32b` - Professional quality (32GB)
- `qwen2.5:72b` - Maximum capability (72GB)

**Code Specialized (Best for Workflows):**
- `qwen2.5-coder:1.5b` - Fast code generation
- `qwen2.5-coder:7b` ⭐ **RECOMMENDED** - Optimized for automation
- `qwen2.5-coder:32b` - Advanced code understanding

**Math Specialized:**
- `qwen2.5-math:1.5b/7b/72b` - Numerical workflows

**Other Popular Models:**
- `llama3` - Meta's flagship model
- `mistral` - Fast, efficient
- `codellama` - Code-focused

**Pros:**
- ✅ Completely FREE
- ✅ Works offline
- ✅ Full data privacy
- ✅ Unlimited usage
- ✅ Easy to switch models

**Cons:**
- ❌ Requires local hardware
- ❌ Slower than cloud on low-end hardware
- ❌ Model download required (1-70GB depending on model)

**Hardware Requirements:**
- Minimum: 8GB RAM (for 7b models)
- Recommended: 16GB RAM (for 7b models, smooth performance)
- Optimal: 32GB+ RAM (for 32b+ models)

---

### 4. LM Studio (Qwen, DeepSeek, Many More)

**Best For:** Users who want a GUI, easy model management

**Setup:**
```bash
# Download LM Studio from https://lmstudio.ai/

# Run deployment
./one-click-deploy.sh
# Choose option 4
# Enter model name

# In LM Studio:
# 1. Download model from catalog
# 2. Load model
# 3. Start local server (default: localhost:1234)
```

**Cost:** FREE (hardware costs only)

**Popular Models:**
- `qwen2.5-coder-32b-instruct` ⭐ **RECOMMENDED** - Excellent for automation
- `deepseek-coder-33b-instruct` - Great code understanding
- `llama-3-70b-instruct` - General purpose
- `mistral-7b-instruct` - Fast and efficient

**Pros:**
- ✅ Completely FREE
- ✅ Works offline
- ✅ GUI for model management
- ✅ Easy model switching
- ✅ Full data privacy
- ✅ OpenAI-compatible API

**Cons:**
- ❌ Requires local hardware
- ❌ Slower than cloud on low-end hardware
- ❌ Large model downloads

**Hardware Requirements:**
- Same as Ollama (see above)

---

## 📊 Comparison Table

| Provider | Cost | Internet Required | Privacy | Quality | Setup Complexity |
|----------|------|-------------------|---------|---------|------------------|
| OpenAI | $$ | Yes | Low | Excellent | Easy |
| Anthropic | $$$ | Yes | Low | Excellent | Easy |
| Ollama (Qwen) | FREE | No | Full | Good-Excellent* | Medium |
| LM Studio | FREE | No | Full | Good-Excellent* | Easy |

*Quality depends on model size (7b vs 32b vs 72b)

---

## 🎯 Choosing the Right Provider

### Use OpenAI if:
- You need the absolute best quality
- You have a budget for API calls
- You're always online
- You don't mind data being sent externally

### Use Anthropic if:
- You need strong instruction-following
- You work with long, complex workflows
- You have a budget for API calls
- You're always online

### Use Ollama if:
- You want FREE unlimited usage
- You need offline capability
- You have privacy requirements
- You're comfortable with CLI
- You have decent hardware (16GB+ RAM recommended)

### Use LM Studio if:
- You want FREE unlimited usage with GUI
- You need offline capability
- You prefer visual model management
- You have decent hardware (16GB+ RAM recommended)

---

## 🚀 Quick Start Examples

### Example 1: Developer on Budget (Use Ollama)

```bash
# Install Ollama
curl https://ollama.ai/install.sh | sh

# Deploy workstation
./one-click-deploy.sh
# Choose option 3: Ollama
# Enter: qwen2.5-coder:7b

# Download model
ollama pull qwen2.5-coder:7b

# Start using!
# Generate workflows with AI, zero cost
```

### Example 2: Enterprise User (Use OpenAI)

```bash
# Get API key from company account

# Deploy workstation
./one-click-deploy.sh
# Choose option 1: OpenAI
# Enter API key

# Start using immediately
# Best quality, predictable costs
```

### Example 3: Privacy-Focused User (Use LM Studio)

```bash
# Download LM Studio from https://lmstudio.ai/

# Deploy workstation
./one-click-deploy.sh
# Choose option 4: LM Studio
# Enter: qwen2.5-coder-32b-instruct

# In LM Studio:
# - Download qwen2.5-coder-32b-instruct
# - Load and start server

# All data stays on your machine
```

---

## 🔧 Configuration Examples

### Ollama (.env)
```env
LLM_ENABLED=true
LLM_PROVIDER=ollama
OLLAMA_URL=http://localhost:11434/api
LLM_MODEL=qwen2.5-coder:7b
LLM_TEMPERATURE=0.7
LLM_MAX_TOKENS=2000
```

### LM Studio (.env)
```env
LLM_ENABLED=true
LLM_PROVIDER=lmstudio
LMSTUDIO_URL=http://localhost:1234/v1
LLM_MODEL=qwen2.5-coder-32b-instruct
LLM_TEMPERATURE=0.7
LLM_MAX_TOKENS=2000
```

### OpenAI (.env)
```env
LLM_ENABLED=true
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
LLM_MODEL=gpt-4
LLM_TEMPERATURE=0.7
LLM_MAX_TOKENS=2000
```

---

## 💡 Tips & Best Practices

### For Ollama/LM Studio Users:

**Model Selection:**
- Start with 7b models (qwen2.5:7b or qwen2.5-coder:7b)
- Upgrade to 32b if you have 32GB+ RAM
- Use coder variants for better workflow generation

**Performance:**
- Run on SSD for faster model loading
- Close other heavy applications when using large models
- Use GPU acceleration if available (check Ollama docs)

**Switching Models:**
```bash
# Download new model
ollama pull qwen2.5:32b

# Update .env
LLM_MODEL=qwen2.5:32b

# Restart server
npm start
```

### For Cloud Users:

**Cost Management:**
- Use GPT-3.5 for simple workflows (cheaper)
- Cache common workflows
- Set reasonable rate limits

**Quality:**
- Use GPT-4/Claude-3-Opus for complex workflows
- Adjust temperature (0.3-0.7 for workflows)
- Test different prompts

---

## 📈 Performance Comparison

**Workflow Generation Speed:**
- OpenAI GPT-4: 2-5 seconds
- Anthropic Claude-3: 3-7 seconds
- Ollama qwen2.5:7b: 5-15 seconds (local, depends on hardware)
- Ollama qwen2.5:32b: 10-30 seconds (local, depends on hardware)
- LM Studio: Similar to Ollama (depends on model and hardware)

**Quality Ranking (Subjective):**
1. GPT-4 / Claude-3-Opus (tie)
2. qwen2.5:72b (local)
3. GPT-3.5 / qwen2.5:32b (tie)
4. Claude-3-Sonnet
5. qwen2.5:7b
6. qwen2.5:1.5b

---

## 🆘 Troubleshooting

### Ollama Issues

**"Model not found"**
```bash
ollama list  # Check installed models
ollama pull qwen2.5:7b  # Download if missing
```

**"Connection refused"**
```bash
# Check if Ollama is running
ollama serve

# Or restart Ollama service
systemctl restart ollama  # Linux
```

### LM Studio Issues

**"Server not responding"**
- Ensure LM Studio local server is started
- Check port 1234 is not in use
- Verify model is loaded in LM Studio

---

## 🔄 Switching Providers

You can easily switch between providers:

```bash
# Edit .env file
nano .env

# Change LLM_PROVIDER line
LLM_PROVIDER=ollama  # or openai, anthropic, lmstudio

# Restart server
npm start
```

Or re-run deployment:
```bash
./one-click-deploy.sh
# Choose different option
```

---

## ✅ Summary

**Best Overall:** Ollama with qwen2.5-coder:7b (FREE, offline, good quality)

**Best Quality:** OpenAI GPT-4 (paid, online)

**Best for Enterprise:** OpenAI (predictable, reliable) or Anthropic (detailed)

**Best for Privacy:** Ollama or LM Studio (100% local)

**Best for Beginners:** LM Studio (GUI makes it easy)

---

**All options are now available in the one-click deployment script!** 🚀
