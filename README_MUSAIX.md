# Musaix - Extended Audio + Lyrics Analyzer with Semantic Intelligence

🎧 A comprehensive audio analysis tool that combines advanced audio processing, lyrics analysis, and AI-powered insights.

## Features

### 🎵 Audio Analysis
- **Multi-format Support**: MP3, WAV audio files
- **Advanced Audio Processing**: Using librosa for professional-grade analysis
- **Chunk-based Analysis**: Configurable time segments for detailed insights
- **Audio Fingerprinting**: Unique identification for each audio file
- **Metadata Extraction**: Comprehensive file information

### 🎤 Lyrics Intelligence
- **Genius Integration**: Automatic lyrics fetching
- **Sentiment Analysis**: Emotional tone detection using TextBlob
- **AI-Powered Analysis**: Genre, structure, and style analysis
- **Lyrical Insights**: Noun phrases, word count, subjectivity metrics

### 🧠 AI & Machine Learning
- **OpenAI Integration**: GPT-4 powered music analysis
- **OpenRouter Support**: Alternative AI provider option
- **Vector Embeddings**: Semantic representation of audio+lyrics
- **Clustering**: Genre and feature-based grouping
- **Semantic Search**: Find similar tracks by description

### 🔍 Vector Database
- **Pinecone Integration**: Store and search audio embeddings
- **Similarity Matching**: Find musically similar content
- **Metadata Storage**: Rich context for each audio piece

### 📊 Visualizations
- **Waveform Display**: Time-domain audio visualization
- **Mel-Spectrograms**: Frequency-time representations
- **Feature Clustering**: PCA and K-means visualization
- **Interactive Charts**: Powered by matplotlib and streamlit

### 📥 Export & Reports
- **CSV Export**: Detailed audio analysis data
- **JSON Reports**: Comprehensive analysis summaries
- **Download Options**: Multiple format support

## Quick Start

### 1. Prerequisites
- Python 3.8+
- API Keys (see setup below)

### 2. Installation

```bash
# Clone the repository
git clone https://github.com/sterl27/Beat9.git
cd Beat9

# Install dependencies
pip install -r requirements.txt
```

### 3. API Setup

Copy the example environment file and add your API keys:

```bash
cp .env.example .env
```

Edit `.env` with your API keys:

```env
# Required
OPENAI_API_KEY=your_openai_api_key_here
PINECONE_API_KEY=your_pinecone_api_key_here
GENIUS_API_TOKEN=your_genius_api_token_here

# Optional
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

### 4. Run the Application

```bash
streamlit run musaix_analyzer.py
```

The application will open in your browser at `http://localhost:8501`

## API Key Setup Guide

### OpenAI API Key
1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Create an account or sign in
3. Navigate to API Keys section
4. Create a new API key
5. Copy and paste into `.env` file

### Pinecone API Key
1. Visit [Pinecone](https://www.pinecone.io/)
2. Create an account
3. Create a new project
4. Get your API key from the dashboard
5. Note your environment (e.g., "us-east-1")

### Genius API Token
1. Visit [Genius API](https://genius.com/api-clients)
2. Create a new application
3. Get your access token
4. Copy and paste into `.env` file

### OpenRouter API Key (Optional)
1. Visit [OpenRouter](https://openrouter.ai/)
2. Create an account
3. Get your API key
4. Use as alternative to OpenAI

## Usage Guide

### 1. Upload Audio Files
- Drag and drop MP3/WAV files
- Multiple files supported
- Real-time processing

### 2. Configure Settings
- **Sample Rate**: Audio processing quality (22050 recommended)
- **MFCCs**: Number of mel-frequency cepstral coefficients (13 default)
- **Chunk Duration**: Analysis segment length in seconds (30s default)
- **LLM Provider**: Choose between OpenAI or OpenRouter

### 3. Audio Analysis
- Automatic processing upon upload
- View audio fingerprint ID
- Explore metadata and technical details
- Download CSV data

### 4. Lyrics Analysis
- Enter artist and song title
- Automatic lyrics fetching
- Sentiment and structure analysis
- AI-powered insights

### 5. Visualizations
- Waveform display
- Mel-spectrogram analysis
- Genre clustering (when multiple files analyzed)

### 6. Semantic Search
- Describe musical characteristics
- Find similar audio content
- Powered by vector similarity

## Technical Details

### Audio Features Extracted
- **Tempo**: BPM detection
- **Beat Tracking**: Rhythmic analysis
- **MFCCs**: Timbral characteristics
- **Zero Crossing Rate**: Spectral properties
- **Spectral Centroid**: Brightness measure

### AI Analysis Includes
- Genre classification
- Era/year estimation
- Instrumental arrangement
- Vocal style analysis
- Song structure (verse/chorus/bridge)
- Rhyme scheme patterns
- Mood and tone assessment
- BPM estimation

### Vector Embeddings
- Combined audio+lyrics representation
- 1536-dimensional OpenAI embeddings
- Cosine similarity search
- Metadata-enriched storage

## Dependencies

- **Streamlit**: Web application framework
- **Librosa**: Audio analysis library
- **OpenAI**: AI-powered analysis
- **Pinecone**: Vector database
- **LyricsGenius**: Lyrics fetching
- **Scikit-learn**: Machine learning
- **TextBlob**: Natural language processing
- **Matplotlib**: Visualization
- **Pandas/NumPy**: Data processing

## Troubleshooting

### Common Issues

1. **"No module named 'librosa'"**
   - Solution: `pip install librosa`

2. **"API key not found"**
   - Check your `.env` file exists and has correct keys
   - Restart the application after adding keys

3. **"Pinecone connection failed"**
   - Verify API key and environment in `.env`
   - Check Pinecone dashboard for quota limits

4. **"Audio file not supported"**
   - Ensure file is MP3 or WAV format
   - Check file isn't corrupted

### Performance Tips

- Use 22050 Hz sample rate for good quality/speed balance
- Process shorter audio files for faster analysis
- Use smaller chunk durations for more granular analysis
- Enable GPU acceleration for librosa if available

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is open source. Please check the repository for license details.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Open an issue on GitHub
3. Review API provider documentation

---

Built with ❤️ by Musaix • AI for Audio & Lyrics Intelligence