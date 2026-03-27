// Shared game logic for both local and AI

export function checkWin(
  board: (string | null)[], 
  size: number, 
  winLength: number
): { winner: string | null; line: number[] | null; isDraw: boolean } {
  // Rows
  for (let r = 0; r < size; r++) {
    for (let c = 0; c <= size - winLength; c++) {
      const start = r * size + c;
      const symbol = board[start];
      if (!symbol) continue;
      
      let won = true;
      const line = [start];
      for (let i = 1; i < winLength; i++) {
        const idx = start + i;
        if (board[idx] !== symbol) {
          won = false;
          break;
        }
        line.push(idx);
      }
      if (won) return { winner: symbol, line, isDraw: false };
    }
  }

  // Columns
  for (let c = 0; c < size; c++) {
    for (let r = 0; r <= size - winLength; r++) {
      const start = r * size + c;
      const symbol = board[start];
      if (!symbol) continue;
      
      let won = true;
      const line = [start];
      for (let i = 1; i < winLength; i++) {
        const idx = start + i * size;
        if (board[idx] !== symbol) {
          won = false;
          break;
        }
        line.push(idx);
      }
      if (won) return { winner: symbol, line, isDraw: false };
    }
  }

  // Diagonals (Top-Left to Bottom-Right)
  for (let r = 0; r <= size - winLength; r++) {
    for (let c = 0; c <= size - winLength; c++) {
      const start = r * size + c;
      const symbol = board[start];
      if (!symbol) continue;
      
      let won = true;
      const line = [start];
      for (let i = 1; i < winLength; i++) {
        const idx = start + i * size + i;
        if (board[idx] !== symbol) {
          won = false;
          break;
        }
        line.push(idx);
      }
      if (won) return { winner: symbol, line, isDraw: false };
    }
  }

  // Diagonals (Top-Right to Bottom-Left)
  for (let r = 0; r <= size - winLength; r++) {
    for (let c = winLength - 1; c < size; c++) {
      const start = r * size + c;
      const symbol = board[start];
      if (!symbol) continue;
      
      let won = true;
      const line = [start];
      for (let i = 1; i < winLength; i++) {
        const idx = start + i * size - i;
        if (board[idx] !== symbol) {
          won = false;
          break;
        }
        line.push(idx);
      }
      if (won) return { winner: symbol, line, isDraw: false };
    }
  }

  const isDraw = board.every(cell => cell !== null);
  return { winner: null, line: null, isDraw };
}


// --- AI LOGIC ---

export function getBestMove(
  board: (string | null)[], 
  size: number, 
  winLength: number, 
  aiSymbol: string, 
  playerSymbol: string,
  difficulty: 'easy' | 'medium' | 'hard' | 'unbeatable'
): number {
  const availableMoves = board.map((c, i) => c === null ? i : -1).filter(i => i !== -1);
  if (availableMoves.length === 0) return -1;

  if (difficulty === 'easy') {
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  }

  if (difficulty === 'medium') {
    // 50% chance to play optimally (heuristic), 50% random
    if (Math.random() > 0.5) {
      return availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }
    return getHeuristicMove(board, size, winLength, aiSymbol, playerSymbol);
  }

  if (difficulty === 'hard') {
    // 90% optimal
    if (Math.random() > 0.9) {
      return availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }
    return getHeuristicMove(board, size, winLength, aiSymbol, playerSymbol);
  }

  if (difficulty === 'unbeatable') {
    if (size === 3 && winLength === 3) {
      // True minimax for 3x3
      let bestScore = -Infinity;
      let move = -1;
      for (let i = 0; i < board.length; i++) {
        if (board[i] === null) {
          board[i] = aiSymbol;
          let score = minimax(board, size, winLength, 0, false, aiSymbol, playerSymbol, -Infinity, Infinity);
          board[i] = null;
          if (score > bestScore) {
            bestScore = score;
            move = i;
          }
        }
      }
      return move !== -1 ? move : availableMoves[0];
    } else {
      // Fallback to strict heuristic for larger boards to prevent hanging
      return getHeuristicMove(board, size, winLength, aiSymbol, playerSymbol);
    }
  }

  return availableMoves[0];
}

// Minimax with Alpha-Beta pruning (only strictly safe for 3x3)
function minimax(
  board: (string | null)[], 
  size: number, 
  winLength: number, 
  depth: number, 
  isMaximizing: boolean, 
  aiSymbol: string, 
  playerSymbol: string,
  alpha: number,
  beta: number
): number {
  const { winner, isDraw } = checkWin(board, size, winLength);
  if (winner === aiSymbol) return 10 - depth;
  if (winner === playerSymbol) return depth - 10;
  if (isDraw) return 0;
  
  // Hard depth limit to prevent infinite loops on slightly larger unexpected boards
  if (depth > 6) return 0; 

  if (isMaximizing) {
    let bestScore = -Infinity;
    for (let i = 0; i < board.length; i++) {
      if (board[i] === null) {
        board[i] = aiSymbol;
        let score = minimax(board, size, winLength, depth + 1, false, aiSymbol, playerSymbol, alpha, beta);
        board[i] = null;
        bestScore = Math.max(score, bestScore);
        alpha = Math.max(alpha, score);
        if (beta <= alpha) break;
      }
    }
    return bestScore;
  } else {
    let bestScore = Infinity;
    for (let i = 0; i < board.length; i++) {
      if (board[i] === null) {
        board[i] = playerSymbol;
        let score = minimax(board, size, winLength, depth + 1, true, aiSymbol, playerSymbol, alpha, beta);
        board[i] = null;
        bestScore = Math.min(score, bestScore);
        beta = Math.min(beta, score);
        if (beta <= alpha) break;
      }
    }
    return bestScore;
  }
}

// Robust heuristic for any board size
function getHeuristicMove(
  board: (string | null)[], 
  size: number, 
  winLength: number, 
  aiSymbol: string, 
  playerSymbol: string
): number {
  let bestScore = -Infinity;
  let bestMoves: number[] = [];

  for (let i = 0; i < board.length; i++) {
    if (board[i] !== null) continue;

    // Simulate move
    board[i] = aiSymbol;
    let score = evaluateBoard(board, size, winLength, aiSymbol, playerSymbol);
    
    // Check if player would win next turn if we didn't play here
    board[i] = playerSymbol;
    let playerScoreIfPlayed = evaluateBoard(board, size, winLength, playerSymbol, aiSymbol);
    board[i] = null; // undo

    // Combine scores: prioritize winning, but heavily value blocking
    let totalScore = score + (playerScoreIfPlayed * 0.9);

    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestMoves = [i];
    } else if (totalScore === bestScore) {
      bestMoves.push(i);
    }
  }

  // Pick a random best move to add slight variety if multiple equally good
  return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}

function evaluateBoard(
  board: (string | null)[], 
  size: number, 
  winLength: number, 
  maxSymbol: string, 
  minSymbol: string
): number {
  const { winner } = checkWin(board, size, winLength);
  if (winner === maxSymbol) return 100000;
  if (winner === minSymbol) return -100000;
  
  let score = 0;
  
  // Very simplistic heuristic: just checking center control for early game
  const centerIdx = Math.floor(size / 2) * size + Math.floor(size / 2);
  if (board[centerIdx] === maxSymbol) score += 10;
  
  return score;
}
