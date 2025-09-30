// src/Pages/Tracing/utils/chatml.schema.js
import { z } from "zod";

// --- Primitive parts ---
const OpenAITextContentPart = z.object({
    type: z.union([z.literal("text"), z.literal("input_text"), z.literal("output_text")]),
    text: z.string(),
});

const OpenAIUrlImageUrl = z.string().regex(/^https?:/);
const OpenAIBase64ImageUrl = z.string().regex(/^data:image\/(png|jpeg|jpg|gif|webp);base64,/);

// @@@langfuseMedia:...@@@ → 메타 파싱
const ParsedMediaReferenceSchema = z.object({
    type: z.string(),
    id: z.string(),
    source: z.string(),
    referenceString: z.string(),
});
const MediaReferenceStringSchema = z.string()
    .transform((str, ctx) => {
        const m = str.match(/^@@@langfuseMedia:(.*)@@@$/);
        if (!m) { ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid langfuseMedia magic string format" }); return z.NEVER; }
        const parts = m[1].split("|").filter(Boolean);
        const meta = { referenceString: str };
        for (const p of parts) {
            const [k, v] = p.split("=");
            if (k && v !== undefined) meta[k.trim()] = v.trim();
            else { ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Invalid key-value pair: ${p}` }); return z.NEVER; }
        }
        return meta;
    })
    .pipe(ParsedMediaReferenceSchema);

const OpenAIImageContentPart = z.object({
    type: z.literal("image_url"),
    image_url: z.object({
        url: z.union([OpenAIUrlImageUrl, MediaReferenceStringSchema, OpenAIBase64ImageUrl]),
        detail: z.enum(["low", "high", "auto"]).optional(),
    }),
});

const OpenAIInputAudioContentPart = z.object({
    type: z.literal("input_audio"),
    input_audio: z.object({ data: MediaReferenceStringSchema }),
});

const OpenAIOutputAudioSchema = z.object({
    data: MediaReferenceStringSchema,
    transcript: z.string().optional(),
});

// --- Union content + message ---
const OpenAIContentParts = z.array(z.union([OpenAITextContentPart, OpenAIImageContentPart, OpenAIInputAudioContentPart]));
const OpenAIContentSchema = z.union([z.string(), OpenAIContentParts]).nullable();

export const ChatMlMessageSchema = z.object({
    role: z.string().optional(),
    name: z.string().optional(),
    content: z.union([z.record(z.string(), z.any()), z.string(), z.array(z.any()), OpenAIContentSchema]).nullish(),
    audio: OpenAIOutputAudioSchema.optional(),
    additional_kwargs: z.record(z.string(), z.any()).optional(),
})
    .passthrough()
    .refine(v => v.content !== null || v.role !== undefined)
    .transform(({ additional_kwargs, ...other }) => ({ ...other, ...additional_kwargs }))
    .transform(({ role, name, content, audio, type, ...other }) => ({
        role, name, content, audio, type,
        ...(Object.keys(other).length === 0 ? {} : { json: other })
    }));

export const ChatMlArraySchema = z.array(ChatMlMessageSchema).min(1);
