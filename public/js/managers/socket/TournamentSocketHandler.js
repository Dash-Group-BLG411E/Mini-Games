class TournamentSocketHandler {
    constructor(app) {
        this.app = app;
    }

    registerHandlers(socket) {
        socket.on('tournamentCreated', (data) => {
            this.handleTournamentCreated(data);
        });

        socket.on('tournamentJoined', (data) => {
            this.handleTournamentJoined(data);
        });

        socket.on('tournamentLeft', (data) => {
            this.handleTournamentLeft(data);
        });

        socket.on('tournamentsList', (data) => {
            this.handleTournamentsList(data);
        });

        socket.on('tournamentUpdate', (data) => {
            this.handleTournamentUpdate(data);
        });

        socket.on('tournamentStarted', (data) => {
            this.handleTournamentStarted(data);
        });

        socket.on('tournamentMatchStarted', (data) => {
            this.handleTournamentMatchStarted(data);
        });

        socket.on('tournamentFinished', (data) => {
            this.handleTournamentFinished(data);
        });

        socket.on('tournamentMatchFinished', (data) => {
            this.handleTournamentMatchFinished(data);
        });

        socket.on('tournamentMatchWon', (data) => {
            this.handleTournamentMatchWon(data);
        });

        // Handle tournament errors
        socket.on('error', (error) => {
            // Check if this is a tournament-related error
            if (typeof error === 'string' && (
                error.includes('Tournament') || 
                error.includes('tournament') ||
                error.includes('Invalid tournament')
            )) {
                if (this.app.modalManager) {
                    this.app.modalManager.showNotification(error);
                } else {
                    alert(error);
                }
            }
        });
    }

    handleTournamentCreated(data) {
        if (this.app.tournamentManager) {
            this.app.tournamentManager.currentTournament = data.tournamentId;
            this.app.tournamentManager.hideCreateTournamentModal();
        }
        if (this.app.tournamentManager) {
            this.app.tournamentManager.getTournaments();
        }
    }

    handleTournamentJoined(data) {
        if (this.app.tournamentManager) {
            this.app.tournamentManager.currentTournament = data.tournamentId;
        }
        if (this.app.modalManager) {
            this.app.modalManager.showNotification(`Joined tournament: ${data.tournamentName}`);
        }
        if (this.app.tournamentManager) {
            this.app.tournamentManager.getTournaments();
        }
    }

    handleTournamentLeft(data) {
        if (this.app.tournamentManager) {
            if (this.app.tournamentManager.currentTournament === data.tournamentId) {
                this.app.tournamentManager.currentTournament = null;
            }
        }
        if (this.app.tournamentManager) {
            this.app.tournamentManager.getTournaments();
        }
    }

    handleTournamentsList(data) {
        if (this.app.tournamentManager) {
            this.app.tournamentManager.updateTournamentsList(data);
        }
    }

    handleTournamentUpdate(data) {
        if (this.app.tournamentManager) {
            this.app.tournamentManager.getTournaments();
        }
    }

    handleTournamentStarted(data) {
        if (this.app.modalManager) {
            this.app.modalManager.showNotification('Tournament has started!');
        }
        if (this.app.tournamentManager) {
            this.app.tournamentManager.getTournaments();
        }
    }

    handleTournamentMatchStarted(data) {
        // The roomCreated event should have already been emitted and handled
        // This event is just for additional tournament-specific info
        // The navigation should already be done by RoomSocketHandler.handleRoomCreated
        console.log('Tournament match started:', data);
    }

    handleTournamentFinished(data) {
        // Hide any post-match modals
        if (this.app.tournamentManager) {
            this.app.tournamentManager.hidePostMatchModal();
        }
        
        // Clear current room if in a tournament match
        if (this.app.currentRoom && typeof this.app.currentRoom === 'string' && this.app.currentRoom.startsWith('tournament-')) {
            this.app.currentRoom = null;
            this.app.gameState = null;
            this.app.myRole = null;
            this.app.isSpectator = false;
            if (this.app.disableBeforeUnloadWarning) {
                this.app.disableBeforeUnloadWarning();
            }
        }
        
        // Show tournament completion notification (no options, just notification)
        if (this.app.modalManager) {
            const isWinner = data.winner === this.app.currentUser;
            const message = isWinner
                ? `🎉 Congratulations! You won the tournament "${data.tournamentInfo?.tournamentName || 'Tournament'}"! 🏆<br><br>You are the champion!`
                : `Tournament "${data.tournamentInfo?.tournamentName || 'Tournament'}" finished!<br><br>Winner: <strong>${data.winner}</strong> 🏆`;
            
            this.app.modalManager.showNotification(message, () => {
                // Navigate to tournaments view after notification
                if (this.app.viewManager) {
                    this.app.viewManager.showView('tournaments');
                }
                if (this.app.tournamentManager) {
                    this.app.tournamentManager.getTournaments();
                }
            }, 5000);
        } else {
            // Fallback: just refresh tournament list
            if (this.app.tournamentManager) {
                this.app.tournamentManager.getTournaments();
            }
            if (this.app.viewManager) {
                this.app.viewManager.showView('tournaments');
            }
        }
        
        // Refresh tournament list to show updated status
        if (this.app.tournamentManager) {
            this.app.tournamentManager.getTournaments();
        }
    }

    handleTournamentMatchFinished(data) {
        // Losers are sent directly to lobby - no need to show post-match options
        // Clear current room if in a tournament match
        if (this.app.currentRoom && typeof this.app.currentRoom === 'string' && this.app.currentRoom.startsWith('tournament-')) {
            this.app.currentRoom = null;
            this.app.gameState = null;
            this.app.myRole = null;
            this.app.isSpectator = false;
            if (this.app.disableBeforeUnloadWarning) {
                this.app.disableBeforeUnloadWarning();
            }
        }
        
        // Show a brief notification and send to lobby
        if (this.app.modalManager) {
            this.app.modalManager.showNotification('You were eliminated from the tournament.', () => {
                if (this.app.viewManager) {
                    this.app.viewManager.showLobby();
                }
            }, 2000);
        } else {
            // Fallback: just go to lobby
            if (this.app.viewManager) {
                this.app.viewManager.showLobby();
            }
        }
        
        // Leave the tournament
        if (data.tournamentId && this.app.tournamentManager) {
            this.app.tournamentManager.leaveTournament(data.tournamentId);
        }
    }

    handleTournamentMatchWon(data) {
        // Winners just get a notification that they won and are waiting
        if (this.app.modalManager) {
            this.app.modalManager.showNotification(data.message || 'You won! Waiting for your next match...', null, 3000);
        }
    }
}

