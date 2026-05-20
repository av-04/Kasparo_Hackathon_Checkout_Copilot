import "@shopify/ui-extensions/preact";
import { render } from "preact";
import { useState, useEffect, useRef } from "preact/hooks";

// 🚨 Your working tunnel link
const APP_URL = "https://seems-gospel-fruits-comparison.trycloudflare.com";

export default async () => {
  render(<Extension />, document.body);
};

function Extension() {
  const [aiMessage, setAiMessage] = useState(
    "Analyzing your cart for the best shipping value...",
  );

  const lastRequestRef = useRef(null);

  useEffect(() => {
    async function fetchCopilotAdvice(groups) {
      const city =
        shopify.shippingAddress?.value?.city ||
        shopify.shippingAddress?.current?.city ||
        "your location";

      // 🚨 THE WIDE NET (Math): Checking .current, .value, and root paths
      const totalAmount =
        shopify.cost?.totalAmount?.current?.amount ||
        shopify.cost?.totalAmount?.value?.amount ||
        shopify.cart?.cost?.totalAmount?.value ||
        0;

      const subtotalAmount =
        shopify.cost?.subtotalAmount?.current?.amount ||
        shopify.cost?.subtotalAmount?.value?.amount ||
        shopify.cart?.cost?.subtotalAmount?.value ||
        totalAmount;

      // 🚨 THE WIDE NET (Items): Checking every possible path for the array
      const lines =
        shopify.lines?.current ||
        shopify.lines?.value ||
        shopify.cart?.lines?.value ||
        shopify.cart?.lines ||
        [];

      // Checking every possible property name for the title
      const itemNames = lines
        .map(
          (line) =>
            line.title ||
            line.merchandise?.title ||
            line.merchandise?.product?.title ||
            line.name,
        )
        .filter(Boolean)
        .join(", ");

      // LOUD DEBUGGING: If the wide net STILL misses, tell us!
      if (!itemNames || lines.length === 0) {
        setAiMessage("Waiting for Shopify to load your cart items...");
        return;
      }

      const shippingOptions = groups.flatMap(
        (group) =>
          group.deliveryOptions?.map((option) => ({
            title: option.title,
            cost: option.cost?.amount || 0,
            currency: option.cost?.currencyCode || "USD",
          })) || [],
      );

      if (shippingOptions.length === 0) {
        setAiMessage(
          "Please enter a shipping address to see AI recommendations.",
        );
        return;
      }

      const currentSnapshot = JSON.stringify({
        city,
        totalAmount,
        subtotalAmount,
        itemNames,
        shippingOptions,
      });

      if (lastRequestRef.current === currentSnapshot) return;
      lastRequestRef.current = currentSnapshot;

      setAiMessage("Calculating tradeoffs and recommendations...");

      try {
        const response = await fetch(`${APP_URL}/api/copilot`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: currentSnapshot,
        });

        const data = await response.json();
        setAiMessage(data.message);
      } catch (error) {
        console.error("Failed to fetch AI message:", error);
        setAiMessage("Select a shipping method to see smart value trade-offs.");
      }
    }
    fetchCopilotAdvice(shopify.deliveryGroups?.value || []);

    const unsubscribeShipping = shopify.deliveryGroups.subscribe(
      (newGroups) => {
        fetchCopilotAdvice(newGroups);
      },
    );

    // 🚨 SAFELY subscribing to cart changes ONLY if the function exists
    let unsubscribeLines = () => {};
    if (shopify.cart?.lines?.subscribe) {
      unsubscribeLines = shopify.cart.lines.subscribe(() => {
        fetchCopilotAdvice(shopify.deliveryGroups?.value || []);
      });
    }

    return () => {
      unsubscribeShipping();
      unsubscribeLines();
    };
  }, []);

  return (
    <s-banner heading="AI Checkout Concierge" tone="info">
      <s-text>{aiMessage}</s-text>
    </s-banner>
  );
}
