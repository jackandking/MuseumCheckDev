/**
 * DeepSeek API Helper
 * Provides functions to interact with DeepSeek API for museum data validation
 */

class DeepSeekAPI {
    constructor() {
        this.apiEndpoint = 'https://api.deepseek.com/v1/chat/completions';
    }

    /**
     * Get the API key from localStorage
     * @returns {string|null} API key or null if not configured
     */
    getApiKey() {
        return localStorage.getItem('deepseekApiKey');
    }

    /**
     * Check if API key is configured
     * @returns {boolean} True if API key exists
     */
    hasApiKey() {
        const apiKey = this.getApiKey();
        return !!apiKey && apiKey.trim().length > 0;
    }

    /**
     * Call DeepSeek API with a prompt
     * @param {string} prompt - The prompt to send to DeepSeek
     * @returns {Promise<string>} The response text from DeepSeek
     */
    async callAPI(prompt) {
        const apiKey = this.getApiKey();
        
        if (!apiKey) {
            throw new Error('DeepSeek API Key 未配置，请在设置中配置 API Key');
        }

        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'deepseek-chat',
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 2000
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`API 调用失败 (${response.status}): ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error('API 返回数据格式错误');
            }

            return data.choices[0].message.content;
        } catch (error) {
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                throw new Error('网络错误，请检查网络连接');
            }
            throw error;
        }
    }

    /**
     * Validate museum treasures using DeepSeek AI
     * @param {string} museumName - Name of the museum
     * @param {Array<{name: string}>} treasures - Array of treasure objects with names
     * @returns {Promise<{isValid: boolean, invalidTreasures: string[], recommendations: Array<{name: string, description: string}>}>}
     */
    async validateTreasures(museumName, treasures) {
        if (!museumName || !treasures || treasures.length === 0) {
            throw new Error('博物馆名称和镇馆之宝列表不能为空');
        }

        const treasureNames = treasures.map(t => t.name).filter(name => name && name.trim());
        
        if (treasureNames.length === 0) {
            throw new Error('没有有效的镇馆之宝名称');
        }

        const prompt = `请验证以下信息是否准确：

博物馆名称：${museumName}

当前列出的镇馆之宝：
${treasureNames.map((name, i) => `${i + 1}. ${name}`).join('\n')}

请按以下格式回答：

1. 首先，判断这些文物是否确实是"${museumName}"的真实收藏（回答"是"或"否"）
2. 如果有不正确的，列出不正确的文物名称
3. 推荐至少3个该博物馆真实的、著名的镇馆之宝，每个包括：
   - 文物名称
   - 简短描述（一句话说明其重要性）

请用以下JSON格式回答：
{
  "allValid": true/false,
  "invalidTreasures": ["不正确的文物1", "不正确的文物2"],
  "recommendations": [
    {
      "name": "文物名称1",
      "description": "简短描述"
    },
    {
      "name": "文物名称2", 
      "description": "简短描述"
    },
    {
      "name": "文物名称3",
      "description": "简短描述"
    }
  ]
}

注意：只返回JSON，不要有其他文字。`;

        try {
            const responseText = await this.callAPI(prompt);
            
            // Try to extract JSON from response
            let jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                // Try to parse the whole response as JSON
                try {
                    const parsed = JSON.parse(responseText);
                    return this.parseValidationResponse(parsed);
                } catch (e) {
                    throw new Error('AI 返回的格式不正确，无法解析');
                }
            }

            const jsonStr = jsonMatch[0];
            const result = JSON.parse(jsonStr);
            
            return this.parseValidationResponse(result);
        } catch (error) {
            console.error('验证失败:', error);
            throw error;
        }
    }

    /**
     * Parse and validate the response from DeepSeek
     * @param {Object} result - Parsed JSON response
     * @returns {Object} Validated response object
     */
    parseValidationResponse(result) {
        // Ensure the response has the expected structure
        const response = {
            isValid: !!result.allValid,
            invalidTreasures: Array.isArray(result.invalidTreasures) ? result.invalidTreasures : [],
            recommendations: Array.isArray(result.recommendations) ? result.recommendations : []
        };

        // Ensure recommendations have the right structure
        response.recommendations = response.recommendations
            .filter(rec => rec && typeof rec === 'object' && rec.name)
            .map(rec => ({
                name: rec.name,
                description: rec.description || ''
            }));

        // Ensure at least 3 recommendations
        if (response.recommendations.length < 3) {
            throw new Error('AI 推荐的镇馆之宝少于3个，请重试');
        }

        return response;
    }

    /**
     * Quick test of API connection
     * @returns {Promise<boolean>} True if API is working
     */
    async testConnection() {
        try {
            const response = await this.callAPI('你好，请回复"测试成功"');
            return response.includes('测试成功') || response.includes('成功') || response.length > 0;
        } catch (error) {
            console.error('API 连接测试失败:', error);
            return false;
        }
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DeepSeekAPI;
}
