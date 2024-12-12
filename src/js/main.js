import { Grid } from './components/Grid.js';
import { AStar } from './algorithms/AStar.js';
import { Dijkstra } from './algorithms/Dijkstra.js';
import { BFS } from './algorithms/BFS.js';
import { DFS } from './algorithms/DFS.js';

// 语言配置
const translations = {
    zh: {
        title: '路径搜索算法可视化',
        algorithm: '选择算法：',
        algorithms: {
            astar: 'A* 算法',
            dijkstra: 'Dijkstra 算法',
            bfs: '广度优先搜索 (BFS)',
            dfs: '深度优先搜索 (DFS)'
        },
        start: '开始搜索',
        clear: '清除路径',
        randomWalls: '随机生成墙壁',
        clearWalls: '清除墙壁',
        gridSize: '网格大小：',
        speed: '动画速度：',
        visitedNodes: '已访问节点：',
        pathLength: '路径长度：',
        executionTime: '执行时间：',
        startNode: '起点',
        endNode: '终点',
        wall: '墙壁',
        visited: '已访问',
        path: '最短路径',
        ms: '毫秒',
        themeToggle: '切换主题',
        languageSelect: '选择语言',
        logout: '退出登录',
        noPath: '未找到路径'
    },
    en: {
        title: 'Pathfinding Algorithm Visualizer',
        algorithm: 'Algorithm:',
        algorithms: {
            astar: 'A* Algorithm',
            dijkstra: 'Dijkstra Algorithm',
            bfs: 'Breadth First Search (BFS)',
            dfs: 'Depth First Search (DFS)'
        },
        start: 'Start Search',
        clear: 'Clear Path',
        randomWalls: 'Random Walls',
        clearWalls: 'Clear Walls',
        gridSize: 'Grid Size:',
        speed: 'Animation Speed:',
        visitedNodes: 'Visited Nodes:',
        pathLength: 'Path Length:',
        executionTime: 'Execution Time:',
        startNode: 'Start',
        endNode: 'End',
        wall: 'Wall',
        visited: 'Visited',
        path: 'Shortest Path',
        ms: 'ms',
        themeToggle: 'Toggle Theme',
        languageSelect: 'Select Language',
        logout: 'Logout',
        noPath: 'No path found'
    }
};

export class PathfindingVisualizer {
    constructor() {
        this.gridSize = 20;
        this.gridContainer = document.getElementById('grid');
        this.grid = new Grid(this.gridSize, this.gridSize, this.gridContainer);

        // 算法选择
        this.algorithmSelect = document.getElementById('algorithm');
        
        // 网格大小控制
        this.gridSizeInput = document.getElementById('gridSize');
        this.gridSizeInput.value = this.gridSize;
        document.querySelector('.size-display').textContent = `${this.gridSize} x ${this.gridSize}`;
        
        // 速度控制
        this.speedSlider = document.getElementById('speed');
        this.speedSlider.min = 1;
        this.speedSlider.max = 200;
        this.speedSlider.value = 100;
        this.grid.setAnimationSpeed(parseInt(this.speedSlider.value));

        this.speedSlider.addEventListener('input', (e) => {
           this.grid.setAnimationSpeed(parseInt(e.target.value));
        });

        // 初始化主题和语言
        this.initializeTheme();
        this.initializeLanguage();

        // 设置事件监听器
        this.setupEventListeners();

        // 初始化起点和终点
        this.initializeGrid();
        
        // 设���默认编辑模式
        this.grid.setEditMode(true);
        this.grid.setCurrentAction('wall');
    }

    initializeTheme() {
        this.isDarkTheme = localStorage.getItem('theme') === 'dark';
        if (this.isDarkTheme) {
            document.body.dataset.theme = 'dark';
        }
        document.getElementById('theme-toggle').innerHTML = 
            `<span class="material-icons">${this.isDarkTheme ? 'light_mode' : 'dark_mode'}</span>`;
    }

    initializeLanguage() {
        this.currentLanguage = localStorage.getItem('language') || 'zh';
        this.updateTranslations();
    }

    updateTranslations() {
        const t = translations[this.currentLanguage];
        
        // 更新页面标题
        document.title = t.title;
        document.querySelector('h1').textContent = t.title;

        // 更新按钮和控件的title属性
        document.getElementById('theme-toggle').title = t.themeToggle;
        document.getElementById('language').title = t.languageSelect;

        // 更新算法选择器
        const algorithmSelect = document.getElementById('algorithm');
        const currentValue = algorithmSelect.value;
        algorithmSelect.innerHTML = Object.entries(t.algorithms)
            .map(([value, text]) => `<option value="${value}">${text}</option>`)
            .join('');
        algorithmSelect.value = currentValue;

        // 更新所有需要翻译的文本
        document.querySelector('label[for="algorithm"]').textContent = t.algorithm;
        document.getElementById('start').textContent = t.start;
        document.getElementById('clear').textContent = t.clear;
        document.getElementById('randomWalls').textContent = t.randomWalls;
        document.getElementById('clearWalls').textContent = t.clearWalls;
        document.querySelector('label[for="gridSize"]').textContent = t.gridSize;
        document.querySelector('label[for="speed"]').textContent = t.speed;
        
        // 更新统计信息标签
        document.querySelector('.stats .stat-item:nth-child(1) label').textContent = t.visitedNodes;
        document.querySelector('.stats .stat-item:nth-child(2) label').textContent = t.pathLength;
        document.querySelector('.stats .stat-item:nth-child(3) label').textContent = t.executionTime + ' ' + t.ms;

        // 更新图例
        document.querySelectorAll('.legend-item span').forEach((span, index) => {
            const labels = [t.startNode, t.endNode, t.wall, t.visited, t.path];
            span.textContent = labels[index];

        //更新退出登录按钮文本
        document.getElementById('logout').textContent = t.logout;

        });

        // 如果当前显示的是"未找到路径"，更新这个文本
        const pathLengthElement = document.getElementById('pathLength');
        if (isNaN(pathLengthElement.textContent)) {
            pathLengthElement.textContent = t.noPath;
        }
    }

