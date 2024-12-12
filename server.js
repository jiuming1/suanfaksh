const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const db = require('./db/database');

const app = express();
const PORT = process.env.PORT || 3000;

// JWT密钥
const JWT_SECRET = 'your-secret-key';  // 在生产环境中应该使用环境变量

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    res.status(500).json({
        error: '服务器内部错误，请稍后重试'
    });
});

// 中间件：验证JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: '请先登录' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: '登录已过期，请重新登录' });
        }
        req.user = user;
        next();
    });
};

// 验证管理员权限的中间件
async function authenticateAdmin(req, res, next) {
    try {
        // 首先验证token
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ error: '未登录' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        
        // 验证用户是否是管理员
        const user = await db.get('SELECT is_admin FROM users WHERE id = ?', [decoded.userId]);
        
        if (!user || !user.is_admin) {
            return res.status(403).json({ error: '无管理员权限' });
        }

        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: '无效的token' });
    }
}

// API路由
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // 验证必要字段
        if (!username || !email || !password) {
            return res.status(400).json({ error: '请填写所有必需的字段' });
        }

        // 验证用户名格式
        if (username.length < 3 || username.length > 20) {
            return res.status(400).json({ error: '用户名长度必须在3-20个字符之间' });
        }

        // 验证邮箱格式
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: '请输入有效的邮箱地址' });
        }

        // 验证密码强度
        if (password.length < 6) {
            return res.status(400).json({ error: '密码长度必须至少为6个字符' });
        }

        // 检查用户名或邮箱是否已存在
        const existingUser = await db.get(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existingUser) {
            return res.status(400).json({ error: '用户名或邮箱已被注册' });
        }

        // 加密密码
        const hashedPassword = await bcrypt.hash(password, 10);

        // 创建新用户
        const result = await db.run(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
            [username, email, hashedPassword]
        );

        // 创建用户设置
        await db.run(
            'INSERT INTO user_settings (user_id) VALUES (?)',
            [result.id]
        );

        // 生成JWT token
        const token = jwt.sign(
            { userId: result.id, username },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: '注册成功',
            token,
            user: {
                id: result.id,
                username,
                email
            }
        });
    } catch (error) {
        console.error('注册错误:', error);
        res.status(500).json({ error: '注册失败，请稍后重试' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { account, password } = req.body;

        // 验证必要字段
        if (!account || !password) {
            return res.status(400).json({ error: '请输入账号和密码' });
        }

        // 验证账号格式
        if (account.length < 3) {
            return res.status(400).json({ error: '账号格式不正确' });
        }

        // 查找用户（支持用户名或邮箱登录）
        const user = await db.get(
            'SELECT id, username, email, password_hash FROM users WHERE username = ? OR email = ?',
            [account, account]
        );

        if (!user) {
            return res.status(401).json({ error: '账号或密码错误' });
        }

        // 验证密码
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: '账号或密码错误' });
        }

        // 更新最后登录时间
        await db.run(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
            [user.id]
        );

        // 生成JWT token
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // 获取用户设置
        const settings = await db.get(
            'SELECT theme, language, grid_size, animation_speed FROM user_settings WHERE user_id = ?',
            [user.id]
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                settings
            }
        });
    } catch (error) {
        console.error('登录错误:', error);
        res.status(500).json({ error: '登录失败，请稍后重试' });
    }
});

// 搜索历史相关路由
app.get('/api/history', authenticateToken, async (req, res) => {
    try {
        const history = await db.all(
            'SELECT * FROM search_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 10',
            [req.user.userId]
        );
        res.json({ history });
    } catch (error) {
        console.error('获取历史记录失败:', error);
        res.status(500).json({ error: '获取历史记录失败，请稍后重试' });
    }
});

