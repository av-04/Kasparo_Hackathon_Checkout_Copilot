= Contribution & Time Allocation (Solo Participant)
As a solo developer, I acted as both the Product Strategist and Lead Engineer. My time was allocated into two distinct phases to ensure the final product was both technically impressive and commercially viable:

*Product Thinking & Strategy (30%):*
- Researched cart abandonment psychology and mapped the Shopify checkout journey.
- Defined the "Elite Concierge" persona and structured the Gemini prompt constraints.
- Made the critical scope decision to eliminate the "chat" interface to prioritize zero-click conversions and reduce checkout friction.

*Engineering & Implementation (70%):*
- Built the decoupled architecture (Preact Web Worker frontend, Remix backend proxy).
- Engineered the "Wide Net" reactive data parser to safely traverse Shopify's shifting API schemas without crashing the UI sandbox.
- Designed and implemented the custom Preact `useRef` memory cache to permanently bypass HTTP 429 rate limits and optimize LLM latency.

# 🧭 Architectural Decision Log
**Project:** AI Checkout Copilot  
**Developer:** Aryaman Verma  

This document tracks the critical product and engineering decisions made during the hackathon, focusing on tradeoffs, constraints, and resolutions.

| Date | Context / Problem | Decision Made | Rationale & Tradeoffs |
| :--- | :--- | :--- | :--- |
| **Day 1** | **Integration Point:** Where should the AI intervene in the buying journey? | **Native Checkout UI Extension** (instead of a storefront App Block). | **Rationale:** Cart abandonment is highest at the shipping/payment step. Natively rendering in the Web Worker sandbox ensures high trust.<br>**Tradeoff:** Sacrificed standard DOM manipulation and `window` access for seamless native Shopify UI integration. |
| **Day 2** | **UX Design:** How should the user interact with the AI at checkout? | **Zero-Click Insights** (instead of a Chatbot). | **Rationale:** Checkout requires zero friction. Forcing users to type questions causes abandonment.<br>**Tradeoff:** Sacrificed the "flashiness" of a conversational AI for a highly optimized, auto-generating conversion tool. |
| **Day 3** | **Performance:** Shopify's checkout state updates aggressively, causing Gemini 429 Rate Limit errors and high latency. | **Preact `useRef` Memory Cache** (instead of live API polling). | **Rationale:** Stringifying the cart state and comparing it against a local snapshot before fetching prevents API spam.<br>**Tradeoff:** Slightly increased memory overhead on the client side, but permanently solved rate-limiting and reduced server costs. |
| **Day 4** | **Data Stability:** Shopify API schemas shift nested object paths (`.current` vs `.value`), causing fatal sandbox crashes. | **"Wide Net" Reactive Data Parser** (instead of strict path targeting). | **Rationale:** Deeply checking multiple potential object paths simultaneously (`shopify.lines?.current || shopify.lines?.value`) ensures data resiliency.<br>**Tradeoff:** Marginally heavier map functions, but guarantees 100% uptime across varying Shopify API environments. |
| **Day 5** | **Upselling:** How to suggest bundles without a complex backend database of SKUs? | **Zero-Shot LLM Reasoning** (instead of a relational database). | **Rationale:** By passing the explicit cart items to Gemini, the LLM hallucinates logically sound accessories (e.g., snowboard bindings) natively.<br>**Tradeoff:** Relies heavily on prompt constraints to prevent bizarre cross-sells, but drastically simplifies deployment architecture. |
