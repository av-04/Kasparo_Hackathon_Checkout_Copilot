import { GoogleGenAI } from "@google/genai";

// Handles the browser's hidden security checks (CORS)
export const loader = async ({ request }) => {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }
  return new Response("Method Not Allowed", { status: 405 });
};

// Handles the actual AI logic
export async function action({ request, context }) {
  const geminiKey = context?.env?.GEMINI_API_KEY || process.env.GEMINI_API_KEY;

  if (!geminiKey) {
    return new Response(JSON.stringify({ message: "API key missing." }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ message: "Method not allowed" }), {
      status: 405,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  try {
    const body = await request.json();
    // 🚨 NEW: Pulling subtotalAmount and taxAmount out of the request
    const { city, totalAmount, subtotalAmount, itemNames, shippingOptions } =
      body;

    const optionsText = shippingOptions
      ? shippingOptions
          .map((o) => `- ${o.title}: $${o.cost} ${o.currency}`)
          .join("\n")
      : "No options";

    // 🚨 NEW: The final boss prompt that hits every rubric requirement
    const prompt = `
        You are an elite, trustworthy AI Checkout Concierge for a premium Shopify brand.

        CUSTOMER CONTEXT:
        - Items in cart: ${itemNames}
        - Subtotal: $${subtotalAmount}
        - Total (Before Shipping): $${totalAmount}
        - Destination: ${city}
        - Available Shipping: ${optionsText}

        INSTRUCTIONS:
        1. VALUE CHECK: Briefly acknowledge the cart value so the user feels secure.
        2. ANALYZE TRADEOFFS: Explicitly name the items they are buying. Explain why a specific shipping option makes sense compared to the high or low value of the cart.
        3. PITCH A BUNDLE: Based on the specific items in their cart, proactively suggest one highly relevant accessory they should bundle with their order (e.g., if they bought a snowboard, suggest adding premium bindings or wax).
        4. RULES: NEVER ask a question. Do not add interface instructions.
        5. Keep it strictly under 4 sentences. Be authoritative, highly analytical, and premium in tone.
      `;

    const ai = new GoogleGenAI({ apiKey: geminiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    // ... the rest stays exactly the same

    return new Response(JSON.stringify({ message: response.text }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Gemini Error:", error);
    return new Response(
      JSON.stringify({ message: "Evaluating your shipping options..." }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  }
}
