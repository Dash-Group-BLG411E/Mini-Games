const GameRoom = require('./GameRoom');

class Tournament {
    constructor(tournamentId, tournamentName, gameType, maxPlayers, creatorUsername) {
        this.tournamentId = tournamentId;
        this.tournamentName = tournamentName || `Tournament ${tournamentId}`;
        this.gameType = gameType;
        this.maxPlayers = maxPlayers; // 4, 8, or 16
        this.creatorUsername = creatorUsername;
        this.players = []; // Array of { socketId, username } - current active players
        this.startingPlayers = []; // Array of { socketId, username } - snapshot of players when tournament started
        this.status = 'waiting'; // waiting, in-progress, finished
        this.bracket = null; // Tournament bracket structure
        this.currentRound = 0;
        this.matches = []; // Array of matches (GameRoom instances)
        this.winner = null;
        this.createdAt = new Date();
    }

    addPlayer(socketId, username) {
        if (this.players.length >= this.maxPlayers) {
            return { success: false, error: 'Tournament is full.' };
        }

        if (this.status !== 'waiting') {
            return { success: false, error: 'Tournament has already started.' };
        }

        if (this.players.some(p => p.username === username)) {
            return { success: false, error: 'You are already registered.' };
        }

        const player = { socketId, username };
        this.players.push(player);

        return { success: true, player };
    }

    removePlayer(socketId) {
        const playerIndex = this.players.findIndex(p => p.socketId === socketId);
        if (playerIndex !== -1) {
            this.players.splice(playerIndex, 1);
            return { removed: true };
        }
        return { removed: false };
    }

    canStart() {
        return this.status === 'waiting' && this.players.length === this.maxPlayers;
    }

    start() {
        if (!this.canStart()) {
            return { success: false, error: 'Cannot start tournament.' };
        }

        // Save snapshot of players who started the tournament
        this.startingPlayers = this.players.map(p => ({ socketId: p.socketId, username: p.username }));

        this.status = 'in-progress';
        this.currentRound = 1;
        this.generateBracket();
        return { success: true };
    }

    generateBracket() {
        // Create a single-elimination bracket
        const rounds = Math.log2(this.maxPlayers);
        this.bracket = {
            rounds: [],
            currentRoundIndex: 0
        };

        // First round: pair up players
        const firstRoundMatches = [];
        for (let i = 0; i < this.players.length; i += 2) {
            if (i + 1 < this.players.length) {
                firstRoundMatches.push({
                    player1: this.players[i].username,
                    player2: this.players[i + 1].username,
                    winner: null,
                    matchId: `match-${firstRoundMatches.length}`
                });
            }
        }

        this.bracket.rounds.push({
            roundNumber: 1,
            matches: firstRoundMatches
        });

        // Generate subsequent rounds
        let currentRoundPlayers = this.maxPlayers / 2;
        for (let round = 2; round <= rounds; round++) {
            currentRoundPlayers /= 2;
            const roundMatches = [];
            for (let i = 0; i < currentRoundPlayers; i++) {
                roundMatches.push({
                    player1: null, // Will be filled by winner of previous round
                    player2: null,
                    winner: null,
                    matchId: `match-r${round}-${i}`
                });
            }
            this.bracket.rounds.push({
                roundNumber: round,
                matches: roundMatches
            });
        }
    }

    createMatchForBracketMatch(bracketMatch, matchIndex) {
        const matchId = `tournament-${this.tournamentId}-match-${this.currentRound}-${matchIndex}`;
        const room = new GameRoom(matchId, `${this.tournamentName} - Round ${this.currentRound}`, this.gameType);
        
        // Add players to the match
        if (bracketMatch.player1) {
            const player1 = this.players.find(p => p.username === bracketMatch.player1);
            if (player1) {
                room.addPlayer(player1.socketId, player1.username);
            }
        }
        if (bracketMatch.player2) {
            const player2 = this.players.find(p => p.username === bracketMatch.player2);
            if (player2) {
                room.addPlayer(player2.socketId, player2.username);
            }
        }

        // Store reference to bracket match
        bracketMatch.matchId = matchId;
        
        this.matches.push({
            matchId,
            room,
            bracketMatch,
            bracketMatchIndex: matchIndex,
            roundNumber: this.currentRound,
            status: 'waiting'
        });

        return room;
    }

