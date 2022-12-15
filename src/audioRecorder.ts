export const audioRecorder = async () => {
  let data: Int16Array | undefined = undefined
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });

    const mediaRecorder = new MediaRecorder(stream);

    const audioBlobs: Array<Blob> = [];

    mediaRecorder.addEventListener("dataavailable", (event) => {
      console.log("recieving data");
      audioBlobs.push(event.data);
    });

    mediaRecorder.start();
    console.log("start recording");

    const mimetype = mediaRecorder.mimeType;
    const x = () =>
      new Promise((resolve) => {
        setTimeout(() => {
          resolve(null);
        }, 10 * 1000);
      });

    await x();


    const getBlobs = () => new Promise<Blob>( (res)=> {
      mediaRecorder.addEventListener("stop" , ()=> {
        res(new Blob(audioBlobs, { type: mimetype }))
      })
    });
    const queryBlobs = getBlobs()
    
    mediaRecorder.stop();

    

    const blobs = await queryBlobs
    

    const audioContext = new AudioContext();

    const audioFile = await blobs.arrayBuffer();
    const audiobuffer = await audioContext.decodeAudioData(audioFile);
    const channeldata = audiobuffer.getChannelData(0);
    console.log(channeldata)

    data = convertF32toI16(channeldata);
  } catch (e) {
    console.error(e);
  } finally {
    return data;
  }
};

export const convertF32toI16 = (channeldata: Float32Array) => {
  const output = new Int16Array(channeldata.length);

  channeldata.forEach((x, i) => {
    const s = Math.min(1, Math.max(-1, x));

    output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  });
  return output;
};
