import { task, schedules, wait } from "@trigger.dev/sdk";
import { z } from "zod";

const API_URL = process.env.WHATSAPP_API_URL || "http://localhost:8787/api/whatsapp";

async function callWhatsapp(path: string, body?: any) {
  const res = await fetch(`${API_URL}${path}`, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`WhatsApp API error ${res.status}: ${await res.text()}`);
  return res.json();
}

export const sendCampaign = task({
  id: "whatsapp-send-campaign",
  schema: z.object({
    instanceId: z.string(),
    contacts: z.array(z.object({
      to: z.string(),
      variables: z.record(z.string()).optional(),
    })),
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

      if (delayBetweenMs > 0 && contacts.indexOf(contact) < contacts.length - 1) {
        await wait.for({ milliseconds: delayBetweenMs });
      }
    }

    return { sent, failed, total: contacts.length };
  },
});

export const scheduleCampaign = task({
  id: "whatsapp-schedule-campaign",
  schema: z.object({
    instanceId: z.string(),
    to: z.string(),
    text: z.string(),
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
    const group = await callWhatsapp(`/group/${instanceId}/${encodeURIComponent(groupJid)}`);
    const numbers = (group.participants || [])
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

export const healthCheck = task({
  id: "whatsapp-health-check",
  schema: z.object({}),
  run: async () => {
    const { instances } = await callWhatsapp("/instances");
    const unhealthy = instances.filter((i: any) => i.status === "disconnected");
    return { total: instances.length, unhealthy: unhealthy.length, instances: unhealthy.map((i: any) => i.id) };
  },
});

export const healthCheckSchedule = schedules.task({
  task: healthCheck,
  id: "whatsapp-health-check-schedule",
  cron: "*/5 * * * *",
});

export const birthdayBroadcast = task({
  id: "whatsapp-birthday",
  schema: z.object({
    instanceId: z.string(),
    contacts: z.array(z.object({ to: z.string(), name: z.string() })),
  }),
  run: async ({ instanceId, contacts }) => {
    for (const contact of contacts) {
      await callWhatsapp("/message/text", {
        id: instanceId, to: contact.to,
        text: `🎂 Happy Birthday ${contact.name}! 🎉`,
      });
    }
    return { sent: contacts.length };
  },
});

export const birthdaySchedule = schedules.task({
  task: birthdayBroadcast,
  id: "whatsapp-birthday-schedule",
  cron: "0 9 * * *",
});