    updateMatchResult(matchId, winnerUsername) {
        const match = this.matches.find(m => m.matchId === matchId);
        if (!match) {
            return { success: false, error: 'Match not found.' };
        }

        match.status = 'finished';
        match.bracketMatch.winner = winnerUsername;

        // Check if tournament is finished (final match)
        const currentRoundIndex = this.currentRound - 1;
        const currentRound = this.bracket.rounds[currentRoundIndex];
        const allMatchesFinished = currentRound.matches.every(m => m.winner !== null);

        // Check if there's a next round BEFORE incrementing currentRound
        const hasNextRound = this.currentRound < this.bracket.rounds.length;
        const nextRoundIndex = hasNextRound ? this.currentRound : null; // Next round index (0-based for rounds array)
        
        // Update next round bracket with winner (if there is a next round)
        // Note: currentRound is 1-based (round number), bracket array is 0-based
        // So if currentRound = 1, next round is at bracket index 1 (round 2)
        let nextMatchReady = false;
        let nextMatchIndex = null;
        
        if (hasNextRound && nextRoundIndex !== null && nextRoundIndex < this.bracket.rounds.length) {
            const nextRound = this.bracket.rounds[nextRoundIndex];
            const matchIndex = match.bracketMatchIndex;
            
            if (matchIndex !== undefined && matchIndex !== -1 && nextRound && nextRound.matches) {
                nextMatchIndex = Math.floor(matchIndex / 2);
                
                if (nextMatchIndex >= 0 && nextMatchIndex < nextRound.matches.length) {
                    if (matchIndex % 2 === 0) {
                        nextRound.matches[nextMatchIndex].player1 = winnerUsername;
                    } else {
                        nextRound.matches[nextMatchIndex].player2 = winnerUsername;
                    }
                    
                    // Check if this next match now has both players ready
                    const nextMatch = nextRound.matches[nextMatchIndex];
                    if (nextMatch && nextMatch.player1 && nextMatch.player2) {
                        nextMatchReady = true;
                        console.log(`Next match ready: Round ${nextRoundIndex + 1}, Match ${nextMatchIndex}, Players: ${nextMatch.player1} vs ${nextMatch.player2}`);
                    }
                } else {
                    console.error(`Invalid nextMatchIndex: ${nextMatchIndex}, round has ${nextRound.matches.length} matches`);
                }
            }
        }

        // After updating bracket, check if round is complete and increment if needed
        if (allMatchesFinished) {
            if (this.currentRound === this.bracket.rounds.length) {
                // Tournament finished - final match
                this.status = 'finished';
                this.winner = winnerUsername;
                return { 
                    success: true, 
                    roundComplete: true, 
                    tournamentFinished: true,
                    nextMatchReady: false,
                    nextMatchIndex: null
                };
            } else {
                // Move to next round
                this.currentRound++;
            }
        }

        return { 
            success: true, 
            roundComplete: allMatchesFinished, 
            nextRound: allMatchesFinished && hasNextRound ? this.currentRound : null,
            nextMatchReady: nextMatchReady,
            nextMatchIndex: nextMatchReady ? nextMatchIndex : null
        };
    }

    getTournamentInfo() {
        // Use startingPlayers for participant list and count if tournament has started
        // Otherwise use current players (for waiting tournaments)
        const participantList = this.status !== 'waiting' && this.startingPlayers.length > 0
            ? this.startingPlayers
            : this.players;
        
        const participantCount = this.status !== 'waiting' && this.startingPlayers.length > 0
            ? this.startingPlayers.length
            : this.players.length;

        return {
            tournamentId: this.tournamentId,
            tournamentName: this.tournamentName,
            gameType: this.gameType,
            maxPlayers: this.maxPlayers,
            currentPlayers: participantCount,
            status: this.status,
            creatorUsername: this.creatorUsername,
            players: participantList.map(p => ({ username: p.username })),
            currentRound: this.currentRound,
            winner: this.winner,
            bracket: this.bracket
        };
    }

    isPlayer(socketId) {
        return this.players.some(p => p.socketId === socketId);
    }

    isEmpty() {
        return this.players.length === 0;
    }
}

module.exports = Tournament;

