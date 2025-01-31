module.exports = (req, res, next) => {
    const userAgent = req.headers['user-agent'];
    const isScraper = /bot|crawl|spider|scrap/i.test(userAgent);

    if (isScraper) {
        return res.status(403).json({ error: 'Access denied' });
    }

    next();
};
