# ⚡ NEXUS.STUDIO

A premium, futuristic AI image generation and inpainting studio built with Next.js and Stable Diffusion XL. 

Nexus Studio provides a seamless, glassmorphism-inspired interface to interact with cutting-edge generative AI. It features both a standard Text-to-Image prompt matrix and an interactive HTML5 Canvas editor for precision image inpainting and modification.

## ✨ Core Features
* **Text-to-Image Synthesis:** High-fidelity generation using `stability-ai/sdxl`.
* **Inpaint Editor:** Interactive HTML5 canvas allows users to upload, mask, and modify specific regions of an image.
* **Dynamic Versioning:** Built-in safeguards automatically fetch the latest Replicate model hashes to prevent API decay.
* **Premium UI:** Responsive, cyberpunk-inspired glassmorphism design using Tailwind CSS v4 and Framer Motion.

## 🛠️ Tech Stack
* **Framework:** [Next.js](https://nextjs.org/) (App Router)
* **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
* **Animations:** [Framer Motion](https://www.framer.com/motion/)
* **Icons:** [Lucide React](https://lucide.dev/)
* **AI Engine:** [Replicate](https://replicate.com/) (Node.js SDK)

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone [https://github.com/mouhamedsalhy96-a11y/nexus-studio]
(https://github.com/mouhamedsalhy96-a11y/nexus-studio)
cd nexus-studio
2. Install dependencies
```bash
npm install
3. Set up your environment
Create a .env.local file in the root directory and add your Replicate API token (ensure your Replicate account has billing enabled):

Code snippet
REPLICATE_API_TOKEN=r8_your_actual_token_here
4. Run the development server
```bash
npm run dev