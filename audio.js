const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        function playSound(type) {
            if (audioCtx.state === 'suspended') audioCtx.resume();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            const now = audioCtx.currentTime;

            if (type === 'chip') {
                osc.type = 'sine'; osc.frequency.setValueAtTime(800, now); osc.frequency.exponentialRampToValueAtTime(400, now + 0.08);
                gain.gain.setValueAtTime(0.25, now); gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
                osc.start(now); osc.stop(now + 0.08);
            } else if (type === 'card') {
                osc.type = 'triangle'; osc.frequency.setValueAtTime(280, now); osc.frequency.linearRampToValueAtTime(140, now + 0.06);
                gain.gain.setValueAtTime(0.15, now); gain.gain.linearRampToValueAtTime(0.01, now + 0.06);
                osc.start(now); osc.stop(now + 0.06);
            } else if (type === 'win') {
                osc.type = 'triangle'; osc.frequency.setValueAtTime(523.25, now); osc.frequency.setValueAtTime(659.25, now + 0.1); osc.frequency.setValueAtTime(783.99, now + 0.2);
                gain.gain.setValueAtTime(0.25, now); gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
                osc.start(now); osc.stop(now + 0.4);
            } else if (type === 'lose') {
                osc.type = 'sawtooth'; osc.frequency.setValueAtTime(220, now); osc.frequency.linearRampToValueAtTime(100, now + 0.3);
                gain.gain.setValueAtTime(0.25, now); gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
                osc.start(now); osc.stop(now + 0.3);
            } else if (type === 'spin') {
                osc.type = 'sine'; osc.frequency.setValueAtTime(400, now); osc.frequency.exponentialRampToValueAtTime(120, now + 0.04);
                gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0.01, now + 0.04);
                osc.start(now); osc.stop(now + 0.04);
            } else if (type === 'kickout') {
                osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, now); osc.frequency.exponentialRampToValueAtTime(30, now + 0.35);
                gain.gain.setValueAtTime(0.4, now); gain.gain.linearRampToValueAtTime(0.01, now + 0.35);
                osc.start(now); osc.stop(now + 0.35);
            } else if (type === 'allin') {
                osc.type = 'square'; osc.frequency.setValueAtTime(220, now); osc.frequency.exponentialRampToValueAtTime(880, now + 0.22);
                gain.gain.setValueAtTime(0.25, now); gain.gain.linearRampToValueAtTime(0.01, now + 0.22);
                osc.start(now); osc.stop(now + 0.22);
            }
        }