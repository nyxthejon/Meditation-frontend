import React, { useState, useEffect, useRef } from "react";
import OpenAI from "openai";
import axios from "axios";
import "./App.css"; // make sure to create this file for styles

function App() {
  const [inputText, setInputText] = useState("");
  const [apiResponse, setApiResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const audioRef = useRef(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioLoaded, setAudioLoaded] = useState(false);

  const openai = new OpenAI({
    apiKey:
    process.env.REACT_APP_API_VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
  });

  const handleInputChange = (event) => {
    setInputText(event.target.value);
  };

  const handleButtonClick = async () => {
    setLoading(true);
    setError(null);
    setDisplayText("");
    setApiResponse("");
    setAudioLoading(true);
    setAudioLoaded(false);

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "user", content: inputText },
          {
            role: "system",
            content:
              "You are a compassionate and calming meditation guide. The user will express their current problems, stresses, worries, emotions, or challenges. Respond by providing a short, soothing meditation practice, mindfulness guidance, or thoughtful advice specifically tailored to help them cope with what they're experiencing. Speak directly to the user in a gentle, reassuring tone. Respond ONLY with the meditation or mindfulness advice itself, nothing else.",
          },
        ],
      });

      const message = response.choices[0].message.content;
      setApiResponse(message);

      const audioResponse = await axios.post(
        "https://meditation-backend2.onrender.com/api/elevenlabs",
        { text: message },
        { responseType: "arraybuffer" }
      );

      const audioBlob = new Blob([audioResponse.data], { type: "audio/mpeg" });
      const audioUrl = URL.createObjectURL(audioBlob);

      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.onloadeddata = () => {
          setAudioLoading(false);
          setAudioLoaded(true);
          audioRef.current.play();
        };
      }
    } catch (err) {
      console.error("Error:", err);
      setError(err.message || "An error occurred.");
      setAudioLoading(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (audioLoaded && apiResponse) {
      setDisplayText("");
      let index = -1;
      setIsTyping(true);

      const interval = setInterval(() => {
        if (index < apiResponse.length - 1) {
          setDisplayText((prev) => prev + apiResponse[index]);
          index++;
        } else {
          clearInterval(interval);
          setIsTyping(false);
        }
      }, 50);

      return () => clearInterval(interval);
    }
  }, [audioLoaded, apiResponse]);

  return (
    <div className='app-container'>
      <h1>Meditation Guide</h1>
      <input
        type='text'
        value={inputText}
        onChange={handleInputChange}
        placeholder='Share your feelings...'
        className='input-box'
      />
      <button
        onClick={handleButtonClick}
        disabled={loading}
        className='submit-button'
      >
        {loading ? <div className='loader'></div> : "Get Meditation Advice"}
      </button>
      {error && <p className='error-text'>{error}</p>}
      {displayText && (
        <div className={`response-box ${isTyping ? "typing" : ""}`}>
          {displayText}
        </div>
      )}
      <audio ref={audioRef} style={{ display: "none" }} />
    </div>
  );
}

export default App;
