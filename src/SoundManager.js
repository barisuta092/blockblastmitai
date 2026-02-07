export class SoundManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.isMuted = false;

        // Web Speech API
        this.synth = window.speechSynthesis;
        this.voices = [];
        this.initVoice();
    }

    initVoice() {
        // 音声リスト取得（非同期）
        const load = () => {
            this.voices = this.synth.getVoices();
        };
        load();
        if (this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = load;
        }
    }

    resume() {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    speak(text) {
        if (this.isMuted) return;

        // 既存の発話をキャンセル（連打対応）
        this.synth.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        // 英語ボイスを探す
        const enVoice = this.voices.find(v => v.lang.includes('en-US') && v.name.includes('Google'));
        if (enVoice) {
            utterance.voice = enVoice;
        }

        utterance.rate = 1.2; // 少し早口
        utterance.pitch = 1.2; // 少し高め
        utterance.volume = 1.0;

        this.synth.speak(utterance);
    }

    playPlace() {
        if (this.isMuted) return;
        this.resume();

        const oscillator = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(600, this.ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

        oscillator.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        oscillator.start();
        oscillator.stop(this.ctx.currentTime + 0.1);
    }

    playClear(lines) {
        if (this.isMuted) return;
        this.resume();

        const count = Math.min(lines, 4);
        const baseFreqs = [523.25, 659.25, 783.99, 1046.50];

        for (let i = 0; i < count; i++) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(baseFreqs[i], this.ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(baseFreqs[i] * 2, this.ctx.currentTime + 0.3);

            gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(this.ctx.currentTime + i * 0.05);
            osc.stop(this.ctx.currentTime + 0.5);
        }
    }

    playGameOver() {
        if (this.isMuted) return;
        this.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 1.0);

        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1.0);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 1.0);
    }
}
