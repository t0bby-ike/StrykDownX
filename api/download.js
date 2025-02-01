const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    const { videoUrl, quality, format } = req.body;

    if (!videoUrl) {
        return res.status(400).json({ error: 'Video URL is required' });
    }

    try {
        // Extract the tweet ID from the video URL
        const tweetId = videoUrl.split('/').pop().split('?')[0];

        // Use Twitsave API to get download links
        const twitsaveResponse = await axios.get(`https://twitsave.com/info?url=${tweetId}`);

        // Check if the API returned valid data
        if (!twitsaveResponse.data || !twitsaveResponse.data.variants) {
            throw new Error('Failed to fetch video data from Twitsave');
        }

        // Get the highest quality video URL
        const videoData = twitsaveResponse.data.variants.find(v => v.quality === quality) || twitsaveResponse.data.variants[0];
        const downloadUrl = videoData.url;

        // Download the video
        const videoResponse = await axios({
            url: downloadUrl,
            method: 'GET',
            responseType: 'stream',
        });

        // Create a temporary file path
        const tempFilePath = path.join('/tmp', `temp_video_${Date.now()}.mp4`);
        const writer = fs.createWriteStream(tempFilePath);

        videoResponse.data.pipe(writer);

        writer.on('finish', () => {
            // Verify the download completion
            if (fs.existsSync(tempFilePath)) {
                // Generate a unique filename
                const timestamp = Date.now();
                const fileName = `Drstryk_𝕏_Downloader_${timestamp}.${format}`;

                // Send the file back
                res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
                res.setHeader('Content-Type', format === 'gif' ? 'image/gif' : 'video/mp4');
                fs.createReadStream(tempFilePath).pipe(res);

                // Clean up temporary file
                fs.unlinkSync(tempFilePath);
            } else {
                res.status(500).json({ error: 'Download verification failed' });
            }
        });

        writer.on('error', (err) => {
            console.error('Error writing file:', err);
            res.status(500).json({ error: 'Failed to download video' });
        });
    } catch (error) {
        console.error('Error downloading video:', error);
        res.status(500).json({ error: 'Failed to download video. Please check the URL and try again.' });
    }
};