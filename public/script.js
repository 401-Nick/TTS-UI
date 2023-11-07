// script.js
document.addEventListener('DOMContentLoaded', function () {

    const setApiKeyButton = document.getElementById('set-api-key-button');
    const textToSpeechButton = document.getElementById('text-to-speech-button');
    const audioTranscriptionButton = document.getElementById('audio-transcription-button');

    const fileInput = document.getElementById('fileInput');
    const fileInputLabel = document.getElementById('fileInputLabel');

    fileInput.addEventListener('change', function () {
        if (fileInput.files.length > 0) {
            const fileName = fileInput.files[0].name;
            fileInputLabel.textContent = fileName;
        }
    });

    setApiKeyButton.addEventListener('click', function (event) {
        event.preventDefault();

        const apiKey = document.getElementById('api-key-input').value;
        fetch('/api/setApiKey', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ apiKey: apiKey }),
        })
            .then(response => response.json())
            .then(data => {
                console.log(data);
            })
            .catch((error) => {
                console.error('Error:', error);
            });
    });

    textToSpeechButton.addEventListener('click', function (event) {
        event.preventDefault();

        const text = document.getElementById('text-input').value;
        const model = document.getElementById('model-select').value;
        const voice = document.getElementById('voice-select').value;

        fetch('/api/speech', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: text, model: model, voice: voice }),
        })
            .then(response => response.blob())
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = 'speech.mp3';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
            })
            .catch((error) => {
                console.error('Error:', error);
            });
    });

    audioTranscriptionButton.addEventListener('click', function (event) {
        event.preventDefault();
        const audioInput = document.getElementById('fileInput').files[0];
        const formData = new FormData();
        formData.append('audio', audioInput);

        fetch('/api/transcription', {
            method: 'POST',
            body: formData,
        })
            .then(response => response.json())
            .then(data => {
                console.log(data);
                const transcriptionElement = document.getElementById('transcriptionResult');
                transcriptionElement.textContent = data.transcriptionText;

                if (exportCheckbox.checked) {
                    const blob = new Blob([data.transcriptionText], { type: 'text/plain' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = url;
                    a.download = 'transcription.txt';
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                }
            })
            .catch((error) => {
                console.error('Error:', error);
            });
    });
});