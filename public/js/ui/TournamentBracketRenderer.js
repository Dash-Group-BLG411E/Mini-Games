class TournamentBracketRenderer {
    constructor() {
        this.boxWidth = 150;
        this.boxHeight = 60;
        this.roundSpacing = 200;
        this.matchSpacing = 100;
        this.padding = 40;
    }

    /**
     * Render tournament bracket as SVG
     * @param {Object} tournament - Tournament data with bracket structure
     * @param {HTMLElement} container - Container element to render into
     */
    renderBracket(tournament, container) {
        if (!tournament || !tournament.bracket) return;

        // Prepare matches data
        const matchesData = this.prepareMatchesData(tournament);
        
        // Calculate SVG dimensions
        const svgDimensions = this.calculateSVGDimensions(matchesData);
        
        // Create SVG element
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', `0 0 ${svgDimensions.width} ${svgDimensions.height}`);
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        svg.classList.add('tournament-bracket-svg');
        
        // Create defs for gradients/filters if needed
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        svg.appendChild(defs);
        
        // Draw connectors first (so boxes appear on top)
        this.drawConnectors(svg, matchesData, svgDimensions);
        
        // Draw match boxes
        this.drawMatchBoxes(svg, matchesData, svgDimensions, tournament);
        
        // Clear container and append SVG
        container.innerHTML = '';
        container.appendChild(svg);
    }

    /**
     * Prepare matches data with positions
     */
    prepareMatchesData(tournament) {
        const rounds = tournament.bracket.rounds || [];
        const matchesData = [];
        const playerUsernames = new Set();
        tournament.players.forEach(p => {
            const username = typeof p === 'string' ? p : (p.username || p);
            if (username) playerUsernames.add(username);
        });

        rounds.forEach((round, roundIndex) => {
            let matchesToRender = round.matches || [];
            
            // Always create placeholder matches if round has no matches
            // This ensures all rounds are shown in the bracket
            if (matchesToRender.length === 0) {
                const matchCount = roundIndex === 0 ? tournament.maxPlayers / 2 : 
                                 roundIndex === 1 ? (tournament.maxPlayers === 8 ? 2 : 1) : 1;
                
                if (roundIndex === 0) {
                    const players = tournament.players || [];
                    for (let i = 0; i < matchCount; i++) {
                        const player1Index = i * 2;
                        const player2Index = i * 2 + 1;
                        const player1 = player1Index < players.length ? 
                            (typeof players[player1Index] === 'string' ? players[player1Index] : players[player1Index].username) : null;
                        const player2 = player2Index < players.length ? 
                            (typeof players[player2Index] === 'string' ? players[player2Index] : players[player2Index].username) : null;
                        
                        matchesToRender.push({
                            matchId: `placeholder-${round.roundNumber}-${i}`,
                            player1: player1,
                            player2: player2,
                            status: 'waiting',
                            winner: null
                        });
                    }
                } else {
                    for (let i = 0; i < matchCount; i++) {
                        matchesToRender.push({
                            matchId: `placeholder-${round.roundNumber}-${i}`,
                            player1: null,
                            player2: null,
                            status: 'waiting',
                            winner: null
                        });
                    }
                }
            }

            const roundMatches = matchesToRender.map((match, matchIndex) => {
                const player1Name = match.player1 && playerUsernames.has(match.player1) ? match.player1 : null;
                const player2Name = match.player2 && playerUsernames.has(match.player2) ? match.player2 : null;
                
                return {
                    matchId: match.matchId,
                    roundNumber: round.roundNumber,
                    roundIndex: roundIndex,
                    matchIndex: matchIndex,
                    player1: player1Name,
                    player2: player2Name,
                    status: match.status || 'waiting',
                    winner: match.winner
                };
            });

            matchesData.push(roundMatches);
        });

        return matchesData;
    }

    /**
     * Calculate SVG dimensions based on matches
     */
    calculateSVGDimensions(matchesData) {
        const maxMatchesPerRound = Math.max(...matchesData.map(round => round.length));
        const totalRounds = matchesData.length;
        
        const width = this.padding * 2 + (totalRounds - 1) * this.roundSpacing + this.boxWidth;
        const height = this.padding * 2 + (maxMatchesPerRound - 1) * this.matchSpacing + this.boxHeight;
        
        return { width, height };
    }

    /**
     * Draw connectors between rounds
     */
    drawConnectors(svg, matchesData, dimensions) {
        const connectorsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        connectorsGroup.classList.add('bracket-connectors');
        
        for (let roundIndex = 0; roundIndex < matchesData.length - 1; roundIndex++) {
            const currentRound = matchesData[roundIndex];
            const nextRound = matchesData[roundIndex + 1];
            
            if (!currentRound || !nextRound) continue;
            
            // Connect each match in current round to corresponding match in next round
            currentRound.forEach((match, matchIndex) => {
                const matchY = this.getMatchYPosition(matchIndex, currentRound.length, dimensions.height);
                const currentX = this.padding + roundIndex * this.roundSpacing + this.boxWidth;
                const nextX = this.padding + (roundIndex + 1) * this.roundSpacing;
                
                // Find corresponding match in next round
                const nextMatchIndex = Math.floor(matchIndex / 2);
                if (nextMatchIndex < nextRound.length) {
                    const nextMatchY = this.getMatchYPosition(nextMatchIndex, nextRound.length, dimensions.height);
                    
                    // Draw horizontal line from current match to midpoint
                    const midX = currentX + (nextX - currentX) / 2;
                    const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    line1.setAttribute('x1', currentX);
                    line1.setAttribute('y1', matchY);
                    line1.setAttribute('x2', midX);
                    line1.setAttribute('y2', matchY);
                    line1.setAttribute('stroke', '#94a3b8');
                    line1.setAttribute('stroke-width', '2');
                    connectorsGroup.appendChild(line1);
                    
                    // Draw vertical connector line
                    const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    const minY = Math.min(matchY, nextMatchY);
                    const maxY = Math.max(matchY, nextMatchY);
                    line2.setAttribute('x1', midX);
                    line2.setAttribute('y1', minY);
                    line2.setAttribute('x2', midX);
                    line2.setAttribute('y2', maxY);
                    line2.setAttribute('stroke', '#94a3b8');
                    line2.setAttribute('stroke-width', '2');
                    connectorsGroup.appendChild(line2);
                    
                    // Draw horizontal line from midpoint to next match
                    const line3 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    line3.setAttribute('x1', midX);
                    line3.setAttribute('y1', nextMatchY);
                    line3.setAttribute('x2', nextX);
                    line3.setAttribute('y2', nextMatchY);
                    line3.setAttribute('stroke', '#94a3b8');
                    line3.setAttribute('stroke-width', '2');
                    connectorsGroup.appendChild(line3);
                }
            });
        }
        
        svg.appendChild(connectorsGroup);
    }

    /**
     * Get Y position for a match based on its index
     */
    getMatchYPosition(matchIndex, totalMatches, svgHeight) {
        if (totalMatches === 1) {
            return svgHeight / 2;
        }
        const totalSpacing = (totalMatches - 1) * this.matchSpacing;
        const startY = (svgHeight - totalSpacing - this.boxHeight) / 2;
        return startY + matchIndex * this.matchSpacing + this.boxHeight / 2;
    }

    /**
     * Draw match boxes with player names
     */
    drawMatchBoxes(svg, matchesData, dimensions, tournament) {
        const boxesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        boxesGroup.classList.add('bracket-boxes');
        
        // Helper to determine if a player won or lost
        const getPlayerStatus = (match, playerName) => {
            if (!match.winner) return 'pending'; // Match not finished
            if (match.winner === playerName) return 'winner';
            if (match.player1 === playerName || match.player2 === playerName) return 'loser';
            return 'pending';
        };
        
        matchesData.forEach((round, roundIndex) => {
            round.forEach((match, matchIndex) => {
                const x = this.padding + roundIndex * this.roundSpacing;
                const y = this.getMatchYPosition(matchIndex, round.length, dimensions.height) - this.boxHeight / 2;
                
                // Draw two separate boxes for player1 and player2 (like in the image)
                const boxHeight = this.boxHeight / 2;
                
                // Player 1 box
                const player1Status = getPlayerStatus(match, match.player1);
                let player1Fill = '#f1f5f9'; // Default (waiting)
                let player1Stroke = '#cbd5e1';
                if (player1Status === 'winner') {
                    player1Fill = '#d1fae5'; // Green for winner
                    player1Stroke = '#10b981';
                } else if (player1Status === 'loser') {
                    player1Fill = '#fee2e2'; // Red for loser
                    player1Stroke = '#ef4444';
                } else if (match.status === 'in-progress') {
                    player1Fill = '#dbeafe';
                    player1Stroke = '#3b82f6';
                }
                
                const rect1 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                rect1.setAttribute('x', x);
                rect1.setAttribute('y', y);
                rect1.setAttribute('width', this.boxWidth);
                rect1.setAttribute('height', boxHeight);
                rect1.setAttribute('fill', player1Fill);
                rect1.setAttribute('stroke', player1Stroke);
                rect1.setAttribute('stroke-width', '2');
                rect1.setAttribute('rx', '4');
                boxesGroup.appendChild(rect1);
                
                // Player 2 box
                const player2Status = getPlayerStatus(match, match.player2);
                let player2Fill = '#f1f5f9'; // Default (waiting)
                let player2Stroke = '#cbd5e1';
                if (player2Status === 'winner') {
                    player2Fill = '#d1fae5'; // Green for winner
                    player2Stroke = '#10b981';
                } else if (player2Status === 'loser') {
                    player2Fill = '#fee2e2'; // Red for loser
                    player2Stroke = '#ef4444';
                } else if (match.status === 'in-progress') {
                    player2Fill = '#dbeafe';
                    player2Stroke = '#3b82f6';
                }
                
                const rect2 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                rect2.setAttribute('x', x);
                rect2.setAttribute('y', y + boxHeight);
                rect2.setAttribute('width', this.boxWidth);
                rect2.setAttribute('height', boxHeight);
                rect2.setAttribute('fill', player2Fill);
                rect2.setAttribute('stroke', player2Stroke);
                rect2.setAttribute('stroke-width', '2');
                rect2.setAttribute('rx', '4');
                boxesGroup.appendChild(rect2);
                
                // Draw player names or waiting text
                const player1Text = match.player1 || '⏳Waiting...';
                const player2Text = match.player2 || '⏳Waiting...';
                
                // Player 1 text
                const text1 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text1.setAttribute('x', x + this.boxWidth / 2);
                text1.setAttribute('y', y + boxHeight / 2 + 4);
                text1.setAttribute('text-anchor', 'middle');
                text1.setAttribute('font-size', '12');
                text1.setAttribute('fill', match.player1 ? '#1e293b' : '#64748b');
                text1.setAttribute('font-family', 'Inter, sans-serif');
                text1.textContent = player1Text;
                boxesGroup.appendChild(text1);
                
                // Player 2 text
                const text2 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text2.setAttribute('x', x + this.boxWidth / 2);
                text2.setAttribute('y', y + boxHeight + boxHeight / 2 + 4);
                text2.setAttribute('text-anchor', 'middle');
                text2.setAttribute('font-size', '12');
                text2.setAttribute('fill', match.player2 ? '#1e293b' : '#64748b');
                text2.setAttribute('font-family', 'Inter, sans-serif');
                text2.textContent = player2Text;
                boxesGroup.appendChild(text2);
            });
            
            // Draw round label
            const roundLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            roundLabel.setAttribute('x', this.padding + roundIndex * this.roundSpacing + this.boxWidth / 2);
            roundLabel.setAttribute('y', 25);
            roundLabel.setAttribute('text-anchor', 'middle');
            roundLabel.setAttribute('font-size', '16');
            roundLabel.setAttribute('font-weight', '600');
            roundLabel.setAttribute('fill', '#7c3aed');
            roundLabel.setAttribute('font-family', 'Inter, sans-serif');
            roundLabel.textContent = `Round ${round[0]?.roundNumber || roundIndex + 1}`;
            boxesGroup.appendChild(roundLabel);
        });
        
        svg.appendChild(boxesGroup);
    }
}