app.post('/api/history', authenticateToken, async (req, res) => {
    try {
        const {
            algorithm,
            grid_size,
            start_point,
            end_point,
            wall_positions,
            path_found,
            path_length,
            steps_count,
            execution_time
        } = req.body;

        // 验证必要字段
        if (!algorithm || !grid_size || !start_point || !end_point) {
            return res.status(400).json({ error: '缺少必要的历史记录信息' });
        }

        await db.run(
            `INSERT INTO search_history 
            (user_id, algorithm, grid_size, start_point, end_point, 
             wall_positions, path_found, path_length, steps_count, execution_time)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                req.user.userId,
                algorithm,
                grid_size,
                start_point,
                end_point,
                wall_positions,
                path_found,
                path_length,
                steps_count,
                execution_time
            ]
        );

        res.json({ message: '历史记录保存成功' });
    } catch (error) {
        console.error('保存历史记录失败:', error);
        res.status(500).json({ error: '保存历史记录失败，请稍后重试' });
    }
});

// 用户设置相关路由
app.get('/api/settings', authenticateToken, async (req, res) => {
    try {
        const settings = await db.get(
            'SELECT theme, language, grid_size, animation_speed FROM user_settings WHERE user_id = ?',
            [req.user.userId]
        );
        
        if (!settings) {
            // 如果没有找到设置，创建默认设置
            const defaultSettings = {
                theme: 'light',
                language: 'zh',
                grid_size: '20x20',
                animation_speed: 50
            };

            await db.run(
                `INSERT INTO user_settings (user_id, theme, language, grid_size, animation_speed)
                VALUES (?, ?, ?, ?, ?)`,
                [req.user.userId, defaultSettings.theme, defaultSettings.language, 
                 defaultSettings.grid_size, defaultSettings.animation_speed]
            );

            return res.json({ settings: defaultSettings });
        }
        
        res.json({ settings });
    } catch (error) {
        console.error('获取设置失败:', error);
        res.status(500).json({ error: '获取设置失败，请稍后重试' });
    }
});

app.put('/api/settings', authenticateToken, async (req, res) => {
    try {
        const allowedFields = ['theme', 'language', 'grid_size', 'animation_speed'];
        const updates = [];
        const params = [];

        // 验证设置字段
        for (const [key, value] of Object.entries(req.body)) {
            if (allowedFields.includes(key)) {
                if (key === 'theme' && !['light', 'dark'].includes(value)) {
                    return res.status(400).json({ error: '无效的主题设置' });
                }
                if (key === 'language' && !['zh', 'en'].includes(value)) {
                    return res.status(400).json({ error: '无效的语言设置' });
                }
                if (key === 'animation_speed' && (value < 1 || value > 200)) {
                    return res.status(400).json({ error: '无效的动画速度设置' });
                }
                updates.push(`${key} = ?`);
                params.push(value);
            }
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: '没有有效的更新字段' });
        }

        params.push(req.user.userId);
        const sql = `UPDATE user_settings SET ${updates.join(', ')} WHERE user_id = ?`;

        await db.run(sql, params);
        res.json({ message: '设置更新成功' });
    } catch (error) {
        console.error('更新设置失败:', error);
        res.status(500).json({ error: '更新设置失败，请稍后重试' });
    }
});

// 发送验证码
app.post('/api/auth/send-verification', async (req, res) => {
    try {
        const { email } = req.body;

        // 验证邮箱格式
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: '请输入有效的邮箱地址' });
        }

        // 检查邮箱是否存在
        const user = await db.get('SELECT id FROM users WHERE email = ?', [email]);
        if (!user) {
            return res.status(404).json({ error: '该邮箱未注册' });
        }

        // 生成6位随机验证码
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        // 将验证码保存到数据库（这里应该有过期时间）
        await db.run(
            `INSERT INTO verification_codes (user_id, code, expires_at) 
             VALUES (?, ?, datetime('now', '+30 minutes'))`,
            [user.id, verificationCode]
        );

        // TODO: 发送验证码到用户邮箱
        // 这里应该集成邮件发送服务
        console.log('验证码:', verificationCode);

        res.json({ message: '验证码已发送' });
    } catch (error) {
        console.error('发送验证码失败:', error);
        res.status(500).json({ error: '发送验证码失败，请稍后重试' });
    }
});

// 重置密码
app.post('/api/auth/reset-password', async (req, res) => {
    try {
        const { email, verificationCode, newPassword } = req.body;

        // 验证必要字段
        if (!email || !verificationCode || !newPassword) {
            return res.status(400).json({ error: '请填写所有必需的字段' });
        }

        // 验证码格式检查
        if (!/^\d{6}$/.test(verificationCode)) {
            return res.status(400).json({ error: '验证码格式不正确' });
        }

        // 密码强��检查
        if (newPassword.length < 6) {
            return res.status(400).json({ error: '新密码长度必须至少为6个字符' });
        }

        // 获取用户信息
        const user = await db.get('SELECT id FROM users WHERE email = ?', [email]);
        if (!user) {
            return res.status(404).json({ error: '用户不存在' });
        }

        // 验证验证码
        const validCode = await db.get(
            `SELECT id FROM verification_codes 
             WHERE user_id = ? AND code = ? AND expires_at > datetime('now') 
             ORDER BY created_at DESC LIMIT 1`,
            [user.id, verificationCode]
        );

        if (!validCode) {
            return res.status(400).json({ error: '验证码无效或已过期' });
        }

        // 更新密码
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.run(
            'UPDATE users SET password_hash = ? WHERE id = ?',
            [hashedPassword, user.id]
        );

        // 删除已使用的验证码
        await db.run(
            'DELETE FROM verification_codes WHERE user_id = ? AND code = ?',
            [user.id, verificationCode]
        );

        res.json({ message: '密码重置成功' });
    } catch (error) {
        console.error('重置密码失败:', error);
        res.status(500).json({ error: '重置密码失败，请稍后重试' });
    }
});

// 管理员统计API
app.get('/api/admin/stats', authenticateAdmin, async (req, res) => {
    try {
        // 获取总用户数
        const totalUsersResult = await db.get('SELECT COUNT(*) as count FROM users');
        
        // 获取今日注册用户数
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayRegistrationsResult = await db.get(
            'SELECT COUNT(*) as count FROM users WHERE created_at >= ?',
            [todayStart.toISOString()]
        );
        
        // 获取今日登录用户数
        const todayLoginsResult = await db.get(
            'SELECT COUNT(DISTINCT user_id) as count FROM search_history WHERE created_at >= ?',
            [todayStart.toISOString()]
        );
        
        // 获取最近7天活跃用户数
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const activeUsersResult = await db.get(
            'SELECT COUNT(DISTINCT user_id) as count FROM search_history WHERE created_at >= ?',
            [sevenDaysAgo.toISOString()]
        );
        
        // 获取最近30天的注册数据
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const registrationData = await db.all(`
            SELECT DATE(created_at) as date, COUNT(*) as count 
            FROM users 
            WHERE created_at >= ? 
            GROUP BY DATE(created_at)
            ORDER BY date`,
            [thirtyDaysAgo.toISOString()]
        );
        
        // 获取最近30天的登录数据
        const loginData = await db.all(`
            SELECT DATE(created_at) as date, COUNT(DISTINCT user_id) as count 
            FROM search_history 
            WHERE created_at >= ? 
            GROUP BY DATE(created_at)
            ORDER BY date`,
            [thirtyDaysAgo.toISOString()]
        );
        
        // 获取所有用户基本信息
        const users = await db.all(`
            SELECT username, email, created_at, last_login 
            FROM users 
            ORDER BY created_at DESC 
            LIMIT 100`
        );

        // 处理图表数据
        const dates = [];
        const registrations = [];
        const logins = [];
        
        let currentDate = new Date(thirtyDaysAgo);
        while (currentDate <= new Date()) {
            const dateStr = currentDate.toISOString().split('T')[0];
            dates.push(dateStr);
            
            const regCount = registrationData.find(d => d.date === dateStr)?.count || 0;
            const loginCount = loginData.find(d => d.date === dateStr)?.count || 0;
            
            registrations.push(regCount);
            logins.push(loginCount);
            
            currentDate.setDate(currentDate.getDate() + 1);
        }

        res.json({
            totalUsers: totalUsersResult.count,
            todayRegistrations: todayRegistrationsResult.count,
            todayLogins: todayLoginsResult.count,
            activeUsers: activeUsersResult.count,
            registrationChart: {
                labels: dates,
                data: registrations
            },
            loginChart: {
                labels: dates,
                data: logins
            },
            users: users
        });
    } catch (error) {
        console.error('获取统计数据失败:', error);
        res.status(500).json({ error: '获取统计数据失败' });
    }
});

// 添加设置管理员权限的API
app.post('/api/admin/set-admin', authenticateAdmin, async (req, res) => {
    try {
        const { userId, isAdmin } = req.body;
        await db.run('UPDATE users SET is_admin = ? WHERE id = ?', [isAdmin ? 1 : 0, userId]);
        res.json({ message: '权限更新成功' });
    } catch (error) {
        console.error('更新管理员权限失败:', error);
        res.status(500).json({ error: '更新管理员权限失败' });
    }
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
}); 