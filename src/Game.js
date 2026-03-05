import { Grid } from './Grid.js';
import { Shape, SHAPES } from './Shape.js';
import { SoundManager } from './SoundManager.js';

export class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        this.width = 0;
        this.height = 0;

        this.grid = new Grid();
        this.shapes = []; // Current 3 shapes

        this.score = 0;
        this.bestScore = 0;

        this.draggingShape = null;

        this.sound = new SoundManager();
        this.popupTimeout = null;

        this.init();
    }

    init() {
        this.resize();

        // Use ResizeObserver for more reliable resize detection, especially on mobile
        const container = this.canvas.parentElement;
        if (container) {
            const observer = new ResizeObserver(() => {
                this.resize();
            });
            observer.observe(container);
        }
        window.addEventListener('resize', () => this.resize());

        this.setupInput();
        this.refillShapes();

        this.isRunning = true;
        this.loop();
    }

    setupInput() {
        const getPos = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            // TouchEventかMouseEventか
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return {
                x: clientX - rect.left,
                y: clientY - rect.top
            };
        };

        const start = (e) => {
            if (!this.isRunning) return;
            // ユーザー操作時にAudioContextを再開
            this.sound.resume();

            const pos = getPos(e);

            // 下から順にチェック
            for (const shape of this.shapes) {
                if (shape.contains(pos.x, pos.y)) {
                    this.draggingShape = shape;
                    shape.isDragging = true;
                    shape.dragX = pos.x;
                    shape.dragY = pos.y;
                    break;
                }
            }
        };

        const move = (e) => {
            if (this.draggingShape) {
                e.preventDefault(); // スクロール防止
                const pos = getPos(e);
                this.draggingShape.dragX = pos.x;
                this.draggingShape.dragY = pos.y;
            }
        };

        const end = (e) => {
            if (this.draggingShape) {
                this.tryPlaceShape(this.draggingShape);
                this.draggingShape.isDragging = false;
                this.draggingShape = null;
            }
        };

        this.canvas.addEventListener('mousedown', start);
        this.canvas.addEventListener('mousemove', move);
        window.addEventListener('mouseup', end);

        this.canvas.addEventListener('touchstart', start, { passive: false });
        this.canvas.addEventListener('touchmove', move, { passive: false });
        window.addEventListener('touchend', end);
    }

    tryPlaceShape(shape) {
        // グリッド座標への変換
        const cellSize = this.grid.cellSize;
        const gap = this.grid.gap;
        const totalCellSize = cellSize + gap;

        // ブロックの実サイズ（スケール1.0）
        const width = shape.cols * totalCellSize - gap;
        const height = shape.rows * totalCellSize - gap;

        // 描画上の左上座標 (Shape.drawのロジックと合わせる)
        const drawX = shape.dragX - width / 2;
        const drawY = shape.dragY - height / 2 - 50;

        // これがGrid内のどのセル(row, col)に近いか
        const gridX = this.grid.pixelX;
        const gridY = this.grid.pixelY;

        // グリッド内相対座標
        const relativeX = drawX - gridX;
        const relativeY = drawY - gridY;

        // 近似セルインデックス
        const col = Math.round(relativeX / totalCellSize);
        const row = Math.round(relativeY / totalCellSize);

        // 置けるか判定
        if (this.grid.canPlace(shape, row, col)) {
            const linesCleared = this.grid.place(shape, row, col);

            // 効果音再生
            this.sound.playPlace();
            if (linesCleared > 0) {
                setTimeout(() => this.sound.playClear(linesCleared), 100);
            }

            this.handlePlaceSuccess(shape, linesCleared);
        } else {
            // Error sound (optional)
        }
    }

    handlePlaceSuccess(placedShape, linesCleared) {
        // 配列から削除
        const index = this.shapes.indexOf(placedShape);
        if (index > -1) {
            this.shapes.splice(index, 1);
        }

        // スコア加算
        let points = 0;
        let cellCount = 0;
        placedShape.layout.forEach(row => row.forEach(cell => { if (cell === 1) cellCount++; }));

        points += cellCount * 10;

        if (linesCleared > 0) {
            points += linesCleared * 100 * linesCleared;

            // 演出トリガー
            let message = "";
            let voiceText = "";

            if (linesCleared === 2) {
                message = "Excellent!";
                voiceText = "Excellent";
            } else if (linesCleared === 3) {
                message = "Amazing!";
                voiceText = "Amazing";
            } else if (linesCleared >= 4) {
                message = "Unbelievable!!";
                voiceText = "Unbelievable";
            }

            if (message) {
                this.showPopup(message);
                this.sound.speak(voiceText);
            }
        }

        this.score += points;
        this.updateScore();

        // 全部のShapeを使い切ったら補充
        if (this.shapes.length === 0) {
            this.refillShapes();
        }

        // ゲームオーバー判定
        if (this.checkGameOver()) {
            this.showGameOver();
        }
    }

    checkGameOver() {
        for (const shape of this.shapes) {
            if (this.grid.canPlaceAnywhere(shape)) {
                return false; // まだ置ける
            }
        }
        return true; // どれも置けない
    }

    showGameOver() {
        this.sound.playGameOver();
        this.isRunning = false;
        document.getElementById('msg-title').textContent = "GAME OVER";
        document.getElementById('final-score').textContent = `Score: ${this.score}`;
        document.getElementById('message-overlay').classList.remove('hidden');

        document.getElementById('restart-btn').onclick = () => {
            this.resetGame();
        };
    }

    resetGame() {
        this.score = 0;
        this.updateScore();
        this.grid.reset();
        this.shapes = [];
        this.refillShapes();
        this.isRunning = true;
        document.getElementById('message-overlay').classList.add('hidden');
        this.loop();
    }

    refillShapes() {
        // 3つのシェイプを生成
        for (let i = 0; i < 3; i++) {
            const def = SHAPES[Math.floor(Math.random() * SHAPES.length)];
            this.shapes.push(new Shape(def));
        }
        this.layoutShapes();

        if (this.checkGameOver()) {
            // 生成した瞬間に詰み
        }
    }

    layoutShapes() {
        // 下部のトレイ領域に3つ並べる
        const trayY = this.height * 0.8;
        const trayHeight = this.height * 0.2;
        const totalWidth = this.width;

        const slotWidth = totalWidth / 3;

        this.shapes.forEach((shape, index) => {
            const centerX = slotWidth * index + slotWidth / 2;
            const centerY = trayY + trayHeight / 2;

            const cellSize = this.grid.cellSize;
            const gap = this.grid.gap;
            const scale = 0.6;

            const w = (shape.cols * cellSize + (shape.cols - 1) * gap) * scale;
            const h = (shape.rows * cellSize + (shape.rows - 1) * gap) * scale;

            shape.baseX = centerX - w / 2;
            shape.baseY = centerY - h / 2;
        });
    }

    showPopup(text) {
        const popup = document.getElementById('popup');
        if (popup) {
            popup.textContent = text;
            popup.classList.add('show');

            // アニメーション後に消す
            if (this.popupTimeout) clearTimeout(this.popupTimeout);
            this.popupTimeout = setTimeout(() => {
                popup.classList.remove('show');
            }, 1200);
        }
    }

    resize() {
        const container = this.canvas.parentElement;
        if (!container) return;

        const clientWidth = container.clientWidth;
        const clientHeight = container.clientHeight;

        // Don't resize if dimensions are 0 to prevent canvas vanishing
        if (!clientWidth || !clientHeight) return;

        this.canvas.width = clientWidth;
        this.canvas.height = clientHeight;

        this.width = this.canvas.width;
        this.height = this.canvas.height;

        // グリッドサイズ計算
        const availableHeight = this.height * 0.75;
        const availableWidth = this.width * 0.9;

        const size = Math.min(availableWidth, availableHeight);

        const gap = 4;
        const rows = 8;
        const cellSize = (size - (rows - 1) * gap) / rows;

        this.grid.cellSize = cellSize;
        this.grid.gap = gap;

        // 中央揃え
        this.grid.pixelX = (this.width - size) / 2;
        this.grid.pixelY = (availableHeight - size) / 2 + 20;

        // シェイプ位置再計算
        this.layoutShapes();

        if (!this.isRunning) this.draw();
    }

    updateScore() {
        document.getElementById('score').textContent = this.score;
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            document.getElementById('best-score').textContent = this.bestScore;
        }
    }

    loop() {
        if (!this.isRunning) return;

        this.update();
        this.draw();

        requestAnimationFrame(() => this.loop());
    }

    update() {
    }

    draw() {
        // 背景クリア
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // グリッド
        this.grid.draw(this.ctx);

        // シェイプ
        for (const shape of this.shapes) {
            if (shape !== this.draggingShape) {
                shape.draw(this.ctx);
            }
        }
        if (this.draggingShape) {
            this.draggingShape.draw(this.ctx);
        }
    }
}
