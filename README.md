# Nextleg for AI assistants

Nextleg builds your itinerary from the booking emails you forward it, and tracks your flights. This repo connects it to your AI assistant, so you can ask about your trips in the chat you already use.

- Ask what is coming up, what time you land, or whether your flight is on time.
- Add a hotel, an event or a flight to a trip, change it, or remove it.
- Work through the questions Nextleg is waiting on you to answer, like a held email or a suggested event.
- Get flight alerts where your assistant supports them (Pro).

It only sees your own account and the trips people have chosen to share with you. It can't book anything and can't send email as you.

You need a Nextleg account first. Sign up free at [getnextleg.com](https://getnextleg.com/).

## Install in Codex

```
codex plugin marketplace add nextleg/plugins
codex plugin add nextleg@nextleg
codex mcp login nextleg
```

You can also add the marketplace and install from the plugin directory in the Codex app. A browser window opens for the usual Nextleg sign-in. There is no key to generate.

## Install in Claude Code

```
/plugin marketplace add nextleg/plugins
/plugin install nextleg@nextleg
```

Then run `/mcp` and sign in to Nextleg.

## Sign-in and permissions

Signing in uses OAuth in your browser. You choose what to allow: reading your trips, changing them, or both. Read-only stays read-only, and you can disconnect any time and it loses access immediately.

## Free and Pro

Free records everything: unlimited trips, flights, events, hotels and tickets, sharing, email forwarding, TripIt import, and asking your assistant about any of it. Pro adds live flight tracking: real-time status, gate, delay and cancellation alerts, where the aircraft is, and delay risk. Pro is bought in the Nextleg app. See [pricing](https://getnextleg.com/pricing).

## Links

- [Privacy](https://getnextleg.com/privacy)
- [Terms](https://getnextleg.com/terms)
- [Support](https://getnextleg.com/support)

## What is in this repo

- `plugins/nextleg/` is the plugin: Codex manifest, Claude Code manifest, the MCP connection (`https://mcp.getnextleg.com/mcp`), icons and one skill.
- `.agents/plugins/marketplace.json` and `.claude-plugin/marketplace.json` list it for Codex and Claude Code.
- `scripts/validate.mjs` checks the manifests; CI runs it and installs the plugin with the Codex CLI.

There are no keys or secrets here. Sign-in happens between you and Nextleg.

Licensed MIT. Nextleg is a trading name of Dismal Training Ltd.
