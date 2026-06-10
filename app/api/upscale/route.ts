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
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: "An image URL is required for upscaling." },
        { status: 400 }
      );
    }

    // Run the Real-ESRGAN model for 2x or 4x upscaling
    // We use a specific, stable version hash for this model
    const output = await replicate.run(
      "nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b",
      {
        input: {
          image: image,
          scale: 4, // Upscales by 4x
          face_enhance: true, // Uses GFPGAN to improve faces if present
        },
      }
    );

    // Convert output to a string in case Replicate returns a FileOutput object
    const imageUrl = Array.isArray(output) ? String(output[0]) : String(output);

    return NextResponse.json({ output: imageUrl });
  } catch (error) {
    console.error("Upscale API Error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}