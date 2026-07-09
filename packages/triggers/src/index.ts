import { task, cronTriggers, wait } from "@trigger.dev/sdk";
import { z } from "zod";

const WHATSAPP_SERVICE_URL = process.env.WHATSAPP_SERVICE_URL || "http://localhost:3003";
const WHATSAPP_API_KEY = process.env.WHATSAPP_API_KEY || "dev-key";

async function callWhatsapp(path: string, body?: any) {
  const res = await fetch(`${WHATSAPP_SERVICE_URL}/api${path}`, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json", "x-api-key": WHATSAPP_API_KEY },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`WhatsApp API error: ${res.status}`);
  return res.json();
}

export const sendCampaign = task({
  id: "whatsapp-send-campaign",
  schema: z.object({
    instanceId: z.string(),
    contacts: z.array(z.object({ to: z.string(), variables: z.record(z.string()).optional() })),
    messageTemplate: z.string(),
    delayBetweenMs: z.number().default(2000),
  }),
  run: async ({ instanceId, contacts, messageTemplate, delayBetweenMs }) => {
    let sent = 0;
    let failed = 0;

    for (const contact of contacts) {
      let text = messageTemplate;
      if (contact.variables) {
        for (const [key, val] of Object.entries(contact.variables)) {
          text = text.replaceAll(`{{${key}}}`, val);
        }
      }

      try {
        await callWhatsapp("/message/text", { id: instanceId, to: contact.to, text });
        sent++;
      } catch {
        failed++;
      }

      if (delayBetweenMs > 0) {
        await wait.for({ milliseconds: delayBetweenMs });
      }
    }

    return { sent, failed, total: contacts.length };
  },
});

export const scheduleCampaign = cronTriggers("whatsapp-schedule-campaign", {
  schema: z.object({
    instanceId: z.string(),
    to: z.string(),
    text: z.string(),
    cron: z.string(),
  }),
  run: async ({ instanceId, to, text }) => {
    await callWhatsapp("/message/text", { id: instanceId, to, text });
    return { sent: true };
  },
});

export const broadcastToGroup = task({
  id: "whatsapp-broadcast-group",
  schema: z.object({
    instanceId: z.string(),
    groupJid: z.string(),
    message: z.string(),
    delayBetweenMs: z.number().default(1000),
  }),
  run: async ({ instanceId, groupJid, message, delayBetweenMs }) => {
    const { participants } = await callWhatsapp(`/group/${instanceId}/${encodeURIComponent(groupJid)}`);
    const numbers = participants
      .filter((p: any) => !p.admin)
      .map((p: any) => p.id);

    let sent = 0;

    for (const jid of numbers) {
      try {
        await callWhatsapp("/message/text", { id: instanceId, to: jid, text: message });
        sent++;
        if (delayBetweenMs > 0) await wait.for({ milliseconds: delayBetweenMs });
      } catch {}
    }

    return { sent, total: numbers.length };
  },
});

export const autoReply = task({
  id: "whatsapp-auto-reply",
  schema: z.object({
    instanceId: z.string(),
    triggerKeyword: z.string().optional(),
    replyText: z.string(),
  }),
  run: async ({ instanceId, triggerKeyword, replyText }) => {
    return { instanceId, triggerKeyword, replyText, active: true };
  },
});

export const sendScheduledBirthday = cronTriggers("whatsapp-birthday", {
  schema: z.object({
    instanceId: z.string(),
    contacts: z.array(z.object({ to: z.string(), name: z.string() })),
  }),
  cron: "0 9 * * *",
  run: async ({ instanceId, contacts }) => {
    const today = new Date();
    const todayStr = `${today.getMonth() + 1}-${today.getDate()}`;

    for (const contact of contacts) {
      await callWhatsapp("/message/text", {
        id: instanceId,
        to: contact.to,
        text: `🎂 Happy Birthday ${contact.name}! 🎉`,
      });
    }

    return { sent: contacts.length };
  },
});
