#!/usr/bin/env python3
"""
Simple test script for Musaix Audio Analyzer
This script tests basic functionality without requiring API keys
"""

import os
import tempfile
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from io import StringIO

# Test imports
def test_imports():
    """Test that all required packages can be imported"""
    try:
        import streamlit
        import numpy
        import pandas
        import librosa
        import matplotlib.pyplot
        import sklearn
        import textblob
        import requests
        from dotenv import load_dotenv
        from mutagen import File as MutagenFile
        from pydub import AudioSegment
        print("✅ All core dependencies imported successfully")
        return True
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False

def test_audio_functions():
    """Test audio processing functions with synthetic data"""
    try:
        # Create synthetic audio data
        duration = 2.0  # 2 seconds
        sample_rate = 22050
        t = np.linspace(0, duration, int(sample_rate * duration))
        frequency = 440  # A4 note
        synthetic_audio = 0.5 * np.sin(2 * np.pi * frequency * t)
        
        # Test audio fingerprinting
        from musaix_analyzer import fingerprint_audio
        fingerprint = fingerprint_audio(synthetic_audio)
        print(f"✅ Audio fingerprinting works: {fingerprint[:8]}...")
        
        # Test chunk analysis
        from musaix_analyzer import analyze_chunk
        chunk_data = (synthetic_audio, sample_rate)
        analysis = analyze_chunk(chunk_data)
        print(f"✅ Chunk analysis works: tempo={analysis['tempo']:.1f} BPM")
        
        return True
    except Exception as e:
        print(f"❌ Audio function error: {e}")
        return False

def test_text_analysis():
    """Test text analysis functions"""
    try:
        from musaix_analyzer import analyze_lyrics
        sample_lyrics = "This is a test song with happy lyrics about love and joy"
        analysis = analyze_lyrics(sample_lyrics)
        print(f"✅ Lyrics analysis works: sentiment={analysis['sentiment']:.2f}")
        return True
    except Exception as e:
        print(f"❌ Text analysis error: {e}")
        return False

def test_data_processing():
    """Test data processing capabilities"""
    try:
        # Test DataFrame operations
        sample_data = [
            {"tempo": 120, "beats": 32, "duration": 30.0},
            {"tempo": 140, "beats": 35, "duration": 30.0},
            {"tempo": 100, "beats": 25, "duration": 30.0}
        ]
        df = pd.DataFrame(sample_data)
        
        # Test CSV export
        csv_buffer = StringIO()
        df.to_csv(csv_buffer, index=False)
        csv_content = csv_buffer.getvalue()
        
        print(f"✅ Data processing works: {len(df)} rows, CSV length={len(csv_content)}")
        return True
    except Exception as e:
        print(f"❌ Data processing error: {e}")
        return False

def test_visualization():
    """Test basic visualization capabilities"""
    try:
        # Create sample data
        x = np.linspace(0, 10, 100)
        y = np.sin(x)
        
        # Test matplotlib
        fig, ax = plt.subplots(figsize=(8, 4))
        ax.plot(x, y)
        ax.set_title("Test Waveform")
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp:
            fig.savefig(tmp.name)
            tmp_path = tmp.name
        
        plt.close(fig)
        
        # Check file was created
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)  # Clean up
            print("✅ Visualization works: matplotlib plots generated successfully")
            return True
        else:
            print("❌ Visualization error: plot file not created")
            return False
    except Exception as e:
        print(f"❌ Visualization error: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 Testing Musaix Audio Analyzer Components\n")
    
    tests = [
        ("Package Imports", test_imports),
        ("Audio Functions", test_audio_functions),
        ("Text Analysis", test_text_analysis),
        ("Data Processing", test_data_processing),
        ("Visualization", test_visualization)
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n📋 Testing {test_name}:")
        try:
            result = test_func()
            results.append(result)
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {e}")
            results.append(False)
    
    # Summary
    passed = sum(results)
    total = len(results)
    print(f"\n🏁 Test Summary: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Musaix is ready to run.")
        print("\nTo start the application:")
        print("  streamlit run musaix_analyzer.py")
    else:
        print("⚠️  Some tests failed. Please check dependencies and fix issues.")
        print("\nTo install dependencies:")
        print("  pip install -r requirements.txt")

if __name__ == "__main__":
    main()