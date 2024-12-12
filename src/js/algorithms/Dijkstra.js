export class Dijkstra {
    constructor(grid) {
        this.grid = grid;
    }

    async findPath(onVisit = null) {
        this.grid.startAnimation();  // 开始动画
        const startNode = this.grid.startNode;
        const endNode = this.grid.endNode;
        
        // 初始化起点
        startNode.distance = 0;
        
        const unvisitedNodes = this.getAllNodes();
        let visitedCount = 0;
        const startTime = performance.now();

        try {
            while (unvisitedNodes.length > 0) {
                // 按距离排序
                this.sortNodesByDistance(unvisitedNodes);
                const currentNode = unvisitedNodes.shift();

                // 如果最近的节点是无限距离，说明没有路径
                if (currentNode.distance === Infinity) {
                    const endTime = performance.now();
                    return {
                        success: false,
                        path: [],
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

                // 更新相邻节点的距离
                const neighbors = this.grid.getNeighbors(currentNode);
                for (const neighbor of neighbors) {
                    if (!neighbor.isVisited) {
                        const tentativeDistance = currentNode.distance + 1;
                        if (tentativeDistance < neighbor.distance) {
                            neighbor.distance = tentativeDistance;
                            neighbor.previousNode = currentNode;
                        }
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

    getAllNodes() {
        const nodes = [];
        for (const row of this.grid.grid) {
            for (const node of row) {
                nodes.push(node);
            }
        }
        return nodes;
    }

    sortNodesByDistance(nodes) {
        nodes.sort((a, b) => a.distance - b.distance);
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