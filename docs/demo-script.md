# AshaLens demo (record the automatic tour)

Open http://127.0.0.1:3000/demo and press **Play tour**. It logs in as Meena and walks the real screens. Record that window. Keep both `npm run dev` and the FastAPI server running. Speak the lines below, or let the caption bar carry them.

## How to record (Mac)

1. Open Chrome at **http://127.0.0.1:3000/demo**
2. Narrow the window to a phone width (about 390 px)
3. QuickTime Player → File → New Screen Recording → select the window
4. Press **Play tour**, then stop when the caption bar disappears (about 80 seconds). Export 1080p.

## What the tour shows

Each step stays about 8 seconds. Capture and the dial pad wait until the API answers, then hold.

1. Landing. “AshaLens is a paper-to-safety companion. It is not a doctor and not a diagnosis.”
2. Home, already signed in as ASHA Meena. “The roster is synthetic.”
3. Lakshmi. Iron and calcium, blood pressure 148/94, overdue visit. “The app flags. It does not diagnose.”
4. Show for consult. Ferrous sulphate, calcium carbonate, folic acid, BP 148/94. “It is not an eSanjeevani record.”
5. Capture runs Sample 2. Ferrous and Shelcal, then the iron–calcium checklist. “A person still checks the boxes.”
6. Dial pad uses short code 1001 and PIN 1234, then key 1. Tamil text lists today’s confirmed medicines.
7. This week. Lakshmi is first. “A visit order, not a diagnosis.”
8. Models. “A person confirms every field.”
9. Close. “It is not a medical device.”

## If something fails on camera

- Sample buttons still work if Gemini times out.
- If Tamil audio is slow, leave the text on screen for two seconds and keep talking.
- Wrong PIN: tap `*` and enter `1234` again.
- Logged out: go to `/login` and tap ASHA Meena.

## Do not say

Do not say it diagnoses pre-eclampsia, reads real patient records, or replaces government ASHA apps.
