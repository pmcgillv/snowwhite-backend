# Desktop ↔ Cloud continuity

Cloud Agents do not inherit local Cursor Desktop Composer/Agent chat history. Naming a cloud run after prior work (for example "Financial advisor build") does not import that desktop planning thread.

## What lives where

| Surface | What it holds |
| --- | --- |
| Cursor Desktop Agents sidebar / chat history | Local planning and agent chats for the open workspace |
| [cursor.com/agents](https://cursor.com/agents) | Cloud Agent runs only |
| GitHub repo attached to the cloud environment | Code and commits — not desktop chat transcripts |

## If prior planning seems "gone"

1. Open the **same project folder** used during planning.
2. Command Palette → **Show Chat History** or **Show Chat History (Editor)**; or **Open Agents Window** and search with Cmd/Ctrl+K.
3. Paste the plan into the cloud agent, or continue in the original desktop chat.
4. Confirm the cloud environment's repo matches the product before implementing.

## Agent behavior

See `.cursor/rules/session-continuity.mdc` for always-on recovery and wrong-repo rules mined from parent conversation `bc-62c37c23-ee9e-404c-865d-373baad5dcea`.
