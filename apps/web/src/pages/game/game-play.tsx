import { Text, Group, Box, BackgroundImage, Grid, Button, Modal, Stack, Image } from '@mantine/core';
import { Pause, Play, LogOut } from 'lucide-react';
import { Link } from 'wouter';

import Webcam from "react-webcam";
import { useRef, useState, useEffect, useCallback } from "react";
import AmongusLetter from '../../components/amongus_letter';
import GameState from '../../store/game-state';
import { Results } from './results';
import { LevelUp } from '../../components/level-up';

const videoConstraints = {
    width: 200,
    height: 200,
    facingMode: "user"
};


export const GamePlay: React.FC = () => {
    const webcamRef = useRef<Webcam>(null);
    const [prediction, setPrediction] = useState<string | null>(null);
    const [isCameraReady, setCameraReady] = useState(false);
    const [isPaused, setIsPaused] = useState(true);
    const { lives, score, nextLevel, level, mode, scoreToLevel, yellowEvent } = GameState();
    const [currentLetter, setCurrentLetter] = useState<string | null>(null);
    const [showLevelUp, setShowLevelUp] = useState(false);
    const [levelChanged, setLevelChanged] = useState(false);
    const [boxColor, setBoxColor] = useState('#4a90e2');

    const handleLetterGenerated = useCallback((letter: string) => {
        console.log('Letra generada:', letter); 
        setCurrentLetter(letter);
    }, []);

    //test
    // useEffect(() => {
    //     const handleKeyDown = (event: KeyboardEvent) => {
    //         setPrediction(event.key.toUpperCase());
    //     };

    //     window.addEventListener('keydown', handleKeyDown);

    //     return () => {
    //         window.removeEventListener('keydown', handleKeyDown);
    //     };
    // }, []);
    useEffect(() => {
        if (score > 0 && score >= level*scoreToLevel && score < (level+1)*scoreToLevel  && !levelChanged) {
            nextLevel();
            setShowLevelUp(true);
            setLevelChanged(true); 
        }
        if (score % 5 === 1) {
            setLevelChanged(false);
        }
    }, [score, levelChanged, nextLevel]);

    const handleUserMedia = () => {
        console.log("Cámara lista");
        setCameraReady(true);
    };

    useEffect(() => {
        if (!isCameraReady) return;

        let running = true;

        const captureAndSendFrame = async () => {
            await new Promise(resolve => setTimeout(resolve, 50)); //cambia demasiado
            if (!running || !webcamRef.current) return;

            // Capturar la imagen de la cámara como una base64
            const imageSrc = webcamRef.current?.getScreenshot();
            if (!imageSrc) {
                console.error("No se pudo capturar una imagen desde la cámara.");
            }
            if (imageSrc) {
                const formData = new FormData();
                formData.append('file', dataURItoBlob(imageSrc), 'screenshot.jpg');
                if (currentLetter) {
                    formData.append('label', currentLetter); 
                }

                try {
                    // Enviar al backend
                    const response = await fetch('/predict', {
                        method: 'POST',
                        body: formData,
                    });
                    const data = await response.json();
                    setPrediction(data.prediction);
                    // console.log('Respuesta del backend:', data);
                } catch (error) {
                    console.error('Error al enviar al backend:', error);
                }
            }

            requestAnimationFrame(captureAndSendFrame);
        };
        captureAndSendFrame();

        // Limpiar el bucle cuando se desmonte el componente
        return () => {
            running = false;
        };
    }, [isCameraReady, currentLetter]);

    function dataURItoBlob(dataURI: string) {
        const byteString = atob(dataURI.split(',')[1]);
        const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        return new Blob([ab], { type: mimeString });
    }
    
    const changeBoxColor = useCallback((color: string) => {
        setBoxColor(color);
        setTimeout(() => changeBoxColor('#4a90e2'), 700);
      }, []);

    if (lives < 1) {
        return <Results />;
    }

      
    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    return (
        <>
            <BackgroundImage
                src="/src/assets/fondo_bloques.png"
                style={{
                    width: '99vw',
                    height: '98vh',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {showLevelUp && <LevelUp onComplete={()=> setShowLevelUp(false)} />}
                <Grid p={0}>
                    <Grid.Col span={8} mt={30}>
                        <Group style={{ width: '100%' }} display='flex' align='flex-start'>
                            <Box p={10} style={{
                                display: 'flex', flexDirection: 'row', justifyContent: 'flex-start',
                                border: "3px solid #FFFFFF",
                                borderRadius: "15px", align: 'flex-start', marginLeft: 30, marginRight: 150
                            }}>
                                <Image width={50} height={50} src={lives >= 1 ? "/src/assets/vida.png" : "/src/assets/muerte.png"} />
                                <Image width={50} height={50} src={lives >= 2 ? "/src/assets/vida.png" : "/src/assets/muerte.png"} />
                                <Image width={50} height={50} src={lives == 3 ? "/src/assets/vida.png" : "/src/assets/muerte.png"} />
                            </Box>
                            <Box ml={60}
                                style={{
                                    height: "210px",
                                    border: `5px solid ${boxColor}`,
                                    borderRadius: "10px",
                                }}>
                                <Webcam
                                    audio={false}
                                    ref={webcamRef}
                                    screenshotFormat="image/jpeg"
                                    videoConstraints={videoConstraints}
                                    mirrored={true}
                                    imageSmoothing={true}
                                    onUserMedia={handleUserMedia}
                                />
                            </Box>
                            <Stack gap={0}>
                                <Text fz={30} c='white'>LETRA</Text>
                                {mode === 'learn' && <Image width={150} height={150} src={`/src/assets/letters/${currentLetter}.jpg`} fit='contain'/>}
                            </Stack>

                        </Group>
                    </Grid.Col>
                    <Grid.Col span={4} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Stack mr={50} gap={0}>
                        <Text fz={30} c='white'>LEVEL: {level}</Text>
                        <Text fz={28} c='white'>SCORE: {score}</Text>
                        </Stack>
                        <Button size="xl" onClick={() => setIsPaused(true)}><Pause /> </Button>
                    </Grid.Col>
                    <Grid.Col style={{ position: 'absolute', top: '57%' }}>
                        <AmongusLetter prediction={prediction} speed={3} isPaused={isPaused} color={level % 2 === 1 ? 'red' : 'white'} 
                        onLetterGenerated={handleLetterGenerated}
                        changeBoxColor={changeBoxColor}/>
                        {level >= yellowEvent[0] && level < yellowEvent[1] && <AmongusLetter prediction={prediction} speed={3} isPaused={isPaused} color='yellow' 
                        onLetterGenerated={handleLetterGenerated}
                        changeBoxColor={changeBoxColor}/>}
                    </Grid.Col>
                </Grid>


                <Modal opened={isPaused} onClose={() => setIsPaused(false)} title={`MODO DE JUEGO ${mode === 'learn' ? 'APRENDIZAJE' : 'MEMORIZAR'}  -  Menú de Pausa`} 
                    centered
                    overlayProps={{
                        backgroundOpacity: 0.55,
                        blur: 1,
                    }}>
                    <Stack>
                        <Button onClick={() => setIsPaused(false)} rightSection={<Play />}>JUGAR</Button>
                        <Link href='/game'>
                        <Button color='red' w='100%' rightSection={<LogOut />}>SALIR</Button>
                        </Link>
                        
                    </Stack>

                </Modal>
            </BackgroundImage>
        </>
    );
};

