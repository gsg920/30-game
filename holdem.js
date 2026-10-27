let thNpcCount = 3;
        let thBet = 0;
        let thPot = 0;
        let thCurrentBet = 0;
        let thPlayerStreetBet = 0;
        let thPlayerTotalContribution = 0;
        let thInRound = false;
        let thStage = 0; // 0: Preflop, 1: Flop, 2: Turn, 3: River, 4: Showdown
        let thDeck = [];
        let thCommunityCards = [];
        let thPlayerHand = [];
        let thNpcHands = [];
        let thRevealInProgress = false;
        let thRaiseIncrement = 100;
        let thLastActionWasAllIn = false;

        function updateThRaiseButtons() {
            const base = (thInRound ? (thPlayerTotalContribution || thBet) : thBet) || 100;
            const tiers = [
                { mult: 1, amount: base },
                { mult: 2, amount: base * 2 },
                { mult: 3, amount: base * 3 },
                { mult: 5, amount: base * 5 }
            ];

            const container = document.getElementById('th-raise-container');
            if (!container) return;

            const validAmounts = tiers.map(t => t.amount);
            if (!validAmounts.includes(thRaiseIncrement)) {
                thRaiseIncrement = tiers[0].amount;
            }

            container.innerHTML = `
                <span class="text-[10px] font-bold text-slate-400">레이즈 인상폭:</span>
                ${tiers.map(t => {
                    const isSelected = thRaiseIncrement === t.amount;
                    const cls = isSelected 
                        ? 'bg-emerald-600 border-emerald-400 text-white shadow' 
                        : 'bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700';
                    return `<button type="button" class="th-raise-size text-xs px-2.5 py-1.5 rounded-lg border font-bold transition ${cls}" data-raise="${t.amount}" onclick="setThRaiseIncrement(${t.amount})">+${t.mult}x ($${t.amount.toLocaleString()})</button>`;
                }).join('')}
            `;
        }

        function setThRaiseIncrement(amount) {
            if (thInRound && thRevealInProgress) return;
            thRaiseIncrement = amount;
            updateThRaiseButtons();
            enableThActionButtons();
            playSound('chip');
        }

        function changeThNpcCount(delta) {
            if (thInRound) return;
            const n = thNpcCount + delta;
            if (n >= 1 && n <= 4) {
                thNpcCount = n;
                document.getElementById('th-npc-display').innerText = `${thNpcCount}명`;
                setupThPlayerSeats();
                playSound('chip');
            }
        }

        function setupThPlayerSeats() {
            thNpcHands = [];
            for (let i = 0; i < thNpcCount; i++) {
                thNpcHands.push({ info: npcPool[i], cards: [], bet: 0, streetBet: 0, folded: false, status: '대기 중' });
            }
            renderThSeatsUI();
        }

        function renderThSeatsUI() {
            const container = document.getElementById('th-players-container');
            container.innerHTML = '';
            const leftNpc = Math.ceil(thNpcCount / 2);
            for (let i = 0; i < leftNpc; i++) container.appendChild(createThNpcSeat(i));
            container.appendChild(createThPlayerSeat());
            for (let i = leftNpc; i < thNpcCount; i++) container.appendChild(createThNpcSeat(i));
        }

        function createThNpcSeat(index) {
            const npc = thNpcHands[index];
            const div = document.createElement('div');
            div.className = "flex flex-col items-center bg-black/35 p-2 rounded-2xl border border-white/10 backdrop-blur-sm min-w-[95px] sm:min-w-[120px]";
            div.innerHTML = `
                <div class="flex items-center space-x-1 mb-1 text-xs"><i class="fa-solid fa-robot ${npc.info.color}"></i><span class="font-bold text-slate-200">${npc.info.name}</span></div>
                <div id="th-npc-cards-${index}" class="flex justify-center -space-x-5 min-h-[96px] sm:min-h-[114px] items-center my-1 scale-90 sm:scale-100"></div>
                <div class="flex items-center space-x-1 text-xs"><span id="th-npc-bet-${index}" class="text-amber-400 font-bold text-[10px]">$${npc.bet}</span></div>
                <div id="th-npc-status-${index}" class="text-[10px] text-slate-400 font-bold h-4">${npc.status}</div>
            `;
            return div;
        }

        function createThPlayerSeat() {
            const div = document.createElement('div');
            div.className = "flex flex-col items-center bg-amber-500/10 p-2 rounded-2xl border-2 border-amber-500/40 backdrop-blur-md relative min-w-[130px] sm:min-w-[160px]";
            div.innerHTML = `
                <div class="absolute -top-3 bg-amber-500 text-black font-black text-[10px] px-2 py-0.5 rounded-full uppercase">YOU (나)</div>
                <div id="th-player-cards" class="flex justify-center -space-x-4 min-h-[96px] sm:min-h-[114px] items-center my-1 w-full"></div>
                <div id="th-player-hand-rank" class="text-xs text-amber-300 font-extrabold h-4"></div>
            `;
            return div;
        }

        function startThRound() {
            if (thBet <= 0) {
                document.getElementById('th-status').innerText = "시작 베팅액을 선택해주세요!";
                return;
            }

            thInRound = true;
            thRevealInProgress = false;
            thStage = 0;
            thDeck = createDeck();
            thCommunityCards = [];
            thPlayerHand = [];
            thPot = thBet;
            thCurrentBet = 0;
            thPlayerStreetBet = 0;
            thPlayerTotalContribution = thBet;
            updateThRaiseButtons();

            thNpcHands.forEach(npc => {
                npc.cards = [];
                npc.bet = thBet;
                npc.streetBet = 0;
                npc.folded = false;
                npc.status = '참여 중';
                thPot += thBet;
            });

            document.getElementById('th-pot-amount').innerText = `$${thPot.toLocaleString()}`;
            document.getElementById('th-npc-control').classList.add('opacity-40', 'pointer-events-none');
            document.getElementById('th-btn-deal').disabled = true;

            renderThSeatsUI();

            let delay = 100;
            thNpcHands.forEach(npc => {
                setTimeout(() => { dealThCardTo(npc.cards, true); renderThBoard(); }, delay); delay += 150;
                setTimeout(() => { dealThCardTo(npc.cards, true); renderThBoard(); }, delay); delay += 150;
            });
            setTimeout(() => { dealThCardTo(thPlayerHand); renderThBoard(); }, delay); delay += 150;
            setTimeout(() => {
                dealThCardTo(thPlayerHand);
                renderThBoard();

                if (balance === 0) {
                    triggerAllInEffect();
                    document.getElementById('th-status').innerText = "🔥 잔액 전액 베팅! 자동 ALL-IN 처리됩니다.";
                    runAllInShowdown();
                } else {
                    prepareThBettingRound();
                    enableThActionButtons();
                    document.getElementById('th-status').innerText = "프리플랍: 액션을 선택하세요.";
                }
            }, delay + 100);
        }

        function dealThCardTo(hand, hidden = false) {
            if (thDeck.length > 0) {
                hand.forEach(c => c.isNew = false);
                const c = thDeck.pop();
                if (hidden) c.hidden = true;
                c.isNew = true;
                hand.push(c);
                playSound('card');
            }
        }

        function renderThCommunityCardHTML(card) {
            const isRed = card.suit === '♥' || card.suit === '♦';
            const colorClass = isRed ? 'red' : 'black';
            const front = `<div class="playing-card ${colorClass}">
                <div class="text-[10px] sm:text-xs font-bold leading-none">${card.value}<br>${card.suit}</div>
                <div class="text-center text-base sm:text-lg">${card.suit}</div>
                <div class="text-[10px] sm:text-xs font-bold leading-none text-right">${card.value}<br>${card.suit}</div>
            </div>`;
            const revealClass = card.revealed ? ' revealed' : '';
            const popClass = card.justRevealed ? ' revealing' : '';
            return `<div class="th-community-card${revealClass}${popClass}" aria-label="${card.revealed ? `${card.value}${card.suit}` : '뒤집힌 커뮤니티 카드'}">
                <div class="th-card-flip-inner">
                    <div class="th-card-face th-card-face-back"><div class="playing-card back"></div></div>
                    <div class="th-card-face th-card-face-front">${front}</div>
                </div>
            </div>`;
        }

        function revealThCommunityCards(indices, done) {
            thRevealInProgress = true;
            disableThActionButtons();
            let i = 0;
            const revealNext = () => {
                if (i >= indices.length) {
                    thCommunityCards.forEach(c => c.justRevealed = false);
                    thRevealInProgress = false;
                    renderThBoard();
                    if (typeof done === 'function') done();
                    return;
                }
                const card = thCommunityCards[indices[i++]];
                if (card) {
                    card.revealed = true;
                    card.justRevealed = true;
                    playSound('card');
                    renderThBoard();
                }
                setTimeout(revealNext, 420);
            };
            setTimeout(revealNext, 180);
        }

        function renderThBoard() {
            const pEl = document.getElementById('th-player-cards');
            if (pEl) pEl.innerHTML = thPlayerHand.map(c => renderCardHTML(c)).join('');
            document.getElementById('th-community-cards').innerHTML = thCommunityCards.map(c => renderThCommunityCardHTML(c)).join('');

            thNpcHands.forEach((npc, idx) => {
                const cEl = document.getElementById(`th-npc-cards-${idx}`);
                const bEl = document.getElementById(`th-npc-bet-${idx}`);
                const sEl = document.getElementById(`th-npc-status-${idx}`);
                if (cEl) cEl.innerHTML = npc.cards.map(c => renderCardHTML(c)).join('');
                if (bEl) bEl.innerText = `$${npc.bet}`;
                if (sEl) sEl.innerText = npc.status;
            });

            if (thPlayerHand.length === 2) {
                const visibleCommunityCards = thCommunityCards.filter(c => c.revealed);
                const evalRes = evaluate7CardHand([...thPlayerHand, ...visibleCommunityCards]);
                document.getElementById('th-player-hand-rank').innerText = evalRes.rankName;
            }

            thPlayerHand.forEach(c => c.isNew = false);
            thCommunityCards.forEach(c => c.isNew = false);
            thNpcHands.forEach(n => n.cards.forEach(c => c.isNew = false));
        }

        function getThAllInEligibility() {
            if (balance <= 0) {
                return { allowed: false, reason: '잔액이 없습니다.' };
            }

            const baseBet = thPlayerTotalContribution || thBet || 10;
            // 숏스택(위기) 조건: 남은 잔액이 시작 베팅의 3배 이하이거나 $200 이하인 경우
            const isShortStack = balance <= Math.max(200, baseBet * 3);

            // 1. 프리플랍(thStage === 0) 제한: 숏스택이 아닌 경우 프리플랍 올인 불가
            if (thStage === 0) {
                if (!isShortStack) {
                    return {
                        allowed: false,
                        reason: '프리플랍 올인 불가 (플랍 3장 공개 후 가능)'
                    };
                }
            }

            // 2. 족보 검증
            const visibleCommunity = thCommunityCards.filter(c => c.revealed);
            let playerCategory = -1;
            let rankName = '미확인';

            if (thPlayerHand.length === 2 && visibleCommunity.length >= 3) {
                const evalRes = evaluate7CardHand([...thPlayerHand, ...visibleCommunity]);
                playerCategory = evalRes.category;
                rankName = evalRes.rankName;
            } else if (thPlayerHand.length === 2 && visibleCommunity.length === 0) {
                if (thPlayerHand[0].value === thPlayerHand[1].value) {
                    playerCategory = 1;
                    rankName = '포켓 페어';
                } else {
                    playerCategory = 0;
                    rankName = '하이카드';
                }
            }

            // 최소 원페어 이상 (playerCategory >= 1) 이면 허용
            if (playerCategory >= 1) {
                return { allowed: true, reason: `올인 가능! [${rankName}] 완성` };
            }

            // 숏스택 위기 긴급 올인 허용
            if (isShortStack) {
                return { allowed: true, reason: '올인 가능! (잔액 위기 숏스택 긴급 올인)' };
            }

            return {
                allowed: false,
                reason: '올인 불가 (원페어 이상 패를 만들거나 잔액 부족 시 가능)'
            };
        }

        function updateThAllInRuleBadge(status) {
            const badge = document.getElementById('th-allin-badge');
            const icon = document.getElementById('th-allin-badge-icon');
            const text = document.getElementById('th-allin-badge-text');
            if (!badge || !icon || !text) return;

            if (status && status.allowed) {
                badge.className = 'flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg border border-emerald-500/50 bg-emerald-950/60 text-emerald-300 transition shadow-[0_0_10px_rgba(16,185,129,0.2)]';
                icon.className = 'fa-solid fa-lock-open text-emerald-400';
                text.innerText = `🔥 ${status.reason}`;
            } else {
                badge.className = 'flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-900/80 text-slate-400 transition';
                icon.className = 'fa-solid fa-lock text-amber-400';
                const reasonStr = status ? status.reason : '플랍 이후 & 원페어 이상 (또는 숏스택)';
                text.innerText = `🔒 올인 조건: ${reasonStr}`;
            }
        }

        function enableThActionButtons() {
            const toCall = Math.max(0, thCurrentBet - thPlayerStreetBet);
            document.getElementById('th-btn-fold').disabled = false;
            document.getElementById('th-btn-check').disabled = toCall > 0;
            document.getElementById('th-btn-call').disabled = toCall <= 0 || balance < toCall;
            document.getElementById('th-btn-raise').disabled = balance <= 0 || balance < toCall + thRaiseIncrement;

            const allInStatus = getThAllInEligibility();
            const btnAllIn = document.getElementById('th-btn-allin');
            btnAllIn.disabled = !allInStatus.allowed;
            if (allInStatus.allowed) {
                btnAllIn.classList.remove('opacity-40', 'cursor-not-allowed');
                btnAllIn.classList.add('ready-allin');
                btnAllIn.innerHTML = '<i class="fa-solid fa-fire mr-1 text-amber-300"></i>ALL IN';
                btnAllIn.title = allInStatus.reason;
            } else {
                btnAllIn.classList.add('opacity-40', 'cursor-not-allowed');
                btnAllIn.classList.remove('ready-allin');
                btnAllIn.innerHTML = '<i class="fa-solid fa-lock mr-1 text-[10px]"></i>ALL IN';
                btnAllIn.title = allInStatus.reason;
            }

            updateThAllInRuleBadge(allInStatus);

            document.getElementById('th-btn-call').innerText = toCall > 0 ? `CALL $${toCall.toLocaleString()}` : 'CALL';
            document.getElementById('th-btn-raise').innerText = `RAISE +$${thRaiseIncrement.toLocaleString()}`;
        }

        function disableThActionButtons() {
            document.getElementById('th-btn-fold').disabled = true;
            document.getElementById('th-btn-check').disabled = true;
            document.getElementById('th-btn-call').disabled = true;
            document.getElementById('th-btn-raise').disabled = true;

            const btnAllIn = document.getElementById('th-btn-allin');
            if (btnAllIn) {
                btnAllIn.disabled = true;
                btnAllIn.classList.add('opacity-40');
                btnAllIn.classList.remove('ready-allin');
                btnAllIn.innerHTML = 'ALL IN';
            }
            updateThAllInRuleBadge(null);
        }

        function prepareThBettingRound() {
            thCurrentBet = 0;
            thPlayerStreetBet = 0;
            const baseBet = (thPlayerTotalContribution || thBet || 10);
            const visibleCards = thCommunityCards.filter(c => c.revealed);

            thNpcHands.forEach(npc => {
                npc.streetBet = 0;
                if (npc.folded) return;

                // NPC 패 족보 평가
                let cat = 0;
                let rankName = '하이카드';
                if (visibleCards.length >= 3) {
                    const evalRes = evaluate7CardHand([...npc.cards, ...visibleCards]);
                    cat = evalRes.category;
                    rankName = evalRes.rankName;
                } else if (npc.cards.length === 2 && npc.cards[0].value === npc.cards[1].value) {
                    cat = 1;
                    rankName = '포켓 페어';
                }

                const aggression = (npc.info.risk || 16) / 20;

                // 패의 강도와 공격성에 따른 베팅 확률 및 배율
                let shouldBet = false;
                let betMultiplier = 1;

                if (cat >= 2) {
                    // 투페어 이상 (강력한 패): 75% 베팅 (1배 또는 2배)
                    shouldBet = Math.random() < 0.75;
                    betMultiplier = Math.random() < 0.4 ? 2 : 1;
                } else if (cat === 1) {
                    // 원페어: 45% 베팅 (1배)
                    shouldBet = Math.random() < 0.45;
                    betMultiplier = 1;
                } else {
                    // 하이카드: 공격성 높은 봇 위주 가끔 블러핑 베팅
                    shouldBet = Math.random() < (aggression > 0.8 ? 0.20 : 0.08);
                    betMultiplier = 1;
                }

                if (shouldBet) {
                    const betAmt = Math.max(10, Math.round(baseBet * betMultiplier));
                    if (betAmt > thCurrentBet) {
                        const extra = betAmt - npc.streetBet;
                        npc.streetBet = betAmt;
                        npc.bet += extra;
                        thPot += extra;
                        thCurrentBet = betAmt;
                        npc.status = `베팅 $${betAmt.toLocaleString()}`;
                    } else if (thCurrentBet > 0 && npc.streetBet < thCurrentBet) {
                        const extra = thCurrentBet - npc.streetBet;
                        npc.streetBet = thCurrentBet;
                        npc.bet += extra;
                        thPot += extra;
                        npc.status = `콜 $${thCurrentBet.toLocaleString()}`;
                    }
                } else {
                    if (thCurrentBet > 0) {
                        // 앞서 누군가 베팅했을 때: 원페어 이상이거나 콜 확률 통과 시 콜, 아니면 폴드
                        if (cat >= 1 || Math.random() > 0.65) {
                            const extra = thCurrentBet - npc.streetBet;
                            npc.streetBet = thCurrentBet;
                            npc.bet += extra;
                            thPot += extra;
                            npc.status = `콜 $${thCurrentBet.toLocaleString()}`;
                        } else {
                            npc.folded = true;
                            npc.status = '폴드';
                        }
                    } else {
                        npc.status = '체크';
                    }
                }
            });
            document.getElementById('th-pot-amount').innerText = `$${thPot.toLocaleString()}`;
            renderThBoard();
        }

        function runAllInShowdown() {
            disableThActionButtons();
            if (thCommunityCards.length === 0) {
                for (let i = 0; i < 5; i++) {
                    const card = thDeck.pop();
                    if (!card) break;
                    card.revealed = false;
                    card.justRevealed = false;
                    thCommunityCards.push(card);
                }
            }
            const unrevealed = thCommunityCards.map((c, i) => c.revealed ? -1 : i).filter(i => i >= 0);
            
            const runout = () => {
                setTimeout(() => settleThShowdown(false), 1800);
            };

            const revealNext = (pos) => {
                if (pos >= unrevealed.length) { runout(); return; }
                revealThCommunityCards([unrevealed[pos]], () => revealNext(pos + 1));
            };
            setTimeout(() => revealNext(0), 1200);
        }

        function thPlayerAction(action) {
            if (!thInRound || thRevealInProgress) return;
            const toCall = Math.max(0, thCurrentBet - thPlayerStreetBet);

            if (action === 'fold') {
                disableThActionButtons();
                settleThShowdown(true);
                return;
            }
            if (action === 'check' && toCall > 0) {
                document.getElementById('th-status').innerText = `콜 금액 $${toCall}이 필요합니다. 체크할 수 없습니다.`;
                return;
            }
            if (action === 'call' && toCall <= 0) {
                document.getElementById('th-status').innerText = '상대 베팅이 없습니다. 체크를 선택하세요.';
                return;
            }

            let playerContribution = 0;
            thLastActionWasAllIn = action === 'allin';

            if (action === 'allin') {
                const eligibility = getThAllInEligibility();
                if (!eligibility.allowed) {
                    document.getElementById('th-status').innerText = `⚠️ ${eligibility.reason}`;
                    playSound('chip');
                    enableThActionButtons();
                    return;
                }
                playerContribution = balance;
                thPlayerStreetBet += playerContribution;
                thCurrentBet = Math.max(thCurrentBet, thPlayerStreetBet);
                triggerAllInEffect();
            } else if (action === 'call') {
                playerContribution = toCall;
                thPlayerStreetBet += toCall;
            } else if (action === 'raise') {
                playerContribution = toCall + thRaiseIncrement;
                thPlayerStreetBet += playerContribution;
                thCurrentBet = thPlayerStreetBet;
                
                thNpcHands.forEach(npc => {
                    if (npc.folded) return;
                    const aggression = (npc.info.risk || 16) / 20;

                    const visibleCards = thCommunityCards.filter(c => c.revealed);
                    let cat = 0;
                    let rankName = '하이카드';
                    if (visibleCards.length >= 3) {
                        const evalRes = evaluate7CardHand([...npc.cards, ...visibleCards]);
                        cat = evalRes.category;
                        rankName = evalRes.rankName;
                    } else if (npc.cards.length === 2 && npc.cards[0].value === npc.cards[1].value) {
                        cat = 1;
                        rankName = '포켓 페어';
                    }

                    const baseBet = thPlayerTotalContribution || thBet || 10;
                    const raiseRatio = thRaiseIncrement / baseBet;

                    let foldChance = 0.35;
                    if (cat === 0) {
                        // 하이카드: 레이즈 인상폭이 클수록 더 많이 폴드
                        foldChance = raiseRatio >= 3 ? 0.85 : 0.65;
                    } else if (cat === 1) {
                        // 원페어: 거액 레이즈(5배 이상)가 아니면 80% 콜
                        foldChance = raiseRatio >= 5 ? 0.45 : 0.20;
                    } else {
                        // 투페어 이상: 거의 무조건 콜
                        foldChance = 0.06;
                    }

                    foldChance = Math.max(0.05, foldChance - (aggression - 0.75) * 0.25);

                    if (Math.random() < foldChance) {
                        npc.folded = true;
                        npc.status = '폴드';
                    } else {
                        const extra = Math.max(0, thCurrentBet - npc.streetBet);
                        npc.streetBet += extra;
                        npc.bet += extra;
                        thPot += extra;
                        npc.status = `콜 [${rankName}]`;
                    }
                });
            }

            if (playerContribution > balance) {
                document.getElementById('th-status').innerText = '잔액이 부족합니다.';
                enableThActionButtons();
                return;
            }

            if (playerContribution > 0) {
                balance -= playerContribution;
                thPlayerTotalContribution += playerContribution;
                thPot += playerContribution;
                updateGlobalBalanceUI();
                playSound('chip');
            }

            if (balance === 0 && action !== 'allin') {
                thLastActionWasAllIn = true;
                triggerAllInEffect();
            }

            if (action === 'allin' && playerContribution > 0) {
                thNpcHands.forEach(npc => {
                    if (npc.folded) return;
                    const aggression = (npc.info.risk || 16) / 20;

                    // NPC 패 족보 평가
                    const visibleCards = thCommunityCards.filter(c => c.revealed);
                    let npcCat = 0;
                    let npcRankName = '하이카드';
                    if (visibleCards.length >= 3) {
                        const evalRes = evaluate7CardHand([...npc.cards, ...visibleCards]);
                        npcCat = evalRes.category;
                        npcRankName = evalRes.rankName;
                    } else if (npc.cards.length === 2 && npc.cards[0].value === npc.cards[1].value) {
                        npcCat = 1;
                        npcRankName = '포켓 페어';
                    }

                    // 시작 베팅 대비 올인액 배율 (오버벳 판별)
                    const isHugeBet = playerContribution > ((thPlayerTotalContribution || 10) * 4);

                    let foldChance = 0.5;
                    if (npcCat === 0) {
                        // 하이카드: 올인에는 95% 폴드 (무지성 기부 방지)
                        foldChance = 0.95;
                    } else if (npcCat === 1) {
                        // 원페어: 거액 올인이면 70% 폴드, 보통 올인이면 40% 폴드
                        foldChance = isHugeBet ? 0.70 : 0.40;
                    } else if (npcCat === 2) {
                        // 투페어: 좋은 패 (거액 35% 폴드, 보통 15% 폴드)
                        foldChance = isHugeBet ? 0.35 : 0.15;
                    } else {
                        // 트리플 이상: 몬스터 핸드 (거의 무조건 콜)
                        foldChance = 0.05;
                    }

                    // 성향(공격성) 보정
                    foldChance = Math.max(0.05, foldChance - (aggression - 0.75) * 0.25);

                    if (Math.random() < foldChance) {
                        npc.folded = true;
                        npc.status = `올인에 폴드 (${npcRankName})`;
                    } else {
                        const extra = Math.max(0, thCurrentBet - npc.streetBet);
                        npc.streetBet += extra;
                        npc.bet += extra;
                        thPot += extra;
                        npc.status = `올인 콜! [${npcRankName}]`;
                    }
                });
            }

            document.getElementById('th-pot-amount').innerText = `$${thPot.toLocaleString()}`;
            renderThBoard();
            disableThActionButtons();

            if (thNpcHands.every(npc => npc.folded)) {
                thInRound = false;
                balance += thPot;
                document.getElementById('th-status').innerText = `🎉 모든 상대가 폴드했습니다. 팟 $${thPot.toLocaleString()} 획득!`;
                playSound('win');
                finishThRound();
                return;
            }

            if (action === 'allin' || balance === 0) {
                document.getElementById('th-status').innerText = '🔥 올인! 승부를 결정지을 카드가 오픈됩니다…';
                runAllInShowdown();
                return;
            }

            thStage++;
            if (thStage === 1) {
                for (let i = 0; i < 5; i++) {
                    const card = thDeck.pop();
                    if (!card) break;
                    card.revealed = false;
                    card.justRevealed = false;
                    thCommunityCards.push(card);
                }
                renderThBoard();
                document.getElementById('th-status').innerText = '플랍(Flop): 커뮤니티 카드 3장을 공개합니다…';
                revealThCommunityCards([0, 1, 2], () => {
                    prepareThBettingRound();
                    document.getElementById('th-status').innerText = '플랍(Flop): 액션을 선택하세요.';
                    enableThActionButtons();
                });
            } else if (thStage === 2) {
                document.getElementById('th-status').innerText = '턴(Turn): 네 번째 카드를 공개합니다…';
                revealThCommunityCards([3], () => {
                    prepareThBettingRound();
                    document.getElementById('th-status').innerText = '턴(Turn): 액션을 선택하세요.';
                    enableThActionButtons();
                });
            } else if (thStage === 3) {
                document.getElementById('th-status').innerText = '리버(River): 마지막 카드를 공개합니다…';
                revealThCommunityCards([4], () => {
                    prepareThBettingRound();
                    document.getElementById('th-status').innerText = '리버(River): 마지막 액션!';
                    enableThActionButtons();
                });
            } else {
                settleThShowdown(false);
            }
        }

        function finishThRound() {
            thRevealInProgress = false;
            thBet = 0;
            thCurrentBet = 0;
            thPlayerStreetBet = 0;
            thPlayerTotalContribution = 0;

            updateGlobalBalanceUI();
            updateGameBetsUI();
            document.getElementById('th-btn-deal').disabled = false;
            document.getElementById('th-npc-control').classList.remove('opacity-40', 'pointer-events-none');
            disableThActionButtons();
            
            setTimeout(() => {
                checkBankruptOrEnding();
            }, 1500);
        }

        function settleThShowdown(playerFolded) {
            thInRound = false;
            thRevealInProgress = false;
            if (!playerFolded) thCommunityCards.forEach(c => c.revealed = true);
            document.getElementById('th-npc-control').classList.remove('opacity-40', 'pointer-events-none');
            disableThActionButtons();

            thNpcHands.forEach(npc => npc.cards.forEach(c => c.hidden = false));
            renderThBoard();

            if (playerFolded) {
                playSound('lose');
                document.getElementById('th-status').innerText = '폴드로 이번 판을 포기했습니다. 베팅한 금액은 팟에 남습니다.';
            } else {
                const board = thCommunityCards.slice(0, 5);
                const contenders = [{
                    name: 'YOU (나)',
                    player: true,
                    eval: evaluate7CardHand([...thPlayerHand, ...board])
                }];

                thNpcHands.forEach(npc => {
                    if (npc.folded) return;
                    contenders.push({
                        name: npc.info.name,
                        player: false,
                        eval: evaluate7CardHand([...npc.cards, ...board])
                    });
                });

                const compareHands = (a, b) => {
                    if (a.category !== b.category) return a.category - b.category;
                    const ak = a.kickers || [];
                    const bk = b.kickers || [];
                    for (let i = 0; i < Math.max(ak.length, bk.length, 5); i++) {
                        const diff = (ak[i] || 0) - (bk[i] || 0);
                        if (diff !== 0) return diff;
                    }
                    return 0;
                };
                let best = contenders[0].eval;
                contenders.slice(1).forEach(c => {
                    if (compareHands(c.eval, best) > 0) best = c.eval;
                });
                const winners = contenders.filter(c => compareHands(c.eval, best) === 0);
                const playerWins = winners.some(w => w.player);

                if (playerWins) {
                    const share = Math.floor(thPot / winners.length);
                    balance += share;
                    lifetimeProfit += share - thPlayerTotalContribution;
                    document.getElementById('th-status').innerText = winners.length > 1
                        ? `🤝 무승부! ${winners.map(w => `${w.name} (${w.eval.rankName})`).join(', ')}가 팟을 나눕니다. $${share.toLocaleString()} 획득`
                        : `🎉 승리! ${winners[0].name} [${best.rankName}] 팟 $${share.toLocaleString()} 획득`;
                    playSound('win');
                } else {
                    const winnerRanks = winners.map(w => `${w.name}: ${w.eval.rankName}`).join(' / ');
                    document.getElementById('th-status').innerText =
                        `${winnerRanks} 승리! 내 족보: ${contenders[0].eval.rankName}`;
                    playSound('lose');
                }
            }
            finishThRound();
        }

        function evaluate7CardHand(cards) {
            const vMap = { '2':2, '3':3, '4':4, '5':5, '6':6, '7':7, '8':8, '9':9, '10':10, 'J':11, 'Q':12, 'K':13, 'A':14 };
            const parsed = cards.map(c => ({ val: vMap[c.value], suit: c.suit })).filter(c => c.val);
            if (parsed.length < 5) return { score: 0, rankName: '카드 부족' };

            let best = null;
            const rankNames = [
                '하이카드 (High Card)', '원페어 (One Pair)', '투페어 (Two Pair)',
                '트리플 (Three of a Kind)', '스트레이트 (Straight)', '플러시 (Flush)',
                '풀하우스 (Full House)', '포카드 (Four of a Kind)',
                '스트레이트 플러시 (Straight Flush)'
            ];
            function encode(category, kickers) {
                let score = category;
                for (let i = 0; i < 5; i++) score = score * 15 + (kickers[i] || 0);
                return score;
            }
            function evaluateFive(hand) {
                const vals = hand.map(c => c.val).sort((a,b) => b-a);
                const counts = {};
                vals.forEach(v => counts[v] = (counts[v] || 0) + 1);
                const groups = Object.entries(counts).map(([v,n]) => ({val:Number(v), count:n}))
                    .sort((a,b) => b.count-a.count || b.val-a.val);
                const flush = hand.every(c => c.suit === hand[0].suit);
                const unique = [...new Set(vals)].sort((a,b) => b-a);
                let straightHigh = 0;
                if (unique.length === 5) {
                    if (unique[0] - unique[4] === 4) straightHigh = unique[0];
                    else if (unique.join(',') === '14,5,4,3,2') straightHigh = 5;
                }
                if (flush && straightHigh) return { category:8, kickers:[straightHigh], rankName:rankNames[8] };
                if (groups[0].count === 4) return { category:7, kickers:[groups[0].val, ...groups.slice(1).map(g=>g.val)], rankName:rankNames[7] };
                if (groups[0].count === 3 && groups[1].count === 2) return { category:6, kickers:[groups[0].val, groups[1].val], rankName:rankNames[6] };
                if (flush) return { category:5, kickers:vals, rankName:rankNames[5] };
                if (straightHigh) return { category:4, kickers:[straightHigh], rankName:rankNames[4] };
                if (groups[0].count === 3) return { category:3, kickers:[groups[0].val, ...groups.slice(1).map(g=>g.val).sort((a,b)=>b-a)], rankName:rankNames[3] };
                if (groups[0].count === 2 && groups[1].count === 2) {
                    const pairVals = groups.filter(g=>g.count===2).map(g=>g.val).sort((a,b)=>b-a);
                    return { category:2, kickers:[...pairVals, ...groups.filter(g=>g.count===1).map(g=>g.val)], rankName:rankNames[2] };
                }
                if (groups[0].count === 2) return { category:1, kickers:[groups[0].val, ...groups.filter(g=>g.count===1).map(g=>g.val).sort((a,b)=>b-a)], rankName:rankNames[1] };
                return { category:0, kickers:vals, rankName:rankNames[0] };
            }

            for (let a=0; a<parsed.length-4; a++)
            for (let b=a+1; b<parsed.length-3; b++)
            for (let c=b+1; c<parsed.length-2; c++)
            for (let d=c+1; d<parsed.length-1; d++)
            for (let e=d+1; e<parsed.length; e++) {
                const result = evaluateFive([parsed[a], parsed[b], parsed[c], parsed[d], parsed[e]]);
                result.score = encode(result.category, result.kickers);
                if (!best || result.score > best.score) best = result;
            }
            return { score: best.score, rankName: best.rankName, category: best.category, kickers: best.kickers };
        }
