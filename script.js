// Supabase 客户端配置
const SUPABASE_URL = 'https://ryaazptmvtfkazcpiznd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_kiEpbOW96wm-bOzzzNv1bg_W8TZA8_G';

// Supabase 客户端（在 DOMContentLoaded 中初始化）
let supabaseClient = null;

// API 配置（从数据库加载）
let apiConfig = {
    apiUrl: '',
    apiKey: '',
    modelName: 'glm-4.7',
    supabaseUrl: '',
    supabaseKey: ''
};

// DOM 元素
const settingsBtn = document.getElementById('settingsBtn');
const settingsPanel = document.getElementById('settingsPanel');
const chatPage = document.getElementById('chatPage');
const saveConfigBtn = document.getElementById('saveConfigBtn');
const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');

// 输入框
const apiUrlInput = document.getElementById('apiUrl');
const apiKeyInput = document.getElementById('apiKey');
const modelNameInput = document.getElementById('modelName');
const supabaseUrlInput = document.getElementById('supabaseUrl');
const supabaseKeyInput = document.getElementById('supabaseKey');

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
    // 初始化 Supabase 客户端
    try {
        if (typeof supabase !== 'undefined') {
            const { createClient } = supabase;
            supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
            console.log('✅ Supabase 客户端初始化成功');
        } else {
            console.error('❌ Supabase 库未加载');
        }
    } catch (error) {
        console.error('❌ Supabase 初始化错误:', error);
    }

    // 绑定事件
    settingsBtn.addEventListener('click', toggleSettings);
    saveConfigBtn.addEventListener('click', saveConfig);
    cancelSettingsBtn.addEventListener('click', closeSettings);
    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // 从数据库加载配置
    await loadConfig();
    
    // 如果配置面板需要显示，确保它可见
    if (settingsPanel.classList.contains('active')) {
        settingsPanel.style.display = 'block';
        chatPage.classList.add('hidden');
    }
});

// 切换设置面板
function toggleSettings() {
    const isActive = settingsPanel.classList.contains('active');
    if (isActive) {
        closeSettings();
    } else {
        openSettings();
    }
}

// 打开设置面板
function openSettings() {
    settingsPanel.style.display = 'block';
    settingsPanel.classList.add('active');
    chatPage.classList.add('hidden');
    
    // 填充当前配置
    apiUrlInput.value = apiConfig.apiUrl || '';
    apiKeyInput.value = apiConfig.apiKey || '';
    modelNameInput.value = apiConfig.modelName || 'glm-4.7';
    
    // Supabase 配置已在代码中设置，显示为只读或隐藏
    supabaseUrlInput.value = SUPABASE_URL;
    supabaseKeyInput.value = SUPABASE_KEY;
    // 可选：设置为只读，因为已在代码中配置
    supabaseUrlInput.readOnly = true;
    supabaseKeyInput.readOnly = true;
}

// 关闭设置面板
function closeSettings() {
    settingsPanel.classList.remove('active');
    chatPage.classList.remove('hidden');
}

// 保存配置
async function saveConfig() {
    const config = {
        api_url: apiUrlInput.value.trim(),
        api_key: apiKeyInput.value.trim(),
        model_name: modelNameInput.value.trim() || 'glm-4.7',
        supabase_url: SUPABASE_URL, // 使用代码中配置的 Supabase URL
        supabase_key: SUPABASE_KEY  // 使用代码中配置的 Supabase Key
    };

    // 验证必填项
    if (!config.api_url || !config.api_key) {
        alert('请填写 API 地址和 API 密钥！');
        return;
    }

    if (!supabaseClient) {
        alert('Supabase 客户端未初始化，请检查配置！');
        return;
    }

    try {
        // 保存配置到数据库（Supabase 已在代码中配置）
        const { data, error } = await supabaseClient
            .from('api_config')
            .upsert({
                id: 1, // 使用固定ID，只保存一份配置
                api_url: config.api_url,
                api_key: config.api_key,
                model_name: config.model_name,
                supabase_url: config.supabase_url,
                supabase_key: config.supabase_key,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'id'
            });

        if (error) {
            throw error;
        }

        // 更新本地配置
        apiConfig = {
            apiUrl: config.api_url,
            apiKey: config.api_key,
            modelName: config.model_name,
            supabaseUrl: config.supabase_url,
            supabaseKey: config.supabase_key
        };

        // 关闭设置面板并隐藏（配置完成后不再显示）
        settingsPanel.classList.remove('active');
        settingsPanel.style.display = 'none';
        chatPage.classList.remove('hidden');

        // 显示成功消息
        addMessage('配置已保存成功！💕 现在可以开始聊天了～', 'bot');
    } catch (error) {
        console.error('保存配置错误:', error);
        alert('保存配置失败：' + error.message);
    }
}

