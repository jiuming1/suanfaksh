import { Node } from './Node.js';

export class Grid {
    constructor(rows, cols, container) {
        this.rows = rows;
        this.cols = cols;
        this.container = container;
        this.grid = [];
        this.startNode = null;
        this.endNode = null;
        this.isMouseDown = false;
        this.currentDragNode = null;
        this.isStartNodePressed = false;
        this.isEndNodePressed = false;
        this.currentAction = 'wall'; // 'wall', 'start', 'end'
        this.animationSpeed = 50;  // 默认速度
        this.isAnimating = false;  // 动画状态标志
        this.isEditMode = false;  // 编辑模式标志
        
        this.initializeGrid();
        this.setupEventListeners();
    }

    initializeGrid() {
        // 清空容器
        this.container.innerHTML = '';
        this.grid = [];

        // 设置网格容器样式
        this.container.style.gridTemplateColumns = `repeat(${this.cols}, 1fr)`;
        this.container.style.gridTemplateRows = `repeat(${this.rows}, 1fr)`;

        // 创建节点
        for (let row = 0; row < this.rows; row++) {
            const currentRow = [];
            for (let col = 0; col < this.cols; col++) {
                const node = new Node(row, col);
                
                // 创建节点的DOM元素
                const nodeElement = document.createElement('div');
                nodeElement.className = 'node';
                nodeElement.setAttribute('data-row', row);
                nodeElement.setAttribute('data-col', col);
                
                // 保存DOM元素引用
                node.element = nodeElement;
                
                // 添加到网格中
                this.container.appendChild(nodeElement);
                currentRow.push(node);
            }
            this.grid.push(currentRow);
        }
    }

