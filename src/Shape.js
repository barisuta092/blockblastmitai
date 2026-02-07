// 各種ブロック形状定義 (0:空, 1:ブロック)
// テトリスっぽい形状 + 1マス、2マス、3マスなど
export const SHAPES = [
    // 1x1
    { layout: [[1]], color: '#e94560' },
    // 2x1
    { layout: [[1, 1]], color: '#e94560' },
    // 2x1 Vertical
    { layout: [[1], [1]], color: '#e94560' },
    // 3x1
    { layout: [[1, 1, 1]], color: '#fcdab7' },
    // 2x2
    { layout: [[1, 1], [1, 1]], color: '#0f3460' }, // 黄色に変えたほうがいいかも
    // L字
    { layout: [[1, 0], [1, 0], [1, 1]], color: '#533483' },
    // T字
    { layout: [[1, 1, 1], [0, 1, 0]], color: '#16213e' }, // color調整必要
    // 4x1
    { layout: [[1, 1, 1, 1]], color: '#1CD6CE' },
    // 3x3 Big
    { layout: [[1, 1, 1], [1, 1, 1], [1, 1, 1]], color: '#f87171' },
    // Cross (Plus)
    { layout: [[0, 1, 0], [1, 1, 1], [0, 1, 0]], color: '#a78bfa' },
    // U-Shape
    { layout: [[1, 0, 1], [1, 1, 1]], color: '#fbbf24' },
    // Diagonal 2
    { layout: [[1, 0], [0, 1]], color: '#ec4899' },
    // Big L
    { layout: [[1, 0, 0], [1, 0, 0], [1, 1, 1]], color: '#3b82f6' },
    // S-Shape (Stairs)
    { layout: [[0, 1, 1], [1, 1, 0]], color: '#10b981' },
    // Line 5
    { layout: [[1, 1, 1, 1, 1]], color: '#6366f1' },
    // Small Corner
    { layout: [[1, 1], [1, 0]], color: '#f97316' },
];

export class Shape {
    constructor(def) {
        this.layout = def.layout;
        this.color = this.getRandomColor(); // 色はランダムにする
        this.rows = this.layout.length;
        this.cols = this.layout[0].length;

        // 表示位置（トレイの中での位置）
        this.baseX = 0;
        this.baseY = 0;

        // ドラッグ用
        this.isDragging = false;
        this.dragX = 0;
        this.dragY = 0;

        // 拡大スケール（ドラッグ中）
        this.scale = 0.6; // トレイでは小さく表示
    }

    getRandomColor() {
        const colors = ['#e94560', '#fcdab7', '#1CD6CE', '#D61C4E', '#FEDB39'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    draw(ctx, offsetX = 0, offsetY = 0) {
        const cellSize = 40;
        const gap = 4;
        const currentScale = this.isDragging ? 1.0 : 0.6; // ドラッグ中は等倍（盤面と同じサイズ）

        // 描画基準位置
        // ドラッグ中は dragX/Y (マウス位置中心になるように調整)
        // 非ドラッグ時は baseX/Y (トレイ位置)

        let drawX, drawY;

        if (this.isDragging) {
            // マウス位置がブロックの中心に来るように
            // ブロック全体の幅・高さ
            const width = this.cols * cellSize * currentScale + (this.cols - 1) * gap * currentScale;
            const height = this.rows * cellSize * currentScale + (this.rows - 1) * gap * currentScale;

            drawX = this.dragX - width / 2; // タッチ位置は指で隠れるので少しずらした方がいいが、PCなら中心でOK
            drawY = this.dragY - height / 2 - 50; // 少し上に表示して指で隠れないようにする（タッチデバイス用）
        } else {
            drawX = this.baseX;
            drawY = this.baseY;
        }

        ctx.save();
        ctx.translate(drawX, drawY);
        ctx.scale(currentScale, currentScale);

        ctx.fillStyle = this.color;

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.layout[r][c] === 1) {
                    const x = c * (cellSize + gap);
                    const y = r * (cellSize + gap);

                    ctx.beginPath();
                    ctx.roundRect(x, y, cellSize, cellSize, 6);
                    ctx.fill();

                    // ハイライト
                    ctx.fillStyle = 'rgba(255,255,255,0.2)';
                    ctx.beginPath();
                    ctx.roundRect(x + 2, y + 2, cellSize - 4, cellSize / 2 - 2, 4);
                    // ctx.fill(); // シンプルにするため一旦OFF
                    ctx.fillStyle = this.color; // 戻す
                }
            }
        }

        ctx.restore();
    }

    // 当たり判定 (トレイ上のクリック用)
    contains(x, y) {
        if (this.isDragging) return true; // ドラッグ中は無視

        const cellSize = 40;
        const gap = 4;
        const scale = 0.6;

        const width = (this.cols * cellSize + (this.cols - 1) * gap) * scale;
        const height = (this.rows * cellSize + (this.rows - 1) * gap) * scale;

        // baseX, baseY は中心座標ではなく左上座標とする
        return x >= this.baseX && x <= this.baseX + width &&
            y >= this.baseY && y <= this.baseY + height;
    }
}
