# Quick Start Guide for Musaix Audio + Lyrics Analyzer

## Installation & Setup

1. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set up API keys (copy .env.example to .env):**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. **Run the demo version (no API keys needed):**
   ```bash
   streamlit run musaix_demo.py
   ```

4. **Run the full version (requires API keys):**
   ```bash
   streamlit run musaix_analyzer.py
   ```

## API Keys Required

- **OpenAI API Key**: For embeddings and AI analysis
- **Pinecone API Key**: For vector storage and search
- **Genius API Token**: For lyrics fetching
- **OpenRouter API Key**: (Optional) Alternative AI provider

## Features

✅ **Audio Analysis**: Upload MP3/WAV files for professional analysis  
✅ **Lyrics Intelligence**: Automatic lyrics fetching and sentiment analysis  
✅ **AI-Powered Insights**: Genre, structure, and mood analysis  
✅ **Vector Search**: Semantic similarity search  
✅ **Visualizations**: Waveforms, spectrograms, clustering  
✅ **Export Options**: CSV, JSON, PDF reports  

Visit http://localhost:8501 after running the application.