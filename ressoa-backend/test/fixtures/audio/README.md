# Audio Test Fixtures

This directory contains audio files used for E2E testing of the Speech-to-Text (STT) providers.

## Test Audio Files

### `test-audio-30s.mp3`

- **Duration:** ~30 seconds
- **Size:** ~500 KB
- **Format:** MP3, 16kHz sample rate
- **Language:** Portuguese (pt-BR)
- **Content:** Educational Portuguese speech sample
- **License:** Public Domain / Creative Commons Zero (CC0)
- **Source:** Generated using text-to-speech for testing purposes

**Expected Transcription (`test-audio-30s.txt`):**
Contains the ground truth transcription for quality validation.

## Usage in Tests

These fixtures are used in:
- `test/stt/whisper-provider.e2e-spec.ts` - OpenAI Whisper integration tests
- `test/stt/google-speech-provider.e2e-spec.ts` - Google Speech integration tests
- `test/stt/stt-integration.e2e-spec.ts` - Provider comparison tests

## Generating Test Audio

For development/testing, you can generate test audio using:

1. **Online TTS Services (Free):**
   - Google Cloud TTS (pt-BR voices): https://cloud.google.com/text-to-speech
   - Microsoft Azure TTS (pt-BR voices): https://azure.microsoft.com/en-us/services/cognitive-services/text-to-speech/

2. **Local TTS (macOS/Linux):**
   ```bash
   # Example using macOS 'say' command with Portuguese voice
   say -v "Luciana" -o test-audio-30s.aiff "Olá, este é um teste de transcrição de áudio..."
   ffmpeg -i test-audio-30s.aiff -ar 16000 -ab 128k test-audio-30s.mp3
   ```

3. **Sample Educational Content:**
   Use public domain educational content in Portuguese about mathematics, science, or Portuguese language topics to match the application's domain.

## Important Notes

- ⚠️ **API Keys Required:** E2E tests with real STT providers require valid API keys in `.env.test`
- 🔐 **Do NOT commit** sensitive credentials or API keys
- 📊 **Cost Awareness:** Each test run incurs STT API costs (~$0.003 for Whisper, ~$0.012 for Google per test)
- 🎯 **Quality Target:** Expected confidence score >0.70 for both providers

## Creating New Test Fixtures

When adding new test audio files:

1. Use clear, natural speech (avoid background noise)
2. Keep duration under 1 minute to minimize test costs
3. Include corresponding `.txt` file with ground truth transcription
4. Document source, license, and any attribution in this README
5. Commit audio files to git (they're small enough and necessary for CI/CD)
