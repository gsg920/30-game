        const rouletteNumbers = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
        const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
        
        let selectedRouletteChip = 10;
        let rouletteBets = {};
        let rInSpin = false;
        let wheelAngle = 0;

        function initRouletteBoard() {
            const grid = document.getElementById('roulette-numbers-grid');
            grid.innerHTML = '';
            for (let i = 1; i <= 36; i++) {
                const isRed = redNumbers.includes(i);
                const bg = isRed ? 'bg-red-700 hover:bg-red-600' : 'bg-slate-900 hover:bg-slate-800';
                grid.innerHTML += `
                    <div onclick="placeRouletteBet('${i}')" class="${bg} text-white rounded py-2 cursor-pointer transition relative border border-white/5">
                        ${i}
                        <span id="r-bet-${i}" class="absolute -top-1 -right-1 bg-amber-400 text-black rounded-full w-4 h-4 text-[9px] font-black hidden items-center justify-center"></span>
                    </div>
                `;
            }
        }

        function selectRouletteChip(amt) {
            selectedRouletteChip = amt;
            playSound('chip');
        }

        function placeRouletteBet(key) {
            if (rInSpin) return;
            if (balance < selectedRouletteChip) {
                document.getElementById('roulette-status').innerText = "잔액이 부족합니다!";
                return;
            }
            balance -= selectedRouletteChip;
            rouletteBets[key] = (rouletteBets[key] || 0) + selectedRouletteChip;

            if (balance === 0) {
                triggerAllInEffect();
            } else {
                playSound('chip');
            }

            updateGlobalBalanceUI();
            updateRouletteBetsUI();
        }

        function clearRouletteBets() {
            if (rInSpin) return;
            let total = 0;
            Object.values(rouletteBets).forEach(v => total += v);
            balance += total;
            rouletteBets = {};
            updateGlobalBalanceUI();
            updateRouletteBetsUI();
            playSound('chip');
        }

        function updateRouletteBetsUI() {
            let total = 0;
            document.querySelectorAll('[id^="r-bet-"]').forEach(el => { el.classList.add('hidden'); el.classList.remove('flex'); });
            
            Object.keys(rouletteBets).forEach(k => {
                const amt = rouletteBets[k];
                total += amt;
                const badge = document.getElementById(`r-bet-${k}`);
                if (badge && amt > 0) {
                    badge.innerText = amt >= 1000 ? `${amt/1000}k` : amt;
                    badge.classList.remove('hidden');
                    badge.classList.add('flex');
                }
            });
            document.getElementById('r-total-bet').innerText = `$${total.toLocaleString()}`;
        }

        function drawRouletteWheel() {
            const canvas = document.getElementById('roulette-wheel');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            const cx = canvas.width / 2;
            const cy = canvas.height / 2;
            const radius = canvas.width / 2 - 10;
            const slice = (Math.PI * 2) / rouletteNumbers.length;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            rouletteNumbers.forEach((num, i) => {
                const angle = wheelAngle + i * slice;
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.arc(cx, cy, radius, angle, angle + slice);
                ctx.closePath();

                if (num === 0) ctx.fillStyle = '#047857';
                else if (redNumbers.includes(num)) ctx.fillStyle = '#b91c1c';
                else ctx.fillStyle = '#0f172a';
                ctx.fill();
                ctx.strokeStyle = '#d97706';
                ctx.lineWidth = 1;
                ctx.stroke();

                ctx.save();
                ctx.translate(cx, cy);
                ctx.rotate(angle + slice / 2);
                ctx.textAlign = 'right';
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 12px sans-serif';
                ctx.fillText(num, radius - 12, 4);
                ctx.restore();
            });

            ctx.beginPath();
            ctx.arc(cx, cy, 32, 0, Math.PI * 2);
            ctx.fillStyle = '#d97706';
            ctx.fill();
            ctx.strokeStyle = '#fef08a';
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        function spinRoulette() {
            if (rInSpin) return;
            let totalBet = 0;
            Object.values(rouletteBets).forEach(v => totalBet += v);
            if (totalBet <= 0) {
                document.getElementById('roulette-status').innerText = "베팅을 먼저 진행하세요!";
                return;
            }

            rInSpin = true;
            document.getElementById('btn-spin-roulette').disabled = true;
            document.getElementById('roulette-status').innerText = "휠이 회전하는 중입니다...";

            const winIndex = Math.floor(Math.random() * rouletteNumbers.length);
            const winningNum = rouletteNumbers[winIndex];
            const slice = (Math.PI * 2) / rouletteNumbers.length;
            
            const targetAngle = (Math.PI * 3 / 2) - (winIndex * slice) - (slice / 2);
            const totalRotation = targetAngle + (Math.PI * 2 * 6);

            let startTime = null;
            const duration = 4000;

            function animateSpin(timestamp) {
                if (!startTime) startTime = timestamp;
                const progress = (timestamp - startTime) / duration;
                if (progress < 1) {
                    const ease = 1 - Math.pow(1 - progress, 3);
                    wheelAngle = totalRotation * ease;
                    drawRouletteWheel();
                    if (Math.random() < 0.15) playSound('spin');
                    requestAnimationFrame(animateSpin);
                } else {
                    wheelAngle = targetAngle;
                    drawRouletteWheel();
                    settleRoulette(winningNum);
                }
            }
            requestAnimationFrame(animateSpin);
        }

        function settleRoulette(winningNum) {
            rInSpin = false;
            document.getElementById('btn-spin-roulette').disabled = false;
            const isRed = redNumbers.includes(winningNum);
            const colorText = winningNum === 0 ? 'GREEN' : isRed ? 'RED' : 'BLACK';
            document.getElementById('roulette-result-display').innerText = `당첨 번호: ${winningNum} (${colorText})`;

            let totalPayout = 0;
            Object.keys(rouletteBets).forEach(key => {
                const betAmt = rouletteBets[key];
                if (key === winningNum.toString()) totalPayout += betAmt * 36;
                else if (key === 'RED' && isRed) totalPayout += betAmt * 2;
                else if (key === 'BLACK' && !isRed && winningNum !== 0) totalPayout += betAmt * 2;
                else if (key === 'EVEN' && winningNum !== 0 && winningNum % 2 === 0) totalPayout += betAmt * 2;
                else if (key === 'ODD' && winningNum % 2 !== 0) totalPayout += betAmt * 2;
                else if (key === '1-18' && winningNum >= 1 && winningNum <= 18) totalPayout += betAmt * 2;
                else if (key === '19-36' && winningNum >= 19 && winningNum <= 36) totalPayout += betAmt * 2;
                else if (key === '1st12' && winningNum >= 1 && winningNum <= 12) totalPayout += betAmt * 3;
                else if (key === '2nd12' && winningNum >= 13 && winningNum <= 24) totalPayout += betAmt * 3;
                else if (key === '3rd12' && winningNum >= 25 && winningNum <= 36) totalPayout += betAmt * 3;
            });

            if (totalPayout > 0) {
                balance += totalPayout;
                lifetimeProfit += totalPayout;
                document.getElementById('roulette-status').innerText = `🎉 당첨! $${totalPayout.toLocaleString()} 획득!`;
                playSound('win');
            } else {
                document.getElementById('roulette-status').innerText = "아쉽게도 낙첨되었습니다.";
                playSound('lose');
            }

            rouletteBets = {};
            updateGlobalBalanceUI();
            updateRouletteBetsUI();
            checkBankruptOrEnding();
        }