    getNode(row, col) {
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            return this.grid[row][col];
        }
        return null;
    }

    isWall(node) {
        return node.element.classList.contains('wall');
    }

    setStartNode(node) {
        if (this.startNode) {
            this.startNode.element.classList.remove('start');
        }
        this.startNode = node;
        if (node) {
            node.element.classList.add('start');
        }
    }

    setEndNode(node) {
        if (this.endNode) {
            this.endNode.element.classList.remove('end');
        }
        this.endNode = node;
        if (node) {
            node.element.classList.add('end');
        }
    }

    setupEventListeners() {
        this.container.addEventListener('mousedown', (e) => {
            const element = e.target;
            if (!element.classList.contains('node')) return;
            
            this.isMouseDown = true;
            const row = parseInt(element.getAttribute('data-row'));
            const col = parseInt(element.getAttribute('data-col'));
            const node = this.getNode(row, col);

            // 检查是否点击了起点或终点
            if (node === this.startNode) {
                this.isStartNodePressed = true;
                this.currentDragNode = node;
                return;
            } else if (node === this.endNode) {
                this.isEndNodePressed = true;
                this.currentDragNode = node;
                return;
            }

            // 如果不是起点或终点，则处理墙壁
            if (this.isEditMode) {
                if (node !== this.startNode && node !== this.endNode) {
                    node.element.classList.toggle('wall');
                }
            }
        });

        this.container.addEventListener('mousemove', (e) => {
            if (!this.isMouseDown) return;
            const element = e.target;
            if (!element.classList.contains('node')) return;

            const row = parseInt(element.getAttribute('data-row'));
            const col = parseInt(element.getAttribute('data-col'));
            const node = this.getNode(row, col);

            // 处理起点或终点的拖动
            if (this.isStartNodePressed || this.isEndNodePressed) {
                if (node !== this.startNode && node !== this.endNode && !node.element.classList.contains('wall')) {
                    if (this.isStartNodePressed) {
                        this.setStartNode(node);
                    } else if (this.isEndNodePressed) {
                        this.setEndNode(node);
                    }
                }
                return;
            }

            // 处理墙壁的绘制
            if (this.isEditMode && !this.isStartNodePressed && !this.isEndNodePressed) {
                if (node !== this.startNode && node !== this.endNode) {
                    node.element.classList.toggle('wall');
                }
            }
        });

        this.container.addEventListener('mouseup', () => {
            this.isMouseDown = false;
            this.isStartNodePressed = false;
            this.isEndNodePressed = false;
            this.currentDragNode = null;
        });

        this.container.addEventListener('mouseleave', () => {
            this.isMouseDown = false;
            this.isStartNodePressed = false;
            this.isEndNodePressed = false;
            this.currentDragNode = null;
        });

        // 防止拖动时选中文本
        this.container.addEventListener('dragstart', (e) => {
            e.preventDefault();
        });
    }

    handleNodeClick(node) {
        if (this.isEditMode) {
            // 在编辑模式下，点击切换墙壁状态
            if (node !== this.startNode && node !== this.endNode) {
                node.toggleWall();
                node.element.classList.toggle('wall');
            }
        } else {
            // 根据当前操作模式处理点击
            switch (this.currentAction) {
                case 'start':
                    if (node !== this.endNode) {
                        if (this.startNode) {
                            this.startNode.element.classList.remove('start');
                        }
                        this.startNode = node;
                        node.isWall = false;
                        node.element.classList.remove('wall');
                        node.element.classList.add('start');
                    }
                    break;
                case 'end':
                    if (node !== this.startNode) {
                        if (this.endNode) {
                            this.endNode.element.classList.remove('end');
                        }
                        this.endNode = node;
                        node.isWall = false;
                        node.element.classList.remove('wall');
                        node.element.classList.add('end');
                    }
                    break;
                case 'wall':
                    if (node !== this.startNode && node !== this.endNode) {
                        node.toggleWall();
                        node.element.classList.toggle('wall');
                    }
                    break;
            }
        }
    }

    handleNodeMouseDown(node, event) {
        event.preventDefault();
        this.isMouseDown = true;

        if (this.isEditMode) {
            if (node !== this.startNode && node !== this.endNode) {
                node.toggleWall();
                node.element.classList.toggle('wall');
            }
            return;
        }

        if (this.currentAction === 'wall') {
            if (node === this.startNode) {
                this.isStartNodePressed = true;
                this.currentDragNode = node;
                node.element.classList.add('dragging');
            } else if (node === this.endNode) {
                this.isEndNodePressed = true;
                this.currentDragNode = node;
                node.element.classList.add('dragging');
            } else {
                node.toggleWall();
                node.element.classList.toggle('wall');
            }
        } else {
            this.handleNodeClick(node);
        }
    }

    handleNodeMouseEnter(node) {
        if (!this.isMouseDown) return;

        if (this.isEditMode || this.currentAction === 'wall') {
            if (this.currentDragNode) {
                if (node !== this.startNode && node !== this.endNode && !node.isWall) {
                    if (this.isStartNodePressed) {
                        this.startNode.element.classList.remove('start', 'dragging');
                        this.startNode = node;
                        node.element.classList.add('start', 'dragging');
                    } else if (this.isEndNodePressed) {
                        this.endNode.element.classList.remove('end', 'dragging');
                        this.endNode = node;
                        node.element.classList.add('end', 'dragging');
                    }
                }
            } else if (node !== this.startNode && node !== this.endNode) {
                node.toggleWall();
                node.element.classList.toggle('wall');
            }
        }
    }

    getNeighbors(node) {
        const neighbors = [];
        const directions = [
            [-1, 0], // 上
            [1, 0],  // 下
            [0, -1], // 左
            [0, 1]   // 右
        ];

        for (const [dx, dy] of directions) {
            const newRow = node.row + dx;
            const newCol = node.col + dy;
            const neighbor = this.getNode(newRow, newCol);
            
            if (neighbor && !this.isWall(neighbor)) {
                neighbors.push(neighbor);
            }
        }

        return neighbors;
    }

    clearPath() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const node = this.grid[row][col];
                node.element.classList.remove('visited', 'path');
            }
        }
    }

    clearWalls() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const node = this.grid[row][col];
                node.element.classList.remove('wall');
            }
        }
    }

    generateRandomWalls() {
        this.clearWalls();
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const node = this.grid[row][col];
                if (node !== this.startNode && node !== this.endNode && Math.random() < 0.3) {
                    node.element.classList.add('wall');
                }
            }
        }
    }

    setAnimationSpeed(speed) {
        this.animationSpeed = speed;
    }

    async animateNode(node, className) {
        if (this.isAnimating) {
            node.element.classList.add(className);
            if (this.animationSpeed > 0) {
                await new Promise(resolve => setTimeout(resolve, 201 - this.animationSpeed));
            }
        }
    }

    startAnimation() {
        this.isAnimating = true;
    }

    stopAnimation() {
        this.isAnimating = false;
    }

    setEditMode(isEdit) {
        this.isEditMode = isEdit;
    }

    setCurrentAction(action) {
        this.currentAction = action;
    }
} 