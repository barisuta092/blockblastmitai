export class Grid {
    constructor(rows = 8, cols = 8) {
        this.rows = rows;
        this.cols = cols;
        this.data = []; // 2D array: 0 = empty, object = { color: '#...' }
        this.reset();

        // グリッド描画用情報 (Gameクラスからセットされる想定)
        this.pixelX = 0;
        this.pixelY = 0;
        this.cellSize = 40;
        this.gap = 4;
    }

    reset() {
        this.data = [];
        for (let r = 0; r < this.rows; r++) {
            const row = [];
            for (let c = 0; c < this.cols; c++) {
                row.push(null);
            }
            this.data.push(row);
        }
    }

    canPlace(shape, gridR, gridC) {
        const layout = shape.layout;
        for (let r = 0; r < layout.length; r++) {
            for (let c = 0; c < layout[r].length; c++) {
                if (layout[r][c] === 1) {
                    const targetR = gridR + r;
                    const targetC = gridC + c;

                    // 範囲外チェック
                    if (targetR < 0 || targetR >= this.rows || targetC < 0 || targetC >= this.cols) {
                        return false;
                    }

                    // 既に埋まっているかチェック
                    if (this.data[targetR][targetC] !== null) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    place(shape, gridR, gridC) {
        const layout = shape.layout;
        const color = shape.color;

        for (let r = 0; r < layout.length; r++) {
            for (let c = 0; c < layout[r].length; c++) {
                if (layout[r][c] === 1) {
                    this.data[gridR + r][gridC + c] = { color };
                }
            }
        }

        return this.checkLines();
    }

    checkLines() {
        let clearedLines = 0;
        let rowsToClear = [];
        let colsToClear = [];

        // 行チェック
        for (let r = 0; r < this.rows; r++) {
            if (this.data[r].every(cell => cell !== null)) {
                rowsToClear.push(r);
            }
        }

        // 列チェック
        for (let c = 0; c < this.cols; c++) {
            let full = true;
            for (let r = 0; r < this.rows; r++) {
                if (this.data[r][c] === null) {
                    full = false;
                    break;
                }
            }
            if (full) {
                colsToClear.push(c);
            }
        }

        // 削除処理
        // アニメーション用に削除対象を返すが、ロジック上はクリアしておく
        // (演出のために実際の削除は遅らせる実装もアリだが、まずは即時削除)

        rowsToClear.forEach(r => {
            for (let c = 0; c < this.cols; c++) {
                this.data[r][c] = null; // 本来はアニメーション後に消す
            }
        });

        colsToClear.forEach(c => {
            for (let r = 0; r < this.rows; r++) {
                this.data[r][c] = null;
            }
        });

        // 重複して消えるセルがあるので、スコア計算はユニークなセル数でするのが一般的だが、
        // Block Blast等は「ライン数」ベースが多い

        return rowsToClear.length + colsToClear.length;
    }

    // 指定されたShapeがどこかに置けるか（ゲームオーバー判定用）
    canPlaceAnywhere(shape) {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.canPlace(shape, r, c)) {
                    return true;
                }
            }
        }
        return false;
    }

    draw(ctx) {
        // 背景グリッド
        ctx.fillStyle = '#0f3460'; // Darker cell
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const x = this.pixelX + c * (this.cellSize + this.gap);
                const y = this.pixelY + r * (this.cellSize + this.gap);

                // 丸みを帯びた四角
                ctx.beginPath();
                ctx.roundRect(x, y, this.cellSize, this.cellSize, 6);
                ctx.fill();
            }
        }

        // 配置済みブロック
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cell = this.data[r][c];
                if (cell) {
                    const x = this.pixelX + c * (this.cellSize + this.gap);
                    const y = this.pixelY + r * (this.cellSize + this.gap);

                    ctx.fillStyle = cell.color;
                    ctx.beginPath();
                    ctx.roundRect(x, y, this.cellSize, this.cellSize, 6);
                    ctx.fill();

                    // 少し立体感を出す
                    ctx.fillStyle = 'rgba(255,255,255,0.2)';
                    ctx.beginPath();
                    ctx.moveTo(x, y + this.cellSize);
                    ctx.lineTo(x, y);
                    ctx.lineTo(x + this.cellSize, y);
                    ctx.fill();
                }
            }
        }
    }
}
