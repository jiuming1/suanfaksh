const API_BASE_URL = '';

export class API {
    static token = null;

    static setToken(token) {
        this.token = token;
        localStorage.setItem('token', token);
    }

    static getToken() {
        if (!this.token) {
            this.token = localStorage.getItem('token');
        }
        return this.token;
    }

    static clearToken() {
        this.token = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }

    static async request(endpoint, options = {}) {
        const token = this.getToken();
        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...options.headers
        };

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...options,
                headers
            });

            let data;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                throw new Error('服务器返回格式错误，请稍后重试');
            }

            if (!response.ok) {
                // 如果是认证相关错误，清除token并重定向到登录页
                if (response.status === 401 || response.status === 403) {
                    this.clearToken();
                    if (window.location.pathname !== '/login.html') {
                        window.location.href = 'login.html';
                    }
                }
                throw new Error(data.error || '请求失败，请稍后重试');
            }

            return data;
        } catch (error) {
            if (error instanceof TypeError && error.message === 'Failed to fetch') {
                throw new Error('网络连接失败，请检查网络设置');
            }
            if (error.name === 'SyntaxError') {
                throw new Error('服务器响应格式错误，请稍后重试');
            }
            throw error;
        }
    }

    // 认证相关
    static async register(username, email, password) {
        try {
            // 基本验证
            if (!username || !email || !password) {
                throw new Error('请填写所有必需的字段');
            }

            // 用户名格式验证
            if (username.length < 3 || username.length > 20) {
                throw new Error('用户名长度必须在3-20个字符之间');
            }

            // 邮箱格式验证
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                throw new Error('请输入有效的邮箱地址');
            }

            // 密码强度验证
            if (password.length < 6) {
                throw new Error('密码长度必须至少为6个字符');
            }

            const response = await this.request('/api/auth/register', {
                method: 'POST',
                body: JSON.stringify({ username, email, password })
            });

            if (response.token) {
                this.setToken(response.token);
                localStorage.setItem('user', JSON.stringify(response.user));
            }

            return response;
        } catch (error) {
            throw new Error(error.message || '注册失败，请稍后重试');
        }
    }

    static async login(account, password) {
        try {
            // 基本验证
            if (!account || !password) {
                throw new Error('请输入账号和密码');
            }

            // 账号格式验证
            if (account.length < 3) {
                throw new Error('账号格���不正确');
            }

            const response = await this.request('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({ account, password })
            });
            
            if (response.token) {
                this.setToken(response.token);
                localStorage.setItem('user', JSON.stringify(response.user));
            }
            
            return response;
        } catch (error) {
            throw new Error(error.message || '登录失败，请稍后重试');
        }
    }

    static logout() {
        this.clearToken();
        window.location.href = 'login.html';
    }

    // 搜索历史相关
    static async getSearchHistory() {
        try {
            const response = await this.request('/api/history');
            return response.history || [];
        } catch (error) {
            console.error('获取历史记录失败:', error);
            throw new Error(error.message || '获取历史记录失败，请稍后重试');
        }
    }

    static async saveSearchHistory(historyData) {
        try {
            // 验证必要字段
            const requiredFields = ['algorithm', 'grid_size', 'start_point', 'end_point'];
            for (const field of requiredFields) {
                if (!historyData[field]) {
                    throw new Error('缺少必要的历史记录信息');
                }
            }

            const response = await this.request('/api/history', {
                method: 'POST',
                body: JSON.stringify(historyData)
            });
            return response;
        } catch (error) {
            console.error('保存历史记录失败:', error);
            throw new Error(error.message || '保存历史记录失败，请稍后重试');
        }
    }

    // 用户设置相关
    static async getSettings() {
        try {
            const response = await this.request('/api/settings');
            return response.settings || {};
        } catch (error) {
            console.error('获取设置失败:', error);
            throw new Error(error.message || '获取设置失败，请稍后重试');
        }
    }

    static async updateSettings(settings) {
        try {
            // 验证设置值
            if (settings.theme && !['light', 'dark'].includes(settings.theme)) {
                throw new Error('无效的主题设置');
            }
            if (settings.language && !['zh', 'en'].includes(settings.language)) {
                throw new Error('无效的语言设置');
            }
            if (settings.animation_speed && (settings.animation_speed < 1 || settings.animation_speed > 200)) {
                throw new Error('无效的动画速度设置');
            }

            const response = await this.request('/api/settings', {
                method: 'PUT',
                body: JSON.stringify(settings)
            });
            return response;
        } catch (error) {
            console.error('更新设置失败:', error);
            throw new Error(error.message || '更新设置失败，请稍后重试');
        }
    }

    // 密码重置相关
    static async sendVerificationCode(email) {
        try {
            // 验证邮箱格式
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                throw new Error('请输入有效的邮箱地址');
            }

            const response = await this.request('/api/auth/send-verification', {
                method: 'POST',
                body: JSON.stringify({ email })
            });
            return response;
        } catch (error) {
            throw new Error(error.message || '发送验证码失败，请稍后重试');
        }
    }

    static async resetPassword(email, verificationCode, newPassword) {
        try {
            // 验证验证码格式
            if (!/^\d{6}$/.test(verificationCode)) {
                throw new Error('请输入6位数字验证码');
            }

            // 验证密码强度
            if (newPassword.length < 6) {
                throw new Error('新密码长度必须至少为6个字符');
            }

            const response = await this.request('/api/auth/reset-password', {
                method: 'POST',
                body: JSON.stringify({
                    email,
                    verificationCode,
                    newPassword
                })
            });
            return response;
        } catch (error) {
            throw new Error(error.message || '重置密码失败，请稍后重试');
        }
    }
} 