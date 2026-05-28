// Port of prototype/cc-integration.js:21-85: the static spec rendered on the
// /integration page (slash command reference + drop-in hook config).

export interface SlashCommand {
  cmd: string;
  summary: string;
  args: string;
  example: string;
  writesTo: string;
}

export const SLASH_COMMANDS: SlashCommand[] = [
  {
    cmd: "/note",
    summary: "Append an observation to .cappshub/notes/",
    args: "[--title <title>] <body>",
    example: '/note --title "Render cold start" measured 2.8s after 15min idle',
    writesTo: ".cappshub/notes/YYYY-MM-DD-<slug>.md",
  },
  {
    cmd: "/instruct",
    summary: "Append a durable directive to .cappshub/instructions.md",
    args: "<directive>",
    example: "/instruct contractor view must remain read-only",
    writesTo: ".cappshub/instructions.md",
  },
  {
    cmd: "/plan",
    summary: "Edit the Claude Code plan for this app",
    args: "add|done|drop <text-or-index>",
    example: "/plan add wire Render service health into the status dot",
    writesTo: ".cappshub/plan.json",
  },
  {
    cmd: "/sync",
    summary: "Force-push local .cappshub/ state to the Command Center",
    args: "(none)",
    example: "/sync",
    writesTo: ".cappshub/* (no-op if clean)",
  },
];

// Drop-in for ~/.claude/settings.json. Users copy this verbatim and set
// CAPPSHUB_URL + CAPPSHUB_TOKEN env vars locally.
export const HOOK_CONFIG = {
  hooks: {
    PostToolUse: [
      {
        matcher: "Edit|Write|MultiEdit",
        hooks: [
          {
            type: "command",
            command:
              'curl -sS -X POST "$CAPPSHUB_URL/api/cappshub-events" ' +
              '-H "Authorization: Bearer $CAPPSHUB_TOKEN" ' +
              "-H 'Content-Type: application/json' " +
              "-d \"$(jq -c '{repo: env.PWD | sub(\".*/\"; \"\"), tool: .tool_name, path: .tool_input.file_path, ts: now}')\"",
          },
        ],
      },
    ],
    Notification: [
      {
        matcher: "*",
        hooks: [
          {
            type: "command",
            command:
              'curl -sS -X POST "$CAPPSHUB_URL/api/cappshub-events" ' +
              '-H "Authorization: Bearer $CAPPSHUB_TOKEN" ' +
              "-d \"$(jq -c '{kind: \\\"learning\\\", repo: env.PWD | sub(\\\".*/\\\"; \\\"\\\"), text: .message, ts: now}')\"",
          },
        ],
      },
    ],
  },
} as const;
