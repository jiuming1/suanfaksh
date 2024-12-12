const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const email = process.argv[2];
if (!email) {
    console.error('请提供用户邮箱');
    process.exit(1);
}

const db = new sqlite3.Database(path.join(__dirname, '../db/database.sqlite'), async (err) => {
    if (err) {
        console.error('数据库连接失败:', err);
        process.exit(1);
    }

    try {
        // 更新用户为管理员
        await db.run('UPDATE users SET is_admin = 1 WHERE email = ?', [email]);
        console.log(`已将用户 ${email} 设置为管理员`);
    } catch (error) {
        console.error('设置管理员失败:', error);
    } finally {
        db.close();
    }
}); 