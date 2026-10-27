        let bjNpcCount = 0;
        let bjBet = 0;
        let bjInRound = false;
        let bjDeck = [];
        let bjDealerHand = [];
        let bjPlayerHand = [];
        let bjNpcHands = [];

        const npcPool = [
            { name: '김철수', color: 'text-blue-400', risk: 16 },
            { name: '이지은', color: 'text-purple-400', risk: 17 },
            { name: '박민수', color: 'text-emerald-400', risk: 15 },
            { name: '제시카', color: 'text-pink-400', risk: 17 }
        ];

        function changeBjNpcCount(delta) {
            if (bjInRound) return;
            const newCount = bjNpcCount + delta;
            if (newCount >= 0 && newCount <= 4) {
                bjNpcCount = newCount;
                document.getElementById('bj-npc-display').innerText = `${bjNpcCount}명`;
                setupBjPlayerSeats();
                playSound('chip');
            }
        }

        function setupBjPlayerSeats() {
            bjNpcHands = [];
            for (let i = 0; i < bjNpcCount; i++) {
                bjNpcHands.push({ info: npcPool[i], cards: [], bet: 0, status: '대기 중' });
            }
            renderBjSeatsUI();
        }

        function renderBjSeatsUI() {
            const container = document.getElementById('bj-players-container');
            container.innerHTML = '';
            const leftNpc = Math.ceil(bjNpcCount / 2);
            for (let i = 0; i < leftNpc; i++) container.appendChild(createBjNpcSeat(i));
            container.appendChild(createBjPlayerSeat());
            for (let i = leftNpc; i < bjNpcCount; i++) container.appendChild(createBjNpcSeat(i));
        }

        function createBjNpcSeat(index) {
            const npc = bjNpcHands[index];
            const div = document.createElement('div');
            div.className = "flex flex-col items-center bg-black/35 p-1 sm:p-2 rounded-xl sm:rounded-2xl border border-white/10 backdrop-blur-sm min-w-[66px] sm:min-w-[120px] flex-shrink-0";
            div.innerHTML = `
                <div class="flex items-center space-x-1 mb-0.5 sm:mb-1 text-[10px] sm:text-xs"><i class="fa-solid fa-robot ${npc.info.color}"></i><span class="font-bold text-slate-200 truncate max-w-[48px] sm:max-w-none">${npc.info.name}</span></div>
                <div id="bj-npc-cards-${index}" class="flex justify-center -space-x-5 min-h-[70px] sm:min-h-[114px] items-center my-0.5 sm:my-1 scale-90 sm:scale-100"></div>
                <div class="flex items-center space-x-1 text-[10px] sm:text-xs"><span id="bj-npc-score-${index}" class="bg-slate-900 text-amber-300 font-bold px-1.5 py-0.5 rounded text-[9px] sm:text-[10px]">-</span><span id="bj-npc-bet-${index}" class="text-slate-400 text-[9px] sm:text-[10px]">$${npc.bet}</span></div>
                <div id="bj-npc-status-${index}" class="text-[9px] sm:text-[10px] text-amber-400 font-bold h-3.5 sm:h-4 text-center truncate max-w-[62px] sm:max-w-none">${npc.status}</div>
            `;
            return div;
        }

        function createBjPlayerSeat() {
            const div = document.createElement('div');
            const widthClass = bjNpcCount === 0 ? "min-w-[140px] sm:min-w-[250px]" : "min-w-[95px] sm:min-w-[150px]";
            div.className = `flex flex-col items-center bg-amber-500/10 p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border-2 border-amber-500/40 backdrop-blur-md relative ${widthClass} flex-shrink-0`;
            div.innerHTML = `
                <div class="absolute -top-2.5 sm:-top-3 bg-amber-500 text-black font-black text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full uppercase">YOU (나)</div>
                <div id="bj-player-cards" class="flex justify-center -space-x-4 min-h-[70px] sm:min-h-[114px] items-center my-0.5 sm:my-1 w-full scale-95 sm:scale-100"></div>
                <div class="flex items-center space-x-2 mt-0.5"><span id="bj-player-score" class="bg-black/80 text-amber-400 font-extrabold text-[10px] sm:text-xs px-2 py-0.5 rounded-lg border border-amber-500/40">-</span></div>
                <div id="bj-player-status" class="text-[10px] sm:text-xs text-emerald-400 font-extrabold h-3.5 sm:h-4"></div>
            `;
            return div;
        }

        function calculateBjScore(hand) {
            let score = 0, aces = 0;
            for (let c of hand) {
                if (c.hidden) continue;
                if (['J', 'Q', 'K'].includes(c.value)) score += 10;
                else if (c.value === 'A') { aces += 1; score += 11; }
                else score += parseInt(c.value);
            }
            while (score > 21 && aces > 0) { score -= 10; aces -= 1; }
            return score;
        }

        function startBjRound() {
            if (bjBet <= 0) {
                document.getElementById('bj-status').innerText = "베팅 칩을 먼저 선택해주세요!";
                return;
            }
            
            if (balance === 0) {
                triggerAllInEffect();
            }

            bjInRound = true;
            bjDeck = createDeck();
            bjPlayerHand = [];
            bjDealerHand = [];
            bjNpcHands.forEach(npc => { npc.cards = []; npc.bet = Math.min(Math.floor(Math.random() * 5 + 1) * 25, 200); npc.status = '진행 중'; });

            document.getElementById('bj-player-status').innerText = '';
            document.getElementById('bj-npc-control').classList.add('opacity-40', 'pointer-events-none');
            document.getElementById('bj-btn-deal').disabled = true;

            renderBjSeatsUI();
            let delay = 100;
            bjNpcHands.forEach(npc => { setTimeout(() => { dealBjCardTo(npc.cards); renderBjCards(); }, delay); delay += 200; });
            setTimeout(() => { dealBjCardTo(bjPlayerHand); renderBjCards(); }, delay); delay += 200;
            setTimeout(() => { dealBjCardTo(bjDealerHand); renderBjCards(); }, delay); delay += 200;
            bjNpcHands.forEach(npc => { setTimeout(() => { dealBjCardTo(npc.cards); renderBjCards(); }, delay); delay += 200; });
            setTimeout(() => { dealBjCardTo(bjPlayerHand); renderBjCards(); }, delay); delay += 200;
            setTimeout(() => {
                dealBjCardTo(bjDealerHand, true);
                renderBjCards();
                document.getElementById('bj-btn-hit').disabled = false;
                document.getElementById('bj-btn-stand').disabled = false;
                document.getElementById('bj-status').innerText = "HIT 또는 STAND를 선택하세요.";
                if (calculateBjScore(bjPlayerHand) === 21) {
                    document.getElementById('bj-player-status').innerText = "BLACKJACK!";
                    bjPlayerStand();
                }
            }, delay);
        }

        function dealBjCardTo(hand, hidden = false) {
            if (bjDeck.length > 0) {
                hand.forEach(c => c.isNew = false);
                const c = bjDeck.pop();
                if (hidden) c.hidden = true;
                c.isNew = true;
                hand.push(c);
                playSound('card');
            }
        }

        function renderBjCards() {
            const pEl = document.getElementById('bj-player-cards');
            if (pEl) pEl.innerHTML = bjPlayerHand.map(c => renderCardHTML(c)).join('');
            document.getElementById('bj-dealer-cards').innerHTML = bjDealerHand.map(c => renderCardHTML(c)).join('');
            document.getElementById('bj-player-score').innerText = calculateBjScore(bjPlayerHand);
            const dScore = calculateBjScore(bjDealerHand);
            const dScoreEl = document.getElementById('bj-dealer-score');
            dScoreEl.innerText = dScore > 0 ? dScore : '?';
            dScoreEl.classList.remove('hidden');

            bjNpcHands.forEach((npc, idx) => {
                const cEl = document.getElementById(`bj-npc-cards-${idx}`);
                const sEl = document.getElementById(`bj-npc-score-${idx}`);
                if (cEl) cEl.innerHTML = npc.cards.map(c => renderCardHTML(c)).join('');
                if (sEl) sEl.innerText = calculateBjScore(npc.cards);
            });

            bjPlayerHand.forEach(c => c.isNew = false);
            bjDealerHand.forEach(c => c.isNew = false);
            bjNpcHands.forEach(n => n.cards.forEach(c => c.isNew = false));
        }

        function bjPlayerHit() {
            if (!bjInRound) return;
            dealBjCardTo(bjPlayerHand);
            renderBjCards();
            if (calculateBjScore(bjPlayerHand) > 21) {
                document.getElementById('bj-player-status').innerText = "BUST";
                bjPlayerStand();
            }
        }

        function bjPlayerStand() {
            if (!bjInRound) return;
            document.getElementById('bj-btn-hit').disabled = true;
            document.getElementById('bj-btn-stand').disabled = true;
            let delay = 300;
            bjNpcHands.forEach(npc => {
                setTimeout(() => {
                    while (calculateBjScore(npc.cards) < npc.info.risk) dealBjCardTo(npc.cards);
                    npc.status = calculateBjScore(npc.cards) > 21 ? "BUST" : "STAND";
                    renderBjCards();
                }, delay);
                delay += 350;
            });

            setTimeout(() => {
                if (bjDealerHand.length > 1) bjDealerHand[1].hidden = false;
                renderBjCards();
                const timer = setInterval(() => {
                    if (calculateBjScore(bjDealerHand) < 17) {
                        dealBjCardTo(bjDealerHand);
                        renderBjCards();
                    } else {
                        clearInterval(timer);
                        settleBjRound();
                    }
                }, 500);
            }, delay + 100);
        }

        function settleBjRound() {
            bjInRound = false;
            document.getElementById('bj-npc-control').classList.remove('opacity-40', 'pointer-events-none');
            const pScore = calculateBjScore(bjPlayerHand);
            const dScore = calculateBjScore(bjDealerHand);
            let msg = "";

            if (pScore > 21) {
                msg = "버스트로 패배하셨습니다."; playSound('lose');
            } else if (dScore > 21 || pScore > dScore) {
                const winAmt = bjBet * 2;
                balance += winAmt; lifetimeProfit += bjBet;
                msg = `🎉 승리! $${winAmt.toLocaleString()} 획득!`; playSound('win');
            } else if (pScore === dScore) {
                balance += bjBet; msg = "무승부 (Push) - 환급"; playSound('chip');
            } else {
                msg = "딜러의 승리입니다."; playSound('lose');
            }

            bjBet = 0;
            updateGlobalBalanceUI();
            updateGameBetsUI();
            document.getElementById('bj-status').innerText = msg;
            document.getElementById('bj-btn-deal').disabled = false;
            checkBankruptOrEnding();
        }