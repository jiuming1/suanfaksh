export class AStar {
    constructor(grid) {
        this.grid = grid;
    }

    async findPath(onVisit = null) {
        this.grid.startAnimation();  // 开始动画
        const startNode = this.grid.startNode;
        const endNode = this.grid.endNode;
        
        // 初始化起点
        startNode.distance = 0;
        startNode.f = this.heuristic(startNode, endNode);
        
        const openSet = [startNode];
        const closedSet = new Set();
        let visitedCount = 0;
        const startTime = performance.now();

        try {
            while (openSet.length > 0) {
                // 找到f值最小的节点
                const currentNode = this.getLowestFScore(openSet);
                
                // 如果到达终点
                if (currentNode === endNode) {
                    const path = this.reconstructPath(endNode);
                    const endTime = performance.now();
                    return {
                        success: true,
                        path,
                        visitedCount,
                        executionTime: endTime - startTime
                    };
                }

                // 从开放列表中移除当前节点
                openSet.splice(openSet.indexOf(currentNode), 1);
                closedSet.add(currentNode);

                // 标记为已访问
                if (currentNode !== startNode) {
                    currentNode.isVisited = true;
                    await this.grid.animateNode(currentNode, 'visited');
                    visitedCount++;
                    
                    if (onVisit) {
                        await onVisit(currentNode);
                    }
                }

                // 检查相邻节点
                const neighbors = this.grid.getNeighbors(currentNode);
                for (const neighbor of neighbors) {
                    if (closedSet.has(neighbor)) {
                        continue;
                    }

                    const tentativeG = currentNode.distance + 1;

                    if (!openSet.includes(neighbor)) {
                        openSet.push(neighbor);
                    } else if (tentativeG >= neighbor.distance) {
                        continue;
                    }

                    // 这条路径更好，记录下来
                    neighbor.previousNode = currentNode;
                    neighbor.distance = tentativeG;
                    neighbor.f = tentativeG + this.heuristic(neighbor, endNode);
                }
            }

            // 没有找到路径
            const endTime = performance.now();
            return {
                success: false,
                path: [],
                visitedCount,
                executionTime: endTime - startTime
            };
        } finally {
            this.grid.stopAnimation();  // 确保动画状态被重置
        }
    }

    heuristic(nodeA, nodeB) {
        // 使用曼哈顿距离
        return Math.abs(nodeA.row - nodeB.row) + Math.abs(nodeA.col - nodeB.col);
    }

    getLowestFScore(nodes) {
        let lowest = nodes[0];
        for (const node of nodes) {
            if (node.f < lowest.f) {
                lowest = node;
            }
        }
        return lowest;
    }

    reconstructPath(endNode) {
        const path = [];
        let currentNode = endNode;
        
        while (currentNode.previousNode) {
            path.unshift(currentNode);
            currentNode = currentNode.previousNode;
        }
        
        return path;
    }
} 