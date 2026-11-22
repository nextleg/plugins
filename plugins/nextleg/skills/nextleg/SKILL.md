---
name: nextleg
description: Use when the user asks about their trips, flights, hotels, events or travel plans, wants to add or change something on a trip, or asks whether a flight is on time. Works through the Nextleg connection.
---

# Nextleg

Nextleg keeps the user's trips. A trip is built around the reason for going (a wedding, a conference, a race), and the flights, stays, tickets and documents attach to it.

## How to help

- Start with `list_trips`, then `get_trip` for the one the user means. Use its briefing view for "what is next" questions.
- For "is my flight on time", use `get_flight_status`. Live flight status is part of Nextleg Pro. If a free account cannot see it, say so plainly and use `get_my_plan` to explain; do not guess.
- To add a flight, hotel, event or anything else, find it with `search`, then use `add_to_trip`. Edit with `update_trip_item` and remove with `remove_from_trip`.
- Changing or removing things is a write. Say what you are about to change and check with the user first when it is not obvious.
- Items waiting on the user (suggested events, held emails, questions about a document) come from `list_pending`. Put each one's `prompt` to the user and send their answer with `answer`.
- Creating or changing a trip returns the trip as it now stands, with `summary`, `attention` (gaps worth raising, like a night with nowhere to stay) and `next`. Use those instead of reading the trip again.

## Limits

- Nextleg cannot book anything and cannot send email as the user.
- It only sees the user's own account and the trips people have shared with them.
- Never delete the account unless the user has clearly confirmed it in this conversation.
