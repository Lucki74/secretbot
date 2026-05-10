import { Prisma } from "@prisma/client";
import { SecretbotClient } from "../SecretbotClient.js";

export class CaseManager {
  public static async createCase(
    client: SecretbotClient,
    data: {
      guildId: string;
      userId: string;
      modId: string;
      type: string;
      reason?: string;
      notes?: string;
    },
  ) {
    await client.db.user.upsert({
      where: { id: data.userId },
      update: {},
      create: { id: data.userId },
    });
    await client.db.guild.upsert({
      where: { id: data.guildId },
      update: {},
      create: { id: data.guildId },
    });

    return await client.db.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const counter = await tx.counter.upsert({
          where: {
            guildId_name: {
              guildId: data.guildId,
              name: "cases",
            },
          },
          update: {
            value: { increment: 1 },
          },
          create: {
            guildId: data.guildId,
            name: "cases",
            value: 1,
          },
        });

        const nextCaseNumber = counter.value;

        const newCase = await tx.case.create({
          data: {
            guildId: data.guildId,
            userId: data.userId,
            modId: data.modId,
            type: data.type,
            reason: data.reason ?? null,
            caseNumber: nextCaseNumber,
          },
        });

        if (data.notes) {
          await tx.caseNote.create({
            data: {
              caseId: newCase.id,
              authorId: data.modId,
              content: data.notes,
            },
          });
        }

        return newCase;
      },
    );
  }
}