    toggleTheme() {
        this.isDarkTheme = !this.isDarkTheme;
        document.body.dataset.theme = this.isDarkTheme ? 'dark' : 'light';
        localStorage.setItem('theme', this.isDarkTheme ? 'dark' : 'light');
        
        const icon = this.isDarkTheme ? 'light_mode' : 'dark_mode';
        document.getElementById('theme-toggle').innerHTML = `<span class="material-icons">${icon}</span>`;
    }

    changeLanguage(lang) {
        this.currentLanguage = lang;
        localStorage.setItem('language', lang);
        this.updateTranslations();
    }

    initializeGrid() {
        this.grid = new Grid(this.gridSize, this.gridSize, this.gridContainer);
        this.updateGridDisplay();

        // 设置动画速度为当前滑块的值
        const currentSpeed = parseInt(this.speedSlider.value);
        this.grid.setAnimationSpeed(currentSpeed);

        // 设置起点和终点
        this.setStartAndEndNodes();
    }

    updateGridDisplay() {
        const container = document.getElementById('grid');
        container.style.gridTemplateColumns = `repeat(${this.gridSize}, 1fr)`;
        container.style.gridTemplateRows = `repeat(${this.gridSize}, 1fr)`;
        
        // 更新大小显示
        document.querySelector('.size-display').textContent = `${this.gridSize} x ${this.gridSize}`;
    }

    setupEventListeners() {
        // 主题切换
        document.getElementById('theme-toggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // 语言切换
        document.getElementById('language').addEventListener('change', (e) => {
            this.changeLanguage(e.target.value);
        });

        // 网格大小
        const gridSizeInput = document.getElementById('gridSize');
        gridSizeInput.addEventListener('input', (e) => {
            let size = parseInt(e.target.value);
            
            // 限制大小范围
            if (size < 2) size = 2;
            if (size > 100) size = 100;
            
            if (size !== e.target.value) {
                e.target.value = size;
            }
            
            if (!this.isRunning) {
                this.gridSize = size;
                this.grid = new Grid(this.gridSize, this.gridSize, this.gridContainer);
                this.updateGridDisplay();
                this.initializeGrid();
                // 保持编辑模式
                this.grid.setEditMode(true);
                this.grid.setCurrentAction('wall');
            }
        });

        // 速度控制
        document.getElementById('speed').addEventListener('input', (e) => {
            this.speed = parseInt(e.target.value);
            this.grid.setAnimationSpeed(this.speed);
        });

        // 开始搜索
        document.getElementById('start').addEventListener('click', () => {
            if (!this.isRunning) {
                this.startSearch();
            }
        });

        // 清除路径
        document.getElementById('clear').addEventListener('click', () => {
            if (!this.isRunning) {
                this.clearPath();
            }
        });

        // 随机生成墙壁
        document.getElementById('randomWalls').addEventListener('click', () => {
            if (!this.isRunning) {
                this.generateRandomWalls();
            }
        });

        // 清除墙壁
        document.getElementById('clearWalls').addEventListener('click', () => {
            if (!this.isRunning) {
                this.clearWalls();
            }
        });
    }

    async startSearch() {
        // 清除之前的路径
        this.clearPath();

        // 获取选择的算法
        const algorithmType = this.algorithmSelect.value;
        let algorithm;

        // 创建对应的算法实例
        switch (algorithmType) {
            case 'astar':
                algorithm = new AStar(this.grid);
                break;
            case 'dijkstra':
                algorithm = new Dijkstra(this.grid);
                break;
            case 'bfs':
                algorithm = new BFS(this.grid);
                break;
            case 'dfs':
                algorithm = new DFS(this.grid);
                break;
            default:
                algorithm = new AStar(this.grid);
        }

        // 开始搜索
        const result = await algorithm.findPath();

        // 更新统计信息
        document.getElementById('visitedCount').textContent = result.visitedCount;
        const pathLengthElement = document.getElementById('pathLength');
        
        if (result.success && result.path.length > 0) {
            pathLengthElement.textContent = result.path.length;
            this.visualizePath(result.path);
        } else {
            // 显示未找到路径的消息
            const t = translations[this.currentLanguage];
            pathLengthElement.textContent = t.noPath;
        }
        
        document.getElementById('executionTime').textContent = result.executionTime.toFixed(2);
    }

    async visualizePath(path) {
        // 为路径添加动画
        for (const node of path) {
            node.element.classList.add('path');
            await new Promise(resolve => setTimeout(resolve, 50));
        }
    }

    clearPath() {
        this.grid.clearPath();
        // 清除统计信息
        document.getElementById('visitedCount').textContent = '0';
        document.getElementById('pathLength').textContent = '0';
        document.getElementById('executionTime').textContent = '0';
    }

    clearWalls() {
        this.grid.clearWalls();
    }

    generateRandomWalls() {
        this.grid.generateRandomWalls();
    }

    setStartAndEndNodes(){ 
        // 设置起点在左上方 (0, 0)
        const startNode = this.grid.getNode(0, 0);
        this.grid.setStartNode(startNode);

        // 设置终点在右下方 (gridSize - 1, gridSize - 1)
        const endNode = this.grid.getNode(this.gridSize - 1, this.gridSize - 1);
        this.grid.setEndNode(endNode);
    }
}

// 初始化应用
window.addEventListener('DOMContentLoaded', () => {
    new PathfindingVisualizer();
});

