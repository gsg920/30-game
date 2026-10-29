let balance = 1000;
        let lifetimeProfit = 0;
        let currentView = 'lobby';

        const storyItems = [
            { id: 'clothes', name: '멀쩡한 옷 한 벌', icon: 'fa-shirt', price: 2000, resale: 700, desc: '카지노를 떠나기 위한 최소한의 품위.' },
            { id: 'wallet', name: '가죽 지갑', icon: 'fa-wallet', price: 8000, resale: 3000, desc: '현금과 신분증을 넣을 수 있다.' },
            { id: 'phone', name: '스마트폰', icon: 'fa-mobile-screen-button', price: 10000, resale: 6000, desc: '택시를 부를 수 있게 된다.' },
            { id: 'car', name: '자동차 열쇠와 차량', icon: 'fa-car', price: 50000, resale: 20000, desc: '직접 운전해서 집으로 돌아간다.' }
        ];
        const ownedItems = { clothes: false, wallet: false, phone: false, car: false };
        // 이긴 판의 이익만 더한 누적 승리금이 이 값 이상이면 최고 엔딩 대신 블랙리스트 엔딩이 된다.
        const BLACKLIST_PROFIT = 500000;

        const suits = ['♠', '♥', '♦', '♣'];
        const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

        function clearAllInEffects() {
            ['bj', 'r', 'th'].forEach(prefix => {
                const table = document.getElementById(`${prefix}-table-container`);
                const banner = document.getElementById(`${prefix}-allin-banner`);
                if (table) table.classList.remove('allin-active');
                if (banner) banner.classList.remove('animate');
            });
        }

        function triggerAllInEffect() {
            playSound('allin');
            let tableEl, bannerEl;

            if (currentView === 'blackjack') {
                tableEl = document.getElementById('bj-table-container');
                bannerEl = document.getElementById('bj-allin-banner');
            } else if (currentView === 'roulette') {
                tableEl = document.getElementById('r-table-container');
                bannerEl = document.getElementById('r-allin-banner');
            } else if (currentView === 'holdem') {
                tableEl = document.getElementById('th-table-container');
                bannerEl = document.getElementById('th-allin-banner');
            }

            if (tableEl) {
                tableEl.classList.add('allin-active');
                setTimeout(() => tableEl.classList.remove('allin-active'), 1200);
            }

            if (bannerEl) {
                bannerEl.classList.remove('animate');
                void bannerEl.offsetWidth; // Reflow
                bannerEl.classList.add('animate');
                setTimeout(() => {
                    bannerEl.classList.remove('animate');
                }, 1300);
            }
        }

        function updateGlobalBalanceUI() {
            document.getElementById('global-balance').innerText = `$${balance.toLocaleString()}`;
            if (!document.getElementById('shop-modal').classList.contains('hidden')) renderShop();
        }

        function switchView(viewName) {
            if (bjInRound || rInSpin || thInRound) {
                alert("현재 라운드가 진행 중입니다! 끝난 후 이동 가능합니다.");
                return;
            }

            clearAllInEffects();

            if (viewName === 'lobby') resetFinishedGameDisplays();

            currentView = viewName;
            ['lobby', 'blackjack', 'roulette', 'holdem'].forEach(v => {
                const el = document.getElementById(`view-${v}`);
                if (el) {
                    if (v === viewName) {
                        el.classList.remove('hidden');
                        el.classList.add('flex');
                    } else {
                        el.classList.add('hidden');
                        el.classList.remove('flex');
                    }
                }
            });

            const returnBtn = document.getElementById('btn-return-lobby');
            if (viewName === 'lobby') returnBtn.classList.add('hidden');
            else returnBtn.classList.remove('hidden');

            if (viewName === 'roulette') drawRouletteWheel();
        }

        function resetFinishedGameDisplays() {
            clearAllInEffects();
            const pendingBjRefund = Math.max(0, bjBet || 0);
            const pendingThRefund = Math.max(0, thBet || 0);
            if (pendingBjRefund + pendingThRefund > 0) {
                balance += pendingBjRefund + pendingThRefund;
            }

            // Blackjack
            bjInRound = false;
            bjBet = 0;
            bjDeck = []; bjDealerHand = []; bjPlayerHand = []; bjNpcHands = [];
            setupBjPlayerSeats();
            const bjPlayer = document.getElementById('bj-player-cards');
            const bjDealer = document.getElementById('bj-dealer-cards');
            if (bjPlayer) bjPlayer.innerHTML = '';
            if (bjDealer) bjDealer.innerHTML = '';
            const bjPlayerScore = document.getElementById('bj-player-score');
            const bjDealerScore = document.getElementById('bj-dealer-score');
            const bjPlayerStatus = document.getElementById('bj-player-status');
            if (bjPlayerScore) bjPlayerScore.innerText = '-';
            if (bjDealerScore) bjDealerScore.innerText = '?';
            if (bjPlayerStatus) bjPlayerStatus.innerText = '';
            const bjStatus = document.getElementById('bj-status');
            if (bjStatus) bjStatus.innerText = '베팅금을 정하고 DEAL을 눌러 블랙잭을 시작하세요.';
            const bjDeal = document.getElementById('bj-btn-deal');
            const bjHit = document.getElementById('bj-btn-hit');
            const bjStand = document.getElementById('bj-btn-stand');
            const bjDouble = document.getElementById('bj-btn-double');
            if (bjDouble) bjDouble.disabled = true;
            bjPlayerBlackjack = false;
            if (bjDeal) bjDeal.disabled = false;
            if (bjHit) bjHit.disabled = true;
            if (bjStand) bjStand.disabled = true;
            const bjNpcControl = document.getElementById('bj-npc-control');
            if (bjNpcControl) bjNpcControl.classList.remove('opacity-40', 'pointer-events-none');

            // Roulette
            const pendingRouletteRefund = Object.values(rouletteBets).reduce((sum, amount) => sum + amount, 0);
            if (pendingRouletteRefund > 0) balance += pendingRouletteRefund;
            rouletteBets = {};
            rInSpin = false;
            const spinButton = document.getElementById('btn-spin-roulette');
            if (spinButton) spinButton.disabled = false;
            updateRouletteBetsUI();
            const rouletteStatus = document.getElementById('roulette-status');
            if (rouletteStatus) rouletteStatus.innerText = '원하는 번호나 구역에 베팅하세요';
            const rouletteResult = document.getElementById('roulette-result-display');
            if (rouletteResult) rouletteResult.innerText = '결과 대기 중';

            // Texas Hold'em
            thInRound = false;
            thBet = 0;
            thPot = 0; thCurrentBet = 0; thPlayerStreetBet = 0; thPlayerTotalContribution = 0;
            thStage = 0; thDeck = []; thCommunityCards = []; thPlayerHand = []; thNpcHands = [];
            thRevealInProgress = false; thLastActionWasAllIn = false;
            
            const thCommunity = document.getElementById('th-community-cards');
            const thPlayer = document.getElementById('th-player-cards');
            const thPotEl = document.getElementById('th-pot-amount');
            const thStatus = document.getElementById('th-status');
            if (thCommunity) thCommunity.innerHTML = '';
            if (thPlayer) thPlayer.innerHTML = '';
            if (thPotEl) thPotEl.innerText = '$0';
            if (thStatus) thStatus.innerText = '베팅금을 정하고 DEAL을 눌러 텍사스 홀덤을 시작하세요.';
            const thSeats = document.getElementById('th-players-container');
            if (thSeats) thSeats.innerHTML = '';
            setupThPlayerSeats();
            const thDeal = document.getElementById('th-btn-deal');
            if (thDeal) thDeal.disabled = false;
            const thNpcControl = document.getElementById('th-npc-control');
            if (thNpcControl) thNpcControl.classList.remove('opacity-40', 'pointer-events-none');
            disableThActionButtons();
            const thRank = document.getElementById('th-player-hand-rank');
            if (thRank) thRank.innerText = '';
            updateGlobalBalanceUI();
            updateGameBetsUI();
        }

        function closeIntroModal() { document.getElementById('intro-modal').classList.add('hidden'); }
        function openShopModal() { renderShop(); document.getElementById('shop-modal').classList.remove('hidden'); }
        function closeShopModal() { document.getElementById('shop-modal').classList.add('hidden'); }
        function openInventoryModal() { renderInventory(); document.getElementById('inventory-modal').classList.remove('hidden'); }
        function closeInventoryModal() { document.getElementById('inventory-modal').classList.add('hidden'); }
        function closeEndingModal() { document.getElementById('ending-modal').classList.add('hidden'); }

        // 옷이 없는 채로 잔액이 파산 기준($10) 아래가 되는 구매는 막는다. 옷도 돈도 없으면 더 진행할 수 없다.
        function isPurchaseBlocked(item) {
            return !ownedItems.clothes && item.id !== 'clothes' && balance - item.price < 10;
        }

        function renderShop() {
            const container = document.getElementById('shop-items');
            container.innerHTML = storyItems.map(item => {
                const owned = ownedItems[item.id];
                const canAfford = balance >= item.price && !isPurchaseBlocked(item);
                return `<div class="bg-slate-900 border ${owned ? 'border-emerald-600/50' : 'border-slate-800'} rounded-xl p-4 flex gap-3 items-center">
                    <div class="w-12 h-12 flex-shrink-0 rounded-xl bg-slate-800 flex items-center justify-center text-2xl ${owned ? 'text-emerald-400' : 'text-amber-400'}"><i class="fa-solid ${item.icon}"></i></div>
                    <div class="flex-1 min-w-0"><div class="font-bold text-white">${item.name}</div><div class="text-xs text-slate-400 mt-1">${item.desc}</div><div class="text-amber-300 font-black mt-2">$${item.price.toLocaleString()}</div></div>
                    <button onclick="buyStoryItem('${item.id}')" ${owned || !canAfford ? 'disabled' : ''} class="text-xs font-black px-3 py-2 rounded-lg whitespace-nowrap ${owned ? 'bg-emerald-900 text-emerald-300' : canAfford ? 'bg-amber-500 hover:bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-500'} disabled:opacity-80">${owned ? '되찾음' : canAfford ? '되찾기' : balance >= item.price ? '옷이 먼저' : '잔액 부족'}</button>
                </div>`;
            }).join('');
            document.getElementById('shop-message').innerText = storyItems.some(item => !ownedItems[item.id] && balance >= item.price && isPurchaseBlocked(item))
                ? `보유 자금: $${balance.toLocaleString()} · 옷을 먼저 되찾고 최소 $10를 남겨야 다른 물건을 살 수 있습니다.`
                : `보유 자금: $${balance.toLocaleString()}`;
        }

        function buyStoryItem(id) {
            const item = storyItems.find(entry => entry.id === id);
            if (!item || ownedItems[id]) return;
            if (balance < item.price || isPurchaseBlocked(item)) return;
            balance -= item.price;
            ownedItems[id] = true;
            updateGlobalBalanceUI();
            playSound('chip');
            document.getElementById('shop-story').innerText = `전당포 주인이 ${item.name}을(를) 돌려줬다. 남은 돈은 $${balance.toLocaleString()}이다.`;
            renderShop();
            if (balance === 0) {
                closeShopModal();
                lockControlsWhenBroke();
            }
        }

        function lockControlsWhenBroke() {
            document.querySelectorAll('button').forEach(button => {
                if (button.closest('#ending-modal') || button.getAttribute('onclick')?.includes('leaveCasino()')) return;
                if (button.disabled) return;
                button.dataset.lockedByBroke = 'true';
                button.disabled = true;
                button.classList.add('opacity-50', 'cursor-not-allowed');
            });
        }

        function unlockControlsAfterRestart() {
            document.querySelectorAll('button[data-locked-by-broke="true"]').forEach(button => {
                button.disabled = false;
                button.classList.remove('opacity-50', 'cursor-not-allowed');
                delete button.dataset.lockedByBroke;
            });
        }

        function renderInventory() {
            const container = document.getElementById('inventory-items');
            container.innerHTML = storyItems.map(item => `<div class="flex items-center gap-3 p-3 rounded-xl border ${ownedItems[item.id] ? 'border-emerald-700/50 bg-emerald-950/30' : 'border-slate-800 bg-slate-900/70'}"><i class="fa-solid ${item.icon} w-6 text-center ${ownedItems[item.id] ? 'text-emerald-400' : 'text-slate-600'}"></i><span class="flex-1 text-sm ${ownedItems[item.id] ? 'text-white' : 'text-slate-500'}">${item.name}</span><span class="text-xs font-bold ${ownedItems[item.id] ? 'text-emerald-400' : 'text-slate-500'}">${ownedItems[item.id] ? '보유 중' : '전당포에 맡김'}</span></div>`).join('');
        }

        function forceSellItemsIfBroke() {
            if (balance >= 10) return;
            const ownedForSale = storyItems.filter(item => ownedItems[item.id]).sort((a, b) => b.resale - a.resale);
            const sold = [];
            for (const item of ownedForSale) {
                if (balance >= 10) break;
                ownedItems[item.id] = false;
                balance += item.resale;
                sold.push(`${item.name} ($${item.resale.toLocaleString()})`);
            }
            if (sold.length) {
                alert(`파산 위기! 소지 물건이 강제로 매각되었습니다: ${sold.join(', ')}`);
                updateGlobalBalanceUI();
            }
        }

        function checkBankruptOrEnding() {
            if (balance < 10) {
                forceSellItemsIfBroke();
                if (balance < 10) {
                    clearAllInEffects();
                    playSound('kickout');
                    showEndingImage('bankrupt-image', 'bankrupt-fallback', endingImages.bankrupt);
                    document.getElementById('bankrupt-modal').classList.remove('hidden');
                }
            }
        }

        const ENDING_IMAGE_DIR = 'images/endings/';
        const endingImages = {
            blacklist: 'ending-black.webp',
            highroller: 'ending-king.webp',
            broke: 'ending-broke-home.webp',
            car: 'ending-car.webp',
            taxi: 'ending-taxi.webp',
            bus: 'ending-bus.webp',
            bankrupt: 'ending-bankrupt.webp'
        };

        // 엔딩 화면이 열릴 때 바로 보이도록 미리 불러와 캐시에 올려 둔다.
        Object.values(endingImages).forEach(file => { new Image().src = ENDING_IMAGE_DIR + file; });

        // 이미지를 보여주고 대체 요소(아이콘/SVG)를 숨긴다. 이미지가 없거나 불러오지 못하면 대체 요소를 보여준다.
        function showEndingImage(imgId, fallbackId, file) {
            const img = document.getElementById(imgId);
            const fallback = document.getElementById(fallbackId);
            const showFallback = () => {
                img.classList.add('hidden');
                fallback.classList.remove('hidden');
            };
            img.onerror = showFallback;
            img.onload = () => {
                img.classList.remove('hidden');
                fallback.classList.add('hidden');
            };
            // 이미지가 준비되기 전에는 아이콘이 먼저 보이지 않도록 둘 다 숨겨 둔다.
            img.classList.add('hidden');
            fallback.classList.add('hidden');
            if (!file) {
                img.removeAttribute('src');
                showFallback();
                return;
            }
            img.src = ENDING_IMAGE_DIR + file;
            if (img.complete && img.naturalWidth > 0) img.onload();
        }

        function leaveCasino() {
            if (bjInRound || rInSpin || thInRound) {
                alert("진행 중인 라운드가 있습니다!");
                return;
            }
            clearAllInEffects();
            let title, icon, story, image = null, isBlocked = false;

            const hasEverything = balance >= 100000 && ownedItems.clothes && ownedItems.wallet && ownedItems.phone && ownedItems.car;
            if (hasEverything && lifetimeProfit >= BLACKLIST_PROFIT) {
                title = '블랙리스트'; icon = 'fa-user-slash'; image = endingImages.blacklist; story = `전 재산과 모든 소지품을 되찾았지만, 너무 많이 따 버렸다. 카지노는 당신의 이름을 입장 금지 명단에 올렸다. 이제 이 카지노의 문은 다시 열리지 않는다.`;
            } else if (hasEverything) {
                title = '전설의 하이롤러'; icon = 'fa-crown'; image = endingImages.highroller; story = `전 재산을 잃었던 당신은 $${balance.toLocaleString()}의 현금과 모든 소지품을 되찾았다. VIP 대접을 받으며 당당히 카지노를 떠난다. 이제 당신은 전설의 하이롤러다.`;
            } else if (!ownedItems.clothes) {
                title = '아직 떠날 수 없다'; icon = 'fa-ban'; 
                story = '전당포에 맡긴 최소한의 입을 옷조차 되찾지 못했습니다. 카지노에서 돈을 더 벌어 전당포에서 옷을 먼저 되찾으세요!';
                isBlocked = true;
            } else if (balance === 0 && ownedItems.clothes) {
                title = '빈털터리 귀환'; icon = 'fa-person-walking'; image = endingImages.broke; story = '카지노를 떠나기 위해 옷은 겨우 되찾았지만, 수중에 남은 돈은 한 푼도 없다. 결국 빈털터리로 집에 돌아갑니다.';
            } else if (ownedItems.car) {
                title = '내 차로 귀가'; icon = 'fa-car'; image = endingImages.car; story = '옷과 자동차를 되찾고 당당하게 전용 차량으로 카지노를 떠납니다.';
            } else if (ownedItems.phone) {
                title = '택시를 타고 귀가'; icon = 'fa-taxi'; image = endingImages.taxi; story = '스마트폰으로 택시를 불러 편안히 귀가합니다.';
            } else {
                title = '버스를 타고 귀가'; icon = 'fa-bus'; image = endingImages.bus; story = '옷은 되찾았고 약간의 돈도 남았다. 택시를 부를 형편은 아니지만, 버스를 타고 집으로 돌아갑니다.';
            }

            document.getElementById('ending-title').innerText = title;
            document.getElementById('ending-icon').innerHTML = `<i class="fa-solid ${icon}"></i>`;
            showEndingImage('ending-image', 'ending-icon', image);
            document.getElementById('ending-text').innerText = story;
            document.getElementById('ending-stats').innerText = `남은 돈: $${balance.toLocaleString()} · 누적 승리금: $${lifetimeProfit.toLocaleString()}`;

            const actionContainer = document.getElementById('ending-action-container');
            if (isBlocked) {
                actionContainer.innerHTML = `<button onclick="closeEndingModal()" class="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 rounded-xl transition">돈 벌러 돌아가기</button>`;
            } else {
                actionContainer.innerHTML = `<button onclick="restartGame()" class="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 rounded-xl transition">처음으로 돌아가기</button>`;
            }

            document.getElementById('ending-modal').classList.remove('hidden');
        }

        function restartGame() {
            unlockControlsAfterRestart();
            clearAllInEffects();
            bjInRound = false;
            rInSpin = false;
            thInRound = false;
            thRevealInProgress = false;
            thLastActionWasAllIn = false;

            balance = 1000;
            lifetimeProfit = 0;
            bjBet = 0;
            thBet = 0;
            thRaiseIncrement = 100;
            thRaiseAllIn = false;
            rouletteBets = {};
            Object.keys(ownedItems).forEach(id => ownedItems[id] = false);

            document.getElementById('bankrupt-modal').classList.add('hidden');
            document.getElementById('ending-modal').classList.add('hidden');
            resetFinishedGameDisplays();
            updateGlobalBalanceUI();
            updateGameBetsUI();
            switchView('lobby');
        }

        function renderCardHTML(card) {
            const animClass = card.isNew ? 'deal-animation' : '';
            if (card.hidden) return `<div class="playing-card back ${animClass}"></div>`;
            const isRed = card.suit === '♥' || card.suit === '♦';
            const colorClass = isRed ? 'red' : 'black';
            return `
                <div class="playing-card ${colorClass} ${animClass}">
                    <div class="text-[10px] sm:text-xs font-bold leading-none">${card.value}<br>${card.suit}</div>
                    <div class="text-center text-base sm:text-lg">${card.suit}</div>
                    <div class="text-[10px] sm:text-xs font-bold leading-none text-right">${card.value}<br>${card.suit}</div>
                </div>
            `;
        }

        function createDeck() {
            const d = [];
            for (let suit of suits) { for (let val of values) { d.push({ suit, value: val }); } }
            for (let i = d.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [d[i], d[j]] = [d[j], d[i]];
            }
            return d;
        }

        function addBet(gameType, amount) {
            if (gameType === 'bj' && bjInRound) return;
            if (gameType === 'th' && thInRound) return;
            if (balance >= amount) {
                balance -= amount;
                if (gameType === 'bj') bjBet += amount;
                if (gameType === 'th') thBet += amount;
                updateGlobalBalanceUI();
                updateGameBetsUI();
                playSound('chip');
            }
        }

        function allInBet(gameType) {
            if (gameType === 'bj' && bjInRound) return;
            if (gameType === 'th' && thInRound) return;
            if (balance <= 0) return;
            const amt = balance;
            balance = 0;
            if (gameType === 'bj') bjBet += amt;
            if (gameType === 'th' && !thInRound) thBet += amt;
            
            triggerAllInEffect();
            updateGlobalBalanceUI();
            updateGameBetsUI();
        }

        function resetBet(gameType) {
            if (gameType === 'bj' && bjInRound) return;
            if (gameType === 'th' && thInRound) return;
            if (gameType === 'bj') { balance += bjBet; bjBet = 0; }
            if (gameType === 'th') { balance += thBet; thBet = 0; }
            updateGlobalBalanceUI();
            updateGameBetsUI();
            playSound('chip');
        }

        function updateGameBetsUI() {
            document.getElementById('bj-current-bet').innerText = `$${bjBet.toLocaleString()}`;
            document.getElementById('th-current-bet').innerText = `$${thBet.toLocaleString()}`;
            if (typeof updateThRaiseButtons === 'function') updateThRaiseButtons();
        }