document.addEventListener('DOMContentLoaded', () => {
  // Check if user is logged in
  const currentUser = JSON.parse(localStorage.getItem('current_user'));
  
  if (!currentUser) {
    window.location.href = 'index.html';
    return;
  }
  
  // Display user info
  document.getElementById('game-username').textContent = currentUser.username;
  document.getElementById('game-chips').textContent = `$${currentUser.chips}`;
  
  // Leave table button
  document.getElementById('leave-table').addEventListener('click', () => {
    window.location.href = 'lobby.html';
  });
  
  // Initialize game
  const game = new BlackjackGame(currentUser);
  game.startNewGame();
});

class BlackjackGame {
  constructor(user) {
    this.user = user;
    this.deck = [];
    this.dealerHand = [];
    this.playerHand = [];
    this.currentBet = 0;
    this.gameState = 'betting'; // betting, playing, dealerTurn, gameOver
    
    // DOM elements
    this.dealerCardsEl = document.getElementById('dealer-cards');
    this.playerCardsEl = document.getElementById('player-cards');
    this.dealerTotalEl = document.getElementById('dealer-total');
    this.playerTotalEl = document.getElementById('player-total');
    this.playerBetEl = document.getElementById('player-bet');
    this.gameControlsEl = document.getElementById('game-controls');
    this.gameMessageEl = document.getElementById('game-message');
    
    // Initialize controls
    this.setupControls();
  }
  
  startNewGame() {
    // Reset game state
    this.deck = this.createDeck();
    this.dealerHand = [];
    this.playerHand = [];
    this.currentBet = 0;
    this.gameState = 'betting';
    
    // Clear UI
    this.dealerCardsEl.innerHTML = '';
    this.playerCardsEl.innerHTML = '';
    this.dealerTotalEl.textContent = '';
    this.playerTotalEl.textContent = '';
    this.playerBetEl.textContent = 'Bet: $0';
    this.gameMessageEl.textContent = '';
    
    // Show betting controls
    this.updateControls();
  }
  
  createDeck() {
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    let deck = [];
    
    for (let suit of suits) {
      for (let value of values) {
        deck.push({ suit, value });
      }
    }
    
    // Shuffle deck
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    
    return deck;
  }
  
  dealInitialCards() {
    // Deal 2 cards to player and dealer
    this.playerHand = [this.drawCard(), this.drawCard()];
    this.dealerHand = [this.drawCard(), this.drawCard()];
    
    // Update UI
    this.updateCards();
    this.updateTotals();
    
    // Check for blackjack
    if (this.calculateHandValue(this.playerHand) === 21) {
      this.handleBlackjack();
      return;
    }
    
    this.gameState = 'playing';
    this.updateControls();
  }
  
  drawCard() {
    return this.deck.pop();
  }
  
  calculateHandValue(hand) {
    let value = 0;
    let aces = 0;
    
    for (let card of hand) {
      if (['J', 'Q', 'K'].includes(card.value)) {
        value += 10;
      } else if (card.value === 'A') {
        value += 11;
        aces++;
      } else {
        value += parseInt(card.value);
      }
    }
    
    // Adjust for aces if over 21
    while (value > 21 && aces > 0) {
      value -= 10;
      aces--;
    }
    
    return value;
  }
  
  updateCards() {
    // Update dealer cards
    this.dealerCardsEl.innerHTML = '';
    this.dealerHand.forEach((card, index) => {
      // Hide first card if it's not dealer's turn
      if (index === 0 && this.gameState !== 'dealerTurn' && this.gameState !== 'gameOver') {
        this.dealerCardsEl.innerHTML += '<div class="card back"></div>';
      } else {
        this.dealerCardsEl.innerHTML += this.createCardHTML(card);
      }
    });
    
    // Update player cards
    this.playerCardsEl.innerHTML = '';
    this.playerHand.forEach(card => {
      this.playerCardsEl.innerHTML += this.createCardHTML(card);
    });
  }
  
  createCardHTML(card) {
    return `<div class="card ${card.suit}">
      <div class="card-value">${card.value}</div>
      <div class="card-suit">${this.getSuitSymbol(card.suit)}</div>
    </div>`;
  }
  
  getSuitSymbol(suit) {
    switch(suit) {
      case 'hearts': return '♥';
      case 'diamonds': return '♦';
      case 'clubs': return '♣';
      case 'spades': return '♠';
      default: return '';
    }
  }
  
  updateTotals() {
    // Update dealer total (only show if game is over)
    if (this.gameState === 'gameOver' || this.gameState === 'dealerTurn') {
      this.dealerTotalEl.textContent = `Total: ${this.calculateHandValue(this.dealerHand)}`;
    } else {
      // For dealer's first card only
      const dealerFirstCardValue = this.dealerHand[0].value;
      let firstCardValue;
      
      if (['J', 'Q', 'K'].includes(dealerFirstCardValue)) {
        firstCardValue = 10;
      } else if (dealerFirstCardValue === 'A') {
        firstCardValue = 11;
      } else {
        firstCardValue = parseInt(dealerFirstCardValue);
      }
      
      this.dealerTotalEl.textContent = `Total: ${firstCardValue} + ?`;
    }
    
    // Update player total
    this.playerTotalEl.textContent = `Total: ${this.calculateHandValue(this.playerHand)}`;
  }
  
