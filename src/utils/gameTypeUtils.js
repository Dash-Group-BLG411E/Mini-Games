function normalizeGameType(gameType) {
    const normalized = (gameType || 'three-mens-morris').toLowerCase().replace(/_/g, '-');
    const mapping = {
        'three-mens-morris': 'threeMensMorris',
        'memory-match': 'memoryMatch',
        'battleship': 'battleship'
    };
    return mapping[normalized] || 'threeMensMorris';
}

module.exports = { normalizeGameType }
