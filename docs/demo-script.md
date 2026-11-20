# AshaLens demo (record this, about 100 seconds)

Record the phone or Chrome window at http://127.0.0.1:3000. Keep both `npm run dev` and the FastAPI server running. Speak slowly. Do not skip the last line.

## How to record (Mac)

1. Open Chrome at **http://127.0.0.1:3000**
2. Narrow the window to a phone width (about 390 px)
3. QuickTime Player → File → New Screen Recording → select the window
4. Stop around 100 seconds. Export 1080p.

## Voice-over (read this)

**0:00–0:08 — Landing**  
“AshaLens is a paper-to-safety companion for rural PHCs. It is not a doctor and not a diagnosis.”

**0:08–0:18 — Login**  
Tap **Open live demo**. Tap **ASHA Meena**. Tap **Enter the clinic**.  
“We log in as ASHA Meena at Malligai PHC. The roster is synthetic.”

**0:18–0:32 — Lakshmi**  
Tap **Lakshmi** on the home list. Point at the three red cards.  
“Lakshmi is 28 weeks pregnant. Iron and calcium must be two hours apart. Blood pressure 148 over 94 is on the NHM danger-sign checklist. Follow-up is overdue. The app flags. It does not diagnose.”

**0:32–0:48 — Show for consult**  
Tap **Show for consult**. Point at ferrous sulphate, calcium carbonate, folic acid, then BP 148/94.  
“This is the page Meena holds up before a video consult. Confirmed medicines and the latest blood pressure. It is not an eSanjeevani record.”

**0:48–1:05 — Capture**  
Tap **Photograph a paper slip**. Tap **Sample 2**. Wait one second for **Extracted lines**.  
“Sample 2 is a cached slip so the demo never depends on the cloud. Ferrous and Shelcal map to iron and calcium at 98 percent. A person still has to check the boxes before save.”

Optional extra (only if you have 10 seconds): tap **Sample 1**.  
“Dolo becomes paracetamol. Glycomet becomes metformin.”

**1:05–1:22 — Dial pad**  
Tap **Dial pad**. Short code is already `1001`. Tap **1 2 3 4**, then **Open with PIN** (scroll up if the bottom bar covers it). Tap **1**.  
Wait until Tamil text appears: today’s medicines, ferrous, calcium, folic acid, then the confirm-with-ASHA line.  
“The household hears confirmed medicines in Tamil. Key 2 is alerts. Key 4 is pregnancy. Nothing is spoken until a person confirmed it.”

**1:22–1:32 — This week**  
Tap **This week**. Point at Lakshmi at rank 1: interaction, danger sign, overdue.  
“The week list is a visit order, not a diagnosis.”

**1:32–1:40 — Close**  
“AshaLens flags paper and checklists. A person confirms every field. It is not a medical device.”

## If something fails on camera

- Sample buttons still work if Gemini times out.
- If Tamil audio is slow, leave the text on screen for two seconds and keep talking.
- Wrong PIN: tap `*` and enter `1234` again.
- Logged out: go to `/login` and tap ASHA Meena.

## Do not say

Do not say it diagnoses pre-eclampsia, reads real patient records, or replaces government ASHA apps.
