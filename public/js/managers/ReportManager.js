

class ReportManager {
    constructor(app) {
        this.app = app;
        
        this.reportModal = app.reportModal;
        this.reportTargetName = app.reportTargetName;
        this.reportReasonSelect = app.reportReasonSelect;
        this.reportMessageInput = app.reportMessageInput;
        this.reportSubmitBtn = app.reportSubmitBtn;
        this.reportCancelBtn = app.reportCancelBtn;
        
        this.pendingReportUsername = null;
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
        if (this.reportReasonSelect) {
            this.reportReasonSelect.value = 'cheating';
        }
        if (this.reportMessageInput) {
            this.reportMessageInput.value = '';
        }
        if (this.reportModal) {
            this.reportModal.classList.remove('hidden');
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

        const reason = this.reportReasonSelect?.value || 'cheating';
        const message = this.reportMessageInput?.value || '';

        try {
            const response = await fetch('/api/reports', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.app.token}`,
                },
                body: JSON.stringify({
                    reportedUserId: this.pendingReportUsername,
                    reason,
                    message,
                }),
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
    }
}
