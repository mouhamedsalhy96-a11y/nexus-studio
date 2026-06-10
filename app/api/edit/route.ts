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
    const { prompt, init_image, mask_image } = await request.json();

    if (!init_image || !mask_image) {
      return NextResponse.json(
        { error: "Both initial image and canvas mask are required for editing." },
        { status: 400 }
      );
    }

    const model = await replicate.models.get("stability-ai", "sdxl");
    const versionId = model.latest_version?.id;

    if (!versionId) {
      throw new Error("Could not resolve the latest version hash for SDXL.");
    }

    const output = await replicate.run(`${model.owner}/${model.name}:${versionId}`, {
      input: {
        prompt,
        image: init_image,
        mask: mask_image,
        width: 1024,
        height: 1024,
        prompt_strength: 0.8,
        num_inference_steps: 30,
        guidance_scale: 7.5,
        refine: "expert_ensemble_refiner",
        apply_watermark: false,
      },
    });

    // FIX: Convert Replicate FileOutput objects into raw URL strings
    const imageUrls = Array.isArray(output) ? output.map(String) : [String(output)];

    return NextResponse.json({ output: imageUrls });
  } catch (error) {
    console.error("Edit API Error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}