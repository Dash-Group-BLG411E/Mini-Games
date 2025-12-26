

class ReportManager {
    constructor(app) {
        this.app = app;

        this.reportModal = app.reportModal;
        this.reportTargetName = app.reportTargetName;
        this.reportSubmitBtn = app.reportSubmitBtn;
        this.reportCancelBtn = app.reportCancelBtn;

        this.pendingReportUsername = null;
        this.recentChatMessages = [];
        this.maxChatHistory = 20;
    }

    // Store chat messages for potential reports
    addChatMessage(username, message) {
        this.recentChatMessages.push({
            username,
            message,
            timestamp: new Date()
        });
        // Keep only the last N messages
        if (this.recentChatMessages.length > this.maxChatHistory) {
            this.recentChatMessages.shift();
        }
    }

    // Get chat history involving a specific user
    getChatHistoryForUser(username) {
        // Use lobby messages from the app, which are already captured by socket handler
        const messages = this.app.lobbyMessages || [];
        return messages.slice(-this.maxChatHistory).map(msg => ({
            username: msg.username,
            message: msg.message,
            timestamp: msg.timestamp || new Date()
        }));
    }

    getSelectedReason() {
        const selectedRadio = document.querySelector('input[name="report-reason"]:checked');
        return selectedRadio ? selectedRadio.value : 'inappropriate_name';
    }

    openReportModal(username) {
        if (!this.reportModal || this.app.userRole === 'guest') {
            if (this.app.modalManager) {
                this.app.modalManager.showNotification('You must be logged in to report users.');
            }
            return;
        }

        this.pendingReportUsername = username;
        if (this.reportTargetName) {
            this.reportTargetName.textContent = username;
        }

        // Reset to first option
        const firstRadio = document.querySelector('input[name="report-reason"][value="inappropriate_name"]');
        if (firstRadio) {
            firstRadio.checked = true;
        }

        // Update hint
        this.updateReportHint();

        if (this.reportModal) {
            this.reportModal.classList.remove('hidden');
        }
    }

    updateReportHint() {
        const hint = document.getElementById('report-hint');
        if (!hint) return;

        const reason = this.getSelectedReason();
        if (reason === 'bad_words') {
            hint.textContent = 'Recent chat messages will be attached to this report.';
        } else {
            hint.textContent = 'The user\'s current username will be reviewed.';
        }
    }

    closeReportModal() {
        if (!this.reportModal) return;
        this.reportModal.classList.add('hidden');
        this.pendingReportUsername = null;
    }

    async submitReport() {
        if (!this.pendingReportUsername) {
            this.closeReportModal();
            return;
        }

        if (!this.app.token) {
            if (this.app.modalManager) {
                this.app.modalManager.showNotification('You must be logged in to submit reports.');
            }
            this.closeReportModal();
            return;
        }

        const reason = this.getSelectedReason();

        // Build report data
        const reportData = {
            reportedUserId: this.pendingReportUsername,
            reason
        };

        // Include chat history for bad_words reports
        if (reason === 'bad_words') {
            reportData.chatHistory = this.getChatHistoryForUser(this.pendingReportUsername);
        }

        try {
            const response = await fetch('/api/reports', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.app.token}`,
                },
                body: JSON.stringify(reportData),
            });

            const data = await response.json();

            if (!response.ok) {
                const errorMessage = data && data.error ? data.error : 'Failed to submit report.';
                if (this.app.modalManager) {
                    this.app.modalManager.showNotification(errorMessage);
                }
            } else {
                if (this.app.modalManager) {
                    this.app.modalManager.showNotification('Report submitted. Thank you for your feedback.');
                }
            }
        } catch (error) {
            console.error('Error submitting report:', error);
            if (this.app.modalManager) {
                this.app.modalManager.showNotification('Failed to submit report. Please check your connection and try again.');
            }
        } finally {
            this.closeReportModal();
        }
    }

    registerEventListeners() {
        if (this.reportSubmitBtn) {
            this.reportSubmitBtn.addEventListener('click', () => this.submitReport());
        }
        if (this.reportCancelBtn) {
            this.reportCancelBtn.addEventListener('click', () => this.closeReportModal());
        }

        if (this.reportModal) {
            this.reportModal.addEventListener('click', (e) => {
                if (e.target === this.reportModal) {
                    this.closeReportModal();
                }
            });
        }

        // Listen for reason changes to update hint
        const reasonRadios = document.querySelectorAll('input[name="report-reason"]');
        reasonRadios.forEach(radio => {
            radio.addEventListener('change', () => this.updateReportHint());
        });
    }
}
