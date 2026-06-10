import { NextResponse } from "next/server";
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(request: Request) {
  if (!process.env.REPLICATE_API_TOKEN) {
    return NextResponse.json(
      { error: "Replicate API token is missing in environment variables." },
      { status: 500 }
    );
  }

  try {
    const { prompt, aspectRatio } = await request.json();

    const sizes = { "1:1": "1024x1024", "16:9": "1344x768", "9:16": "768x1344" };
    const dimension = sizes[aspectRatio as keyof typeof sizes] || "1024x1024";
    const width = parseInt(dimension.split("x")[0]);
    const height = parseInt(dimension.split("x")[1]);

    const model = await replicate.models.get("stability-ai", "sdxl");
    const versionId = model.latest_version?.id;

    if (!versionId) {
      throw new Error("Could not resolve the latest version hash for SDXL.");
    }

    const output = await replicate.run(`${model.owner}/${model.name}:${versionId}`, {
      input: {
        prompt,
        width,
        height,
        refine: "expert_ensemble_refiner",
        scheduler: "K_EULER_ANCESTRAL",
        num_outputs: 1,
        guidance_scale: 7.5,
        apply_watermark: false,
        negative_prompt: "blurry, low quality, distorted, ugly, extra limbs",
      },
    });

    // FIX: Convert Replicate FileOutput objects into raw URL strings
    // This prevents Next.js from serializing them into empty objects [{}]
    const imageUrls = Array.isArray(output) ? output.map(String) : [String(output)];

    return NextResponse.json({ output: imageUrls });
  } catch (error) {
    console.error("Generate API Error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}