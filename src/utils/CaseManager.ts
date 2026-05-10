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

    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
      try {
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
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          },
        );
      } catch (error: any) {
        if (
          error.code === "P2002" &&
          error.meta?.target?.includes("caseNumber")
        ) {
          // Desync detected. Sync counter with max case number and retry.
          const maxCase = await client.db.case.findFirst({
            where: { guildId: data.guildId },
            orderBy: { caseNumber: "desc" },
          });

          const actualMax = maxCase?.caseNumber ?? 0;
          await client.db.counter.upsert({
            where: { guildId_name: { guildId: data.guildId, name: "cases" } },
            update: { value: actualMax + 1 },
            create: {
              guildId: data.guildId,
              name: "cases",
              value: actualMax + 1,
            },
          });

          retries++;
          continue;
        }
        throw error;
      }
    }
    throw new Error(
      "Failed to create case after multiple retries due to counter desync.",
    );
  }
}
