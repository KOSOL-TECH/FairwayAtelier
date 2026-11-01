# Real-device test checklist

Run on one iPhone (Safari) and one Android phone (Chrome), on https://fairwayatelier.com. Use a private/incognito tab so the cookie banner appears. Note the phone, OS version and anything that looks wrong, with a screenshot.

Already checked in an emulated 375 px phone viewport (2026-11-01): no sideways scrolling on any page, menu open/close/Escape, cookie banner Refuse all, form validation and error focus, Journey tier tabs. These steps cover what only a real phone shows: touch, the on-screen keyboard, Safari's toolbars and real fonts.

## Cookie banner
- [ ] Banner appears on first visit; Accept all and Refuse all are the same size.
- [ ] Manage preferences opens the switches; the switch toggles with a tap; Save closes the banner.
- [ ] Footer "Cookie settings" reopens it.
- [ ] Banner does not hide behind Safari's bottom toolbar.

## Menu
- [ ] Tap the menu icon: links appear; tapping a link goes to that page.
- [ ] Rotate to landscape and back: header still correct.

## Enquiry form (/enquire)
- [ ] Tapping a field does **not** zoom the page in (iPhone).
- [ ] The email field shows an email keyboard; phone shows a number keypad.
- [ ] The Dates and Group dropdowns open the phone's native picker.
- [ ] Send with empty fields: errors show and the page scrolls to the first one, not hidden behind the keyboard.
- [ ] Send a real test enquiry (name "Device test"): the "Thank you" dialog appears and closes with its Close button. Tell the developer the time so it can be found in the logs.

## Journey (/journey)
- [ ] Tier tabs switch with a tap; the content below changes.

## General
- [ ] Pages scroll smoothly; images are sharp, not blurry.
- [ ] Nothing is cut off at the right edge on any page.
- [ ] Text is readable without zooming.
