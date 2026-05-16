import "regenerator-runtime/runtime";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import OpenAI from "openai";
import { FaMicrophone } from 'react-icons/fa';
import Webcam from "react-webcam";
import AWS from 'aws-sdk';


function App() {
  const [data, setData] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [gptData, setGptData] = useState<any | null>(null);
  const [link, setLink] = useState("");

  const openai = new OpenAI({ apiKey: import.meta.env.VITE_OPENAI_API_KEY, dangerouslyAllowBrowser: true });

  AWS.config.update({
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY,
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
    region: import.meta.env.VITE_AWS_REGION,
  });

  const s3 = new AWS.S3();

  const handleUploadImage = async () => {
    if (imgSrc) {
      const imageBlob = await fetch(imgSrc).then((res) => res.blob());
      const timestamp = new Date().getTime();
      const fileName = `image_${timestamp}.jpg`;
  
      const params = {
        Bucket: 'virtuchatimages',
        Key: fileName,
        Body: imageBlob,
        ContentType: 'image/jpeg',
        ACL: 'public-read', 
      };
  
      try {
        const uploadResult = await s3.upload(params).promise();
        setLink(uploadResult.Location);
        console.log('Image uploaded successfully!');
        console.log(link);
      } catch (error) {
        console.error('Error uploading image to S3:', error);
      }
    } else {
      console.error('No image to upload.');
    }
  };

  async function gptreq() {
    const completion = await openai.chat.completions.create({
      messages: [{ role: "system", content: "Hello GPT, you are acting as virtuchat, a online therapist that takes in an emotion, and words spoken by a person and gives a response. Here is the emotion" + data + " and what the person said" + transcript }],

      model: "gpt-3.5-turbo",
    });

    setGptData(completion.choices[0].message.content);
  }


  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  const postData = {
    link: link,
  };

  useEffect(() => {
    fetch("http://localhost:5003/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postData),
    })
      .then(res => res.json())
      .then(data => {
        setData(data);
        console.log(data);
      });
  }, [link]);

  const [isListening, setIsListening] = useState(false);

  const handleStartListening = () => {
    if (isListening) {
      SpeechRecognition.stopListening();
    } else {
      SpeechRecognition.startListening({ continuous: true });
    }
    setIsListening(!isListening);
  };

  const webcamRef = useRef<Webcam>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setImgSrc(imageSrc);
    }
  }, [webcamRef]);

  return (
    <div className="flex items-center scroll-container justify-center h-screen">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">VirtuChat</h1>

        <div>
          <button
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            onClick={gptreq}
          >
            Gpt response
          </button>
          <p>{gptData}</p>
          <div>
            <p>Microphone: {listening ? 'on' : 'off'}</p>
            <button onClick={handleStartListening}>
              <FaMicrophone size={24} color={listening ? "green" : "red"} />
            </button>
          </div>
        </div>
        <div className='center-align align-center content-center justify-center'>
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat='image/jpeg'
            className="center-align"
          />
          <button onClick={capture}>Click on me</button>
          <button onClick={handleUploadImage}>Upload Image to AWS</button>
        </div>
        {data && (
          <div className="mt-4">
            <p className="text-xl font-semibold">Fetched Data:</p>
            <pre className="text-sm bg-gray-200 text-black p-2 rounded-md">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
