"""Twilio-style helpline webhooks. Speech is stubbed so tests stay offline."""

from __future__ import annotations

from fastapi.testclient import TestClient

from main import app
from services.dialpad_core import CALLS, LOGS, Medicine, find_patient
from routers import ivr_twilio

client = TestClient(app)


def _stub_audio(monkeypatch):
    spoken: list[str] = []

    def fake(text: str, lang: str) -> str:
        spoken.append(text)
        return "http://127.0.0.1:8000/dialpad/audio/demo.wav"

    monkeypatch.setattr(ivr_twilio, "wav_url", fake)
    CALLS.clear()
    LOGS.clear()
    return spoken


def test_welcome_known_caller_asks_for_pin(monkeypatch):
    spoken = _stub_audio(monkeypatch)
    response = client.post("/ivr/welcome", data={"CallSid": "CA-pin", "From": "9000011101"})
    body = response.text
    assert response.status_code == 200
    assert "numDigits='4'" in body
    assert "/ivr/menu" in body
    assert "If this is an emergency, hang up and dial 108." in spoken[0]
    assert "<Dial" not in body


def test_unknown_number_is_refused(monkeypatch):
    spoken = _stub_audio(monkeypatch)
    response = client.post("/ivr/welcome", data={"CallSid": "CA-unknown", "From": "9999999999"})
    assert response.status_code == 200
    assert "not on the clinic list" in spoken[0]
    assert "<Hangup" in response.text
    assert "<Dial" not in response.text


def test_wrong_pin_reprompts(monkeypatch):
    spoken = _stub_audio(monkeypatch)
    client.post("/ivr/welcome", data={"CallSid": "CA-bad", "From": "9000011101"})
    response = client.post("/ivr/menu", data={"CallSid": "CA-bad", "Digits": "0000"})
    assert "numDigits='4'" in response.text
    assert CALLS["CA-bad"]["authed"] is False
    assert "PIN" in spoken[-1]
    assert "Ferrous" not in spoken[-1]


def test_key_one_speaks_only_confirmed_medicines(monkeypatch):
    spoken = _stub_audio(monkeypatch)
    patient = find_patient(phone="9000011101")
    assert patient is not None
    patient.medicines.append(Medicine("SecretDrug", "1 mg", "once", confirmed=False))
    try:
        client.post("/ivr/welcome", data={"CallSid": "CA-meds", "From": "9000011101"})
        client.post("/ivr/menu", data={"CallSid": "CA-meds", "Digits": "1234"})
        response = client.post("/ivr/menu", params={"CallSid": "CA-meds", "Digits": "1"})
    finally:
        patient.medicines.pop()
    assert response.status_code == 200
    assert "Ferrous sulphate" in spoken[-1]
    assert "Calcium carbonate" in spoken[-1]
    assert "Folic acid" in spoken[-1]
    assert "SecretDrug" not in spoken[-1]
    assert "<Dial" not in response.text


def test_key_nine_logs_callback_and_does_not_dial(monkeypatch):
    _stub_audio(monkeypatch)
    client.post("/ivr/welcome", data={"CallSid": "CA-asha", "From": "9000011101"})
    client.post("/ivr/menu", data={"CallSid": "CA-asha", "Digits": "1234"})
    response = client.post("/ivr/menu", data={"CallSid": "CA-asha", "Digits": "9"})
    assert "<Dial" not in response.text
    assert any(row.get("kind") == "asha_callback" and row.get("patient_id") == "p-lakshmi" for row in LOGS)


def test_second_timeout_hangs_up(monkeypatch):
    _stub_audio(monkeypatch)
    client.post("/ivr/welcome", data={"CallSid": "CA-time", "From": "9000011101"})
    client.post("/ivr/menu", data={"CallSid": "CA-time", "Digits": "1234"})
    first = client.post("/ivr/menu", data={"CallSid": "CA-time", "Digits": ""})
    second = client.post("/ivr/menu", data={"CallSid": "CA-time", "Digits": ""})
    assert "<Gather" in first.text
    assert "<Hangup" in second.text
    assert "<Dial" not in second.text
