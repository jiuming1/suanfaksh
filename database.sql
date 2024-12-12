-- 创建数据库
CREATE DATABASE IF NOT EXISTS pathfinding_visualizer;
USE pathfinding_visualizer;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 搜索历史表
CREATE TABLE IF NOT EXISTS search_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    algorithm VARCHAR(20) NOT NULL,
    grid_size VARCHAR(20) NOT NULL,
    start_point VARCHAR(20) NOT NULL,
    end_point VARCHAR(20) NOT NULL,
    wall_positions TEXT,
    path_found BOOLEAN NOT NULL,
    path_length INT,
    steps_count INT,
    execution_time FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 用户设置表
CREATE TABLE IF NOT EXISTS user_settings (
    user_id INT PRIMARY KEY,
    theme VARCHAR(10) DEFAULT 'light',
    language VARCHAR(5) DEFAULT 'zh',
    grid_size VARCHAR(20) DEFAULT '20x20',
    animation_speed INT DEFAULT 50,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 创建索引
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_search_history_user ON search_history(user_id);
CREATE INDEX idx_search_history_algorithm ON search_history(algorithm); 