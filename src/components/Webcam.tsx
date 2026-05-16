import React, { useRef , useState, useCallback} from 'react';
import Webcam, { WebcamProps } from 'react-webcam';

const WebcamCapture: React.FC = () => {
    const webcamRef = useRef<Webcam>(null);
    const [imgSrc, setImgSrc] = useState<string |null>(null);

    const capture = useCallback(() => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if(imageSrc) {
            setImgSrc(imageSrc);
        }
      }, [webcamRef]);

    return (
        <>
        <div>
        <Webcam
                audio={false}
                height={600}
                width={600}
                ref={webcamRef}
                screenshotFormat='image/jpeg'
            />
            <button onClick={capture}>Click on me</button>
            {imgSrc && <img src={imgSrc} alt="Screenshot" />}
        </div>
            
        </>
    );
};

export default WebcamCapture;