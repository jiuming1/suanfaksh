const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 创建数据库连接
const db = new sqlite3.Database(path.join(__dirname, 'database.sqlite'), (err) => {
    if (err) {
        console.error('数据库连接失败:', err);
        return;
    }
    console.log('已连接到SQLite数据库');
});

// 创建表
db.serialize(() => {
    // 用户表
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            is_admin INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_login DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // 搜索历史表
    db.run(`
        CREATE TABLE IF NOT EXISTS search_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            algorithm TEXT NOT NULL,
            grid_size TEXT NOT NULL,
            start_point TEXT NOT NULL,
            end_point TEXT NOT NULL,
            wall_positions TEXT,
            path_found INTEGER NOT NULL,
            path_length INTEGER,
            steps_count INTEGER,
            execution_time REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);

    // 用户设置表
    db.run(`
        CREATE TABLE IF NOT EXISTS user_settings (
            user_id INTEGER PRIMARY KEY,
            theme TEXT DEFAULT 'light',
            language TEXT DEFAULT 'zh',
            grid_size TEXT DEFAULT '20x20',
            animation_speed INTEGER DEFAULT 50,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);

    // 验证码表
    db.run(`
        CREATE TABLE IF NOT EXISTS verification_codes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            code TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);

    console.log('数据库表创建完成');
});

// 创建索引
db.serialize(() => {
    db.run('CREATE INDEX IF NOT EXISTS idx_user_email ON users(email)');
    db.run('CREATE INDEX IF NOT EXISTS idx_search_history_user ON search_history(user_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_search_history_algorithm ON search_history(algorithm)');
    
    console.log('索引创建完成');
});

// 关闭数据库连接
db.close((err) => {
    if (err) {
        console.error('关闭数据库连接失败:', err);
        return;
    }
    console.log('数据库连接已关闭');
}); 