# Musaix - Extended Audio + Lyrics Analyzer with Semantic Intelligence

import os
import re
import json
import uuid
import requests
import tempfile
import numpy as np
import pandas as pd
import librosa
import librosa.display
import matplotlib.pyplot as plt
import streamlit as st
import pinecone
from dotenv import load_dotenv
from mutagen import File as MutagenFile
from pydub import AudioSegment
from io import BytesIO, StringIO
from fpdf import FPDF
from textblob import TextBlob
import lyricsgenius
import openai
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

# --------------------- Load Environment ---------------------
load_dotenv()

# --------------------- API Keys ---------------------
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_ENV = os.getenv("PINECONE_ENV", "us-east-1")
PINECONE_INDEX = os.getenv("PINECONE_INDEX", "musaix-audio")
GENIUS_TOKEN = os.getenv("GENIUS_API_TOKEN")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "text-embedding-ada-002")

# --------------------- Services Init ---------------------
# Initialize OpenAI client
if OPENAI_API_KEY:
    from openai import OpenAI
    openai_client = OpenAI(api_key=OPENAI_API_KEY)
else:
    openai_client = None

# Initialize Pinecone (using updated API)
try:
    from pinecone import Pinecone, ServerlessSpec
    if PINECONE_API_KEY:
        pc = Pinecone(api_key=PINECONE_API_KEY)
        if PINECONE_INDEX not in [idx.name for idx in pc.list_indexes()]:
            pc.create_index(
                name=PINECONE_INDEX,
                dimension=1536,
                metric="cosine",
                spec=ServerlessSpec(cloud="aws", region=PINECONE_ENV)
            )
        index = pc.Index(PINECONE_INDEX)
    else:
        index = None
except ImportError:
    # Fallback to older pinecone API
    import pinecone
    if PINECONE_API_KEY:
        pinecone.init(api_key=PINECONE_API_KEY, environment=PINECONE_ENV)
        if PINECONE_INDEX not in pinecone.list_indexes():
            pinecone.create_index(PINECONE_INDEX, dimension=1536)
        index = pinecone.Index(PINECONE_INDEX)
    else:
        index = None

# Initialize Genius
if GENIUS_TOKEN:
    genius = lyricsgenius.Genius(GENIUS_TOKEN, skip_non_songs=True, remove_section_headers=True)
else:
    genius = None

# --------------------- Streamlit UI ---------------------
st.set_page_config(page_title="🎵 Musaix Analyzer", layout="wide")
st.title("🎧 Musaix Audio + Lyrics Analyzer")

# API Status indicators
col1, col2, col3, col4 = st.columns(4)
with col1:
    if openai_client:
        st.success("✅ OpenAI")
    else:
        st.error("❌ OpenAI")

with col2:
    if index:
        st.success("✅ Pinecone")
    else:
        st.error("❌ Pinecone")

with col3:
    if genius:
        st.success("✅ Genius")
    else:
        st.error("❌ Genius")

with col4:
    if OPENROUTER_API_KEY:
        st.success("✅ OpenRouter")
    else:
        st.warning("⚠️ OpenRouter")

st.sidebar.header("⚙️ Settings")
sample_rate = st.sidebar.slider("Sample Rate", 8000, 48000, 22050)
n_mfcc = st.sidebar.slider("MFCCs", 5, 40, 13)
chunk_duration = st.sidebar.slider("Chunk Duration (s)", 10, 60, 30)
model_provider = st.sidebar.selectbox("LLM Provider", ["OpenAI", "OpenRouter"])

# API key setup instructions
with st.sidebar.expander("🔧 API Key Setup"):
    st.markdown("""
    **Required for full functionality:**
    
    1. **OpenAI API Key** - For embeddings and AI analysis
    2. **Pinecone API Key** - For vector search
    3. **Genius API Token** - For lyrics fetching
    
    **Optional:**
    4. **OpenRouter API Key** - Alternative AI provider
    
    Create a `.env` file with your keys (see `.env.example`)
    """)

st.markdown("---")

# --------------------- Upload ---------------------
files = st.file_uploader("Upload Audio Files", type=["mp3", "wav"], accept_multiple_files=True)

# --------------------- Helper Functions ---------------------
def convert_to_wav(audio_path):
    audio = AudioSegment.from_file(audio_path)
    wav_path = tempfile.mktemp(suffix=".wav")
    audio.export(wav_path, format="wav")
    return wav_path

def extract_audio_metadata(path):
    try:
        m = MutagenFile(path)
        if m is None:
            return {"error": "Could not read audio file"}
        return {
            "bitrate": getattr(m.info, "bitrate", None),
            "channels": getattr(m.info, "channels", None),
            "length": getattr(m.info, "length", None),
            "sample_rate": getattr(m.info, "sample_rate", None),
            "bit_depth": getattr(m.info, "bits_per_sample", None),
            "codec": type(m.info).__name__
        }
    except Exception as e:
        return {"error": f"Error reading metadata: {str(e)}"}

def fingerprint_audio(y):
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, str(np.round(np.mean(y), 5))))

