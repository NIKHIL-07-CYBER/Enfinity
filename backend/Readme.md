# Run this immediately at Hour 0:
docker run -d -p 5000:5000 libretranslate/libretranslate

# Verify it is running (wait 3-5 min for model download):
curl -X POST http://localhost:5000/translate \
  -H "Content-Type: application/json" \
  -d '{"q":"hello","source":"en","target":"es"}'
# Expected response: {"translatedText":"hola"}

# If Docker is not available: use MyMemory as backup
# https://api.mymemory.translated.net/get?q=hello&langpair=en|es
# (1000 req/day free, no API key)
