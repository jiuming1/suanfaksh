export class BFS {
    constructor(grid) {
        this.grid = grid;
    }

    async findPath(onVisit = null) {
        this.grid.startAnimation();  // 开始动画
        const startNode = this.grid.startNode;
        const endNode = this.grid.endNode;
        
        const queue = [startNode];
        const visited = new Set([startNode]);
        let visitedCount = 0;
        const startTime = performance.now();

        try {
            while (queue.length > 0) {
                const currentNode = queue.shift();

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
                    if (!visited.has(neighbor)) {
                        visited.add(neighbor);
                        neighbor.previousNode = currentNode;
                        queue.push(neighbor);
                    }
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