def analyze_chunk(chunk):
    y, sr = chunk
    tempo, beats = librosa.beat.beat_track(y=y, sr=sr)
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=n_mfcc)
    return {
        "tempo": float(tempo),
        "beats": int(len(beats)),
        "duration": float(len(y) / sr),
        "zcr": float(np.mean(librosa.feature.zero_crossing_rate(y))),
        "centroid": float(np.mean(librosa.feature.spectral_centroid(y=y, sr=sr))),
        "mfcc_mean": mfcc.mean(axis=1).tolist()
    }

def analyze_audio_chunks(audio_path):
    try:
        duration = librosa.get_duration(filename=audio_path)
        results = []
        for start in range(0, int(duration), chunk_duration):
            end_time = min(start + chunk_duration, duration)
            if end_time - start < 1:  # Skip chunks less than 1 second
                break
            chunk = librosa.load(audio_path, sr=sample_rate, offset=start, duration=chunk_duration)
            results.append(analyze_chunk(chunk))
        return results
    except Exception as e:
        st.error(f"Error analyzing audio chunks: {str(e)}")
        return []

def get_lyrics(artist, title):
    if not genius:
        return "Lyrics not found. Please set GENIUS_API_TOKEN."
    try:
        song = genius.search_song(title, artist)
        return song.lyrics if song else "Lyrics not found."
    except Exception as e:
        return f"Lyrics not found. Error: {str(e)}"

def analyze_lyrics(lyrics):
    blob = TextBlob(lyrics)
    return {
        "sentiment": blob.sentiment.polarity,
        "subjectivity": blob.sentiment.subjectivity,
        "word_count": len(blob.words),
        "noun_phrases": blob.noun_phrases[:10]
    }

def get_advanced_analysis(lyrics):
    prompt = f"""
    Analyze the following lyrics:
    {lyrics}
    
    Return a JSON structure summarizing:
    - Genre
    - Year (if implied)
    - Instruments used
    - Vocal style
    - Structure (verse/chorus/bridge)
    - Rhyme scheme
    - Overall mood and tone
    - BPM estimate
    - Any other interesting musical characteristic
    """
    
    if not openai_client and not OPENROUTER_API_KEY:
        return json.dumps({"error": "No AI provider configured"})
    
    if model_provider == "OpenAI" and openai_client:
        try:
            completion = openai_client.chat.completions.create(
                model="gpt-4",
                messages=[{"role": "user", "content": prompt}]
            )
            return completion.choices[0].message.content
        except Exception as e:
            return json.dumps({"error": f"OpenAI API error: {str(e)}"})
    else:
        try:
            headers = {"Authorization": f"Bearer {OPENROUTER_API_KEY}"}
            resp = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                json={
                    "model": "mistralai/mixtral-8x7b",
                    "messages": [{"role": "user", "content": prompt}]
                },
                timeout=20
            )
            return resp.json()['choices'][0]['message']['content']
        except Exception as e:
            return json.dumps({"error": f"OpenRouter API error: {str(e)}"})

def generate_embedding(text):
    if not openai_client:
        return None
    try:
        response = openai_client.embeddings.create(input=text, model=EMBEDDING_MODEL)
        return response.data[0].embedding
    except Exception as e:
        st.error(f"Error generating embedding: {str(e)}")
        return None

def upsert_pinecone(audio_id, vector, meta):
    if not index or vector is None:
        return False
    try:
        index.upsert([(audio_id, vector, meta)])
        return True
    except Exception as e:
        st.error(f"Error upserting to Pinecone: {str(e)}")
        return False

def search_similar(query):
    if not index or not openai_client:
        return {"matches": []}
    try:
        vec = generate_embedding(query)
        if vec is None:
            return {"matches": []}
        result = index.query(vector=vec, top_k=5, include_metadata=True)
        return result
    except Exception as e:
        st.error(f"Error searching: {str(e)}")
        return {"matches": []}

def generate_pdf_report(title, audio, metadata, lyrics, analysis):
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=12)
    pdf.cell(200, 10, txt=f"Musaix Report: {title}", ln=True)
    pdf.ln(10)
    for k, v in metadata.items():
        pdf.cell(200, 10, txt=f"Meta: {k} = {v}", ln=True)
    pdf.ln(10)
    for i, chunk in enumerate(audio):
        pdf.cell(200, 10, txt=f"Chunk {i+1}: {json.dumps(chunk)}", ln=True)
    pdf.ln(10)
    for k, v in analysis.items():
        pdf.cell(200, 10, txt=f"Lyrics: {k} = {v}", ln=True)
    pdf.output(f"{title}_report.pdf")

# --------------------- Main Logic ---------------------
all_embeddings = []
if files:
    for f in files:
        with tempfile.NamedTemporaryFile(delete=False, suffix=f.name.split(".")[-1]) as tmp:
            tmp.write(f.read())
            path = tmp.name
        if not path.endswith(".wav"):
            path = convert_to_wav(path)

        audio_chunks = analyze_audio_chunks(path)
        metadata = extract_audio_metadata(path)
        y, _ = librosa.load(path, sr=sample_rate)
        audio_id = fingerprint_audio(y)

        st.subheader(f"🎵 {f.name}")
        st.write("**Audio Fingerprint ID**:", audio_id)
        st.json(metadata)

        df = pd.DataFrame(audio_chunks)
        st.dataframe(df)

        # Downloadable CSV
        csv_buffer = StringIO()
        df.to_csv(csv_buffer, index=False)
        st.download_button("📥 Download CSV", data=csv_buffer.getvalue(), file_name=f"{f.name}_audio_analysis.csv", mime="text/csv")

        # Visuals
        st.subheader("🎛️ Waveform")
        fig, ax = plt.subplots()
        librosa.display.waveshow(y, sr=sample_rate, ax=ax)
        st.pyplot(fig)

        st.subheader("🌈 Mel-Spectrogram")
        S = librosa.feature.melspectrogram(y=y, sr=sample_rate, n_mels=128)
        S_DB = librosa.power_to_db(S, ref=np.max)
        fig, ax = plt.subplots()
        librosa.display.specshow(S_DB, sr=sample_rate, x_axis='time', y_axis='mel', ax=ax)
        fig.colorbar(ax.images[0], ax=ax, format='%+2.0f dB')
        st.pyplot(fig)

        # Lyrics Section
        with st.expander("🎤 Lyrics + Sentiment + Genre AI"):
            artist = st.text_input("Artist Name", key=f"artist_{f.name}")
            title = st.text_input("Song Title", key=f"title_{f.name}")
            if artist and title:
                lyrics = get_lyrics(artist, title)
                st.text_area("Lyrics", lyrics, height=200)
                lyr_analysis = analyze_lyrics(lyrics)
                st.json(lyr_analysis)

                # AI Genre/Structure Analysis
                st.subheader("🧠 LLM Song Insight")
                song_ai_json = get_advanced_analysis(lyrics)
                try:
                    song_ai_dict = json.loads(song_ai_json)
                    st.json(song_ai_dict)
                    all_embeddings.append(song_ai_dict)
                    st.download_button("📥 Download Song Analysis JSON", data=json.dumps(song_ai_dict, indent=2), file_name=f"{f.name}_ai_lyrics_analysis.json")
                except:
                    st.text(song_ai_json)

                # Vector + Pinecone
                if openai_client and index:
                    embedding_text = lyrics + json.dumps(audio_chunks)
                    vector = generate_embedding(embedding_text)
                    meta = {
                        "artist": artist,
                        "title": title,
                        "sentiment": lyr_analysis["sentiment"],
                        "tempo_avg": float(np.mean([c["tempo"] for c in audio_chunks])) if audio_chunks else 0
                    }
                    success = upsert_pinecone(audio_id, vector, meta)
                    if success:
                        st.success("✅ Audio data stored in vector database")
                    else:
                        st.warning("⚠️ Failed to store in vector database")

        # PDF Report Generation (simplified)
        try:
            report_data = {
                "filename": f.name,
                "audio_id": audio_id,
                "metadata": metadata,
                "audio_chunks": len(audio_chunks),
                "analysis_timestamp": pd.Timestamp.now().isoformat()
            }
            report_json = json.dumps(report_data, indent=2)
            st.download_button(
                "📥 Download Analysis Report (JSON)", 
                data=report_json, 
                file_name=f"{f.name}_analysis_report.json",
                mime="application/json"
            )
        except Exception as e:
            st.error(f"Error generating report: {str(e)}")

# --------------------- Genre Clustering ---------------------
if all_embeddings:
    df_embed = pd.DataFrame(all_embeddings)
    st.header("🎨 Genre & Feature Clustering")
    try:
        numeric_df = df_embed.select_dtypes(include=[np.number]).dropna()
        scaler = StandardScaler()
        scaled = scaler.fit_transform(numeric_df)
        reduced = PCA(n_components=2).fit_transform(scaled)
        km = KMeans(n_clusters=3, random_state=0).fit(reduced)
        fig, ax = plt.subplots()
        scatter = ax.scatter(reduced[:, 0], reduced[:, 1], c=km.labels_, cmap='Set2')
        ax.set_title("Genre-Inspired Clustering")
        st.pyplot(fig)
    except Exception as e:
        st.warning("Clustering skipped: insufficient numeric features or malformed JSON")

# --------------------- Semantic Search ---------------------
st.markdown("---")
st.header("🔍 Semantic Audio Search")

if not openai_client or not index:
    st.warning("⚠️ Semantic search requires both OpenAI API key and Pinecone configuration")
else:
    query = st.text_input("Describe a song or theme to find similar audio:")
    if query:
        with st.spinner("Searching..."):
            results = search_similar(query)
            if results["matches"]:
                st.subheader("Search Results:")
                for match in results["matches"]:
                    st.write(f"🔗 Match: {match['id']} | Score: {match['score']:.4f}")
                    if 'metadata' in match:
                        st.json(match['metadata'])
            else:
                st.info("No matches found. Try uploading and analyzing some audio files first.")

st.markdown("---")
st.markdown("Built with ❤️ by Musaix • AI for Audio & Lyrics Intelligence")