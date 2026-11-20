# Phone helpline setup

The line looks up the caller by phone number, asks for the 4-digit family PIN, then speaks confirmed medicines only. Key 9 logs an ASHA callback. It never dials the ASHA worker or 108. The spoken emergency line is: hang up and dial 108 yourself.

Keys: 1 medicines, 2 alerts, 3 labs, 4 pregnancy, 5 next visit, 9 ASHA callback, * repeat, 0 language.

## Local tunnel

Start the API from the repo root:

```bash
set -a && source .env && set +a
.venv/bin/python -m uvicorn main:app --app-dir apps/ml-api --host 127.0.0.1 --port 8000
```

In another terminal:

```bash
ngrok http 8000
```

Set `PUBLIC_BASE_URL` to the https ngrok host, with no trailing slash, and restart the API. Twilio and Exotel must be able to fetch the WAV files from `{PUBLIC_BASE_URL}/dialpad/audio/...`.

## Twilio (demo)

In the Twilio phone number settings, set the voice webhook to:

`POST https://<ngrok-host>/ivr/welcome`

The menu action is `{PUBLIC_BASE_URL}/ivr/menu`. No Twilio account is required for the in-app dial pad.

## Exotel (India)

Point the Passthru applet at:

`https://<ngrok-host>/ivr/exotel/passthru`

The opening prompt is `GET` or `POST /ivr/exotel/entry`. Status callbacks go to `/ivr/exotel/status`.

If `EXOTEL_WEBHOOK_TOKEN` is set, Exotel must send the same value in the `x-exotel-token` header or the `token` query parameter. Leave it empty for a local demo.

## App card

Set `NEXT_PUBLIC_HELPLINE_NUMBER` to the number patients dial. The home screen shows it and links to **Test live dial pad** (`/app/dialpad`), which works with no phone account. Demo PIN `1234`. Lakshmi `9000011101` / short code `1001`. Murugan `9000011102` / short code `1002`.

## Sample calls

Known caller, PIN prompt (Gather of 4 digits):

```bash
curl -s -X POST http://127.0.0.1:8000/ivr/welcome \
  -d "CallSid=demo-1" \
  -d "From=9000011101"
```

Wrong PIN, then medicines (key 1 uses only confirmed rows):

```bash
curl -s -X POST "http://127.0.0.1:8000/ivr/menu?CallSid=demo-1&Digits=0000"
curl -s -X POST "http://127.0.0.1:8000/ivr/menu?CallSid=demo-1&Digits=1234"
curl -s -X POST "http://127.0.0.1:8000/ivr/menu?CallSid=demo-1&Digits=1"
```

Unknown numbers hear that the phone is not on the clinic list. A missed key repeats the prompt once, then the line says goodbye and hangs up.
