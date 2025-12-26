class Tournament {
    constructor(tournamentId, gameType, maxPlayers, creatorUsername) {
        this.tournamentId = tournamentId;
        this.gameType = gameType; // 'three-mens-morris', 'battleship', 'memory-match', 'mixed'
        this.maxPlayers = maxPlayers; // 4 or 8
        this.creatorUsername = creatorUsername;
        this.players = []; // Array of {username, socketId}
        this.status = 'waiting'; // 'waiting', 'in-progress', 'finished'
        this.bracket = null; // Bracket structure
        this.currentRound = 0; // Current round number (0-indexed)
        this.matches = new Map(); // Map<matchId, Match>
        this.winner = null;
        this.createdAt = new Date();
        this.startedAt = null;
        this.finishedAt = null;
        
        this.initializeBracket();
    }

    initializeBracket() {
        // Initialize bracket structure based on maxPlayers
        const rounds = this.maxPlayers === 4 ? 2 : 3; // 4 players: 2 rounds, 8 players: 3 rounds
        this.bracket = {
            rounds: Array(rounds).fill(null).map((_, roundIndex) => ({
                roundNumber: roundIndex + 1,
                matches: []
            }))
        };
    }

    addPlayer(username, socketId) {
        if (this.status !== 'waiting') {
            return { success: false, error: 'Tournament has already started' };
        }

        if (this.players.length >= this.maxPlayers) {
            return { success: false, error: 'Tournament is full' };
        }

        if (this.players.some(p => p.username === username)) {
            return { success: false, error: 'Player already in tournament' };
        }

        this.players.push({ username, socketId });
        return { success: true };
    }

    removePlayer(username) {
        const index = this.players.findIndex(p => p.username === username);
        if (index !== -1) {
            this.players.splice(index, 1);
            return { success: true };
        }
        return { success: false, error: 'Player not found' };
    }

    canStart() {
        return this.status === 'waiting' && this.players.length === this.maxPlayers;
    }

    start() {
        if (!this.canStart()) {
            return { success: false, error: 'Cannot start tournament' };
        }

        this.status = 'in-progress';
        this.startedAt = new Date();
        this.currentRound = 0;
        this.createRoundMatches(0);
        return { success: true };
    }

    createRoundMatches(roundIndex) {
        const round = this.bracket.rounds[roundIndex];
        if (!round) return;

        const players = roundIndex === 0 ? [...this.players] : this.getRoundWinners(roundIndex - 1);
        const matchCount = players.length / 2;

        round.matches = [];
        for (let i = 0; i < matchCount; i++) {
            const matchId = `match-${this.tournamentId}-r${roundIndex + 1}-m${i + 1}`;
            const player1 = players[i * 2];
            const player2 = players[i * 2 + 1];
            
            const match = {
                matchId,
                roundNumber: roundIndex + 1,
                player1: player1 ? player1.username : null,
                player2: player2 ? player2.username : null,
                winner: null,
                status: 'waiting', // 'waiting', 'in-progress', 'finished'
                roomId: null
            };

            round.matches.push(match);
            this.matches.set(matchId, match);
        }
    }

    getRoundWinners(roundIndex) {
        const round = this.bracket.rounds[roundIndex];
        if (!round) return [];

        const winners = [];
        round.matches.forEach(match => {
            if (match.winner) {
                const winner = this.players.find(p => p.username === match.winner);
                if (winner) {
                    winners.push(winner);
                }
            }
        });
        return winners;
    }

    getMatch(matchId) {
        return this.matches.get(matchId);
    }

    setMatchRoomId(matchId, roomId) {
        const match = this.matches.get(matchId);
        if (match) {
            match.roomId = roomId;
            match.status = 'in-progress';
        }
    }

    finishMatch(matchId, winnerUsername) {
        const match = this.matches.get(matchId);
        if (!match) {
            return { success: false, error: 'Match not found' };
        }

        match.winner = winnerUsername;
        match.status = 'finished';

        // Check if current round is complete
        const currentRound = this.bracket.rounds[this.currentRound];
        const allMatchesFinished = currentRound.matches.every(m => m.status === 'finished');

        if (allMatchesFinished) {
            // Move to next round or finish tournament
            if (this.currentRound < this.bracket.rounds.length - 1) {
                this.currentRound++;
                this.createRoundMatches(this.currentRound);
                return { success: true, nextRound: true, roundNumber: this.currentRound + 1 };
            } else {
                // Tournament finished
                this.status = 'finished';
                this.finishedAt = new Date();
                this.winner = winnerUsername;
                return { success: true, tournamentFinished: true, winner: winnerUsername };
            }
        }

        return { success: true, roundInProgress: true };
    }

    getCurrentRoundMatches() {
        const round = this.bracket.rounds[this.currentRound];
        return round ? round.matches : [];
    }

    getMatchState(matchId) {
        // For mixed mode, we need to track game state
        const match = this.matches.get(matchId);
        if (!match) return null;

        if (this.gameType !== 'mixed') {
            return {
                currentGameType: this.gameType,
                gameIndex: 0,
                totalGames: 1
            };
        }

        // Mixed mode: track which game we're on
        if (!match.gameState) {
            match.gameState = {
                currentGameIndex: 0,
                gameOrder: ['three-mens-morris', 'battleship', 'memory-match'],
                scores: { [match.player1]: 0, [match.player2]: 0 }
            };
        }

        return {
            currentGameType: match.gameState.gameOrder[match.gameState.currentGameIndex],
            gameIndex: match.gameState.currentGameIndex,
            totalGames: 3,
            scores: match.gameState.scores
        };
    }

    recordMatchGameResult(matchId, winnerUsername) {
        const match = this.matches.get(matchId);
        if (!match) return { success: false, error: 'Match not found' };

        if (this.gameType !== 'mixed') {
            // Single game mode: winner of game wins match
            return this.finishMatch(matchId, winnerUsername);
        }

        // Mixed mode: track scores
        if (!match.gameState) {
            match.gameState = {
                currentGameIndex: 0,
                gameOrder: ['three-mens-morris', 'battleship', 'memory-match'],
                scores: { [match.player1]: 0, [match.player2]: 0 }
            };
        }

        match.gameState.scores[winnerUsername] = (match.gameState.scores[winnerUsername] || 0) + 1;

        // Check if match is decided (best of 3)
        const player1Score = match.gameState.scores[match.player1] || 0;
        const player2Score = match.gameState.scores[match.player2] || 0;

        if (player1Score >= 2) {
            return this.finishMatch(matchId, match.player1);
        }

        if (player2Score >= 2) {
            return this.finishMatch(matchId, match.player2);
        }

        // Move to next game
        match.gameState.currentGameIndex++;
        if (match.gameState.currentGameIndex >= match.gameState.gameOrder.length) {
            // All games played, determine winner by points
            const finalWinner = player1Score > player2Score ? match.player1 : 
                               (player2Score > player1Score ? match.player2 : winnerUsername);
            return this.finishMatch(matchId, finalWinner);
        }

        return {
            success: true,
            nextGame: true,
            gameType: match.gameState.gameOrder[match.gameState.currentGameIndex],
            scores: { ...match.gameState.scores }
        };
    }

    getTournamentInfo() {
        return {
            tournamentId: this.tournamentId,
            gameType: this.gameType,
            maxPlayers: this.maxPlayers,
            creatorUsername: this.creatorUsername,
            currentPlayers: this.players.length,
            players: this.players.map(p => ({ username: p.username })),
            status: this.status,
            currentRound: this.currentRound + 1,
            totalRounds: this.bracket.rounds.length,
            winner: this.winner,
            bracket: this.bracket
        };
    }
}

module.exports = Tournament;