  updateControls() {
    this.gameControlsEl.innerHTML = '';
    
    switch(this.gameState) {
      case 'betting':
        this.gameControlsEl.innerHTML = `
          <div class="bet-controls">
            <input type="range" id="bet-amount" min="10" max="${Math.min(500, this.user.chips)}" 
                   value="10" step="10">
            <span id="bet-display">$10</span>
            <button id="place-bet">Place Bet</button>
          </div>
        `;
        
        document.getElementById('bet-amount').addEventListener('input', (e) => {
          document.getElementById('bet-display').textContent = `$${e.target.value}`;
        });
        
        document.getElementById('place-bet').addEventListener('click', () => {
          this.placeBet(parseInt(document.getElementById('bet-amount').value));
        });
        break;
        
      case 'playing':
        this.gameControlsEl.innerHTML = `
          <button id="hit-btn">Hit</button>
          <button id="stand-btn">Stand</button>
          ${this.playerHand.length === 2 ? '<button id="double-btn">Double Down</button>' : ''}
        `;
        
        document.getElementById('hit-btn').addEventListener('click', () => this.playerHit());
        document.getElementById('stand-btn').addEventListener('click', () => this.playerStand());
        if (this.playerHand.length === 2) {
          document.getElementById('double-btn').addEventListener('click', () => this.playerDouble());
        }
        break;
        
      case 'gameOver':
        this.gameControlsEl.innerHTML = '<button id="new-game-btn">New Game</button>';
        document.getElementById('new-game-btn').addEventListener('click', () => this.startNewGame());
        break;
    }
  }
  
  placeBet(amount) {
    if (amount > this.user.chips) {
      this.gameMessageEl.textContent = "You don't have enough chips!";
      return;
    }
    
    this.currentBet = amount;
    this.user.chips -= amount;
    this.playerBetEl.textContent = `Bet: $${amount}`;
    document.getElementById('game-chips').textContent = `$${this.user.chips}`;
    
    // Save user data
    localStorage.setItem('current_user', JSON.stringify(this.user));
    
    // Deal cards
    this.dealInitialCards();
  }
  
  playerHit() {
    this.playerHand.push(this.drawCard());
    this.updateCards();
    this.updateTotals();
    
    const playerTotal = this.calculateHandValue(this.playerHand);
    
    if (playerTotal > 21) {
      this.gameMessageEl.textContent = "Bust! You lose.";
      this.gameState = 'gameOver';
      this.updateControls();
    } else if (playerTotal === 21) {
      this.playerStand(); // Automatically stand on 21
    }
  }
  
  playerStand() {
    this.gameState = 'dealerTurn';
    this.updateTotals();
    this.updateControls();
    this.dealerPlay();
  }
  
  playerDouble() {
    if (this.currentBet * 2 > this.user.chips) {
      this.gameMessageEl.textContent = "Not enough chips to double!";
      return;
    }
    
    // Double the bet
    this.user.chips -= this.currentBet;
    this.currentBet *= 2;
    this.playerBetEl.textContent = `Bet: $${this.currentBet}`;
    document.getElementById('game-chips').textContent = `$${this.user.chips}`;
    
    // Take one more card
    this.playerHit();
    
    // Stand automatically after doubling
    if (this.gameState !== 'gameOver') {
      this.playerStand();
    }
  }
  
  dealerPlay() {
    // Reveal dealer's hole card
    this.updateCards();
    
    // Dealer hits until 17 or higher
    while (this.calculateHandValue(this.dealerHand) < 17) {
      setTimeout(() => {
        this.dealerHand.push(this.drawCard());
        this.updateCards();
        this.updateTotals();
      }, 1000);
    }
    
    setTimeout(() => {
      this.finishGame();
    }, 1500);
  }
  
  finishGame() {
    const playerTotal = this.calculateHandValue(this.playerHand);
    const dealerTotal = this.calculateHandValue(this.dealerHand);
    
    this.gameState = 'gameOver';
    
    if (playerTotal > 21) {
      this.gameMessageEl.textContent = "You busted! Dealer wins.";
    } else if (dealerTotal > 21) {
      this.gameMessageEl.textContent = "Dealer busted! You win!";
      this.user.chips += this.currentBet * 2;
    } else if (playerTotal > dealerTotal) {
      this.gameMessageEl.textContent = "You win!";
      this.user.chips += this.currentBet * 2;
    } else if (playerTotal === dealerTotal) {
      this.gameMessageEl.textContent = "Push! It's a tie.";
      this.user.chips += this.currentBet;
    } else {
      this.gameMessageEl.textContent = "Dealer wins!";
    }
    
    // Update chips display
    document.getElementById('game-chips').textContent = `$${this.user.chips}`;
    
    // Save user data
    localStorage.setItem('current_user', JSON.stringify(this.user));
    
    // Update controls
    this.updateControls();
  }
  
  handleBlackjack() {
    // Check if dealer also has blackjack
    const dealerHasBlackjack = this.calculateHandValue(this.dealerHand) === 21;
    
    if (dealerHasBlackjack) {
      this.gameMessageEl.textContent = "Push! Both have Blackjack.";
      this.user.chips += this.currentBet;
    } else {
      this.gameMessageEl.textContent = "Blackjack! You win 3:2!";
      this.user.chips += Math.floor(this.currentBet * 2.5);
    }
    
    this.gameState = 'gameOver';
    this.updateTotals();
    this.updateControls();
    
    // Save user data
    localStorage.setItem('current_user', JSON.stringify(this.user));
    document.getElementById('game-chips').textContent = `$${this.user.chips}`;
  }
  
  setupControls() {
    // This is already handled in updateControls()
  }
}