// 从数据库加载配置
async function loadConfig() {
    try {
        // Supabase 客户端已在代码顶部初始化
        if (!supabaseClient) {
            console.error('Supabase 客户端未初始化');
            settingsPanel.style.display = 'block';
            openSettings();
            return;
        }

        // 从数据库加载 API 配置
        const { data, error } = await supabaseClient
            .from('api_config')
            .select('*')
            .eq('id', 1)
            .single();

        if (data && !error && data.api_url && data.api_key) {
            // 配置完整，加载配置并隐藏设置面板
            apiConfig = {
                apiUrl: data.api_url || '',
                apiKey: data.api_key || '',
                modelName: data.model_name || 'glm-4.7',
                supabaseUrl: SUPABASE_URL,
                supabaseKey: SUPABASE_KEY
            };

            // 隐藏设置面板，显示聊天页面
            settingsPanel.style.display = 'none';
            settingsPanel.classList.remove('active');
            chatPage.classList.remove('hidden');
        } else {
            // 配置不完整或不存在，显示设置面板
            settingsPanel.style.display = 'block';
            openSettings();
        }
    } catch (error) {
        console.error('加载配置错误:', error);
        // 出错时显示设置面板
        settingsPanel.style.display = 'block';
        openSettings();
    }
}

// 发送消息
async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    // 检查配置
    if (!apiConfig.apiUrl || !apiConfig.apiKey) {
        alert('请先配置 API 信息！');
        openSettings();
        return;
    }

    // 显示用户消息
    addMessage(message, 'user');
    userInput.value = '';
    sendButton.disabled = true;

    // 显示打字指示器
    showTypingIndicator();

    try {
        // 构建消息历史
        const messages = getChatHistory();

        // 调用 API
        const response = await fetch(apiConfig.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiConfig.apiKey}`
            },
            body: JSON.stringify({
                model: apiConfig.modelName,
                messages: messages,
                thinking: {
                    type: 'enabled'
                },
                max_tokens: 65536,
                temperature: 1.0
            })
        });

        if (!response.ok) {
            throw new Error(`API 请求失败: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // 移除打字指示器
        removeTypingIndicator();

        // 获取 AI 回复
        if (data.choices && data.choices.length > 0) {
            const aiReply = data.choices[0].message.content;
            addMessage(aiReply, 'bot');

            // 保存对话到数据库
            await saveChatHistory(message, aiReply);
        } else {
            throw new Error('API 返回格式异常');
        }
    } catch (error) {
        console.error('发送消息错误:', error);
        removeTypingIndicator();
        addMessage('抱歉，发生了错误：' + error.message + ' 😢', 'bot');
    } finally {
        sendButton.disabled = false;
    }
}

// 获取聊天历史（用于 API 调用）
function getChatHistory() {
    const messages = [
        {
            role: 'system',
            content: '你是一名专业的英雄联盟游戏顾问，专门帮助玩家推荐适合的英雄。请用友好、可爱的语气回复玩家。'
        }
    ];

    // 从聊天界面获取历史消息
    const messageElements = chatMessages.querySelectorAll('.message');
    messageElements.forEach(msg => {
        const isUser = msg.classList.contains('user-message');
        const content = msg.querySelector('.message-content p')?.textContent || 
                       msg.querySelector('.message-content')?.textContent || '';
        
        if (content.trim()) {
            messages.push({
                role: isUser ? 'user' : 'assistant',
                content: content.trim()
            });
        }
    });

    return messages;
}

// 保存聊天历史到数据库
async function saveChatHistory(userMessage, botReply) {
    if (!supabaseClient) return;

    try {
        await supabaseClient
            .from('chat_history')
            .insert({
                user_message: userMessage,
                bot_reply: botReply,
                created_at: new Date().toISOString()
            });
    } catch (error) {
        console.error('保存聊天历史错误:', error);
    }
}

// 添加消息到聊天界面
function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;

    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.textContent = sender === 'user' ? '👤' : '🌸';

    const content = document.createElement('div');
    content.className = 'message-content';
    
    // 处理换行和文本格式
    if (text.includes('\n')) {
        const lines = text.split('\n');
        lines.forEach((line) => {
            if (line.trim()) {
                const p = document.createElement('p');
                p.textContent = line.trim();
                content.appendChild(p);
            }
        });
    } else {
        const p = document.createElement('p');
        p.textContent = text;
        content.appendChild(p);
    }

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
    chatMessages.appendChild(messageDiv);

    // 滚动到底部
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 显示打字指示器
function showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'message bot-message typing-indicator';
    indicator.id = 'typingIndicator';
    indicator.innerHTML = `
        <div class="avatar">🌸</div>
        <div class="message-content">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;
    chatMessages.appendChild(indicator);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 移除打字指示器
function removeTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.remove();
    }
}

// 注意：用户需要在代码中配置 Supabase 的 Publishable Key 和 Project URL
// 可以在保存配置时，将 Supabase 配置保存到 localStorage，然后在这里初始化
// 或者用户可以直接在代码中硬编码（不推荐）
