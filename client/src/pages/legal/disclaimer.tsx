// Block 104 Implementation
import React from 'react';

const disclaimer = `StackMotive is an AI-powered investment research and strategy platform. The content provided — including signals, strategies, and AI-generated insights — is for informational and educational purposes only.\n\nStackMotive does not offer financial advice, does not recommend specific investments, and does not provide personalized guidance. All features, including GPT-generated content, signal overlays, and strategy tools, are designed to support your independent investment decision-making — not to replace it.\n\nAll data and insights are provided "as-is" without warranties of accuracy, completeness, or fitness for any purpose. Markets are volatile, and all investing carries risk — including the risk of loss.\n\nBy using StackMotive, you accept full responsibility for any decisions you make based on the platform and agree that StackMotive, its creators, and partners are not liable for any losses or outcomes resulting from its use.`;

export default function LegalDisclaimerPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-white px-4 py-8">
      <section className="max-w-xl w-full bg-gray-50 rounded-lg shadow-md p-6 md:p-10 text-gray-800">
        <h1 className="text-2xl md:text-3xl font-bold mb-4 text-center">Legal Disclaimer</h1>
        <p className="whitespace-pre-line text-base md:text-lg leading-relaxed">{disclaimer}</p>
      </section>
    </main>
  );
}
// End Block 104 Implementation 