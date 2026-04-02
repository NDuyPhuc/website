export default function FAQ() {
  const faqs = [
    { q: "Is it beginner-friendly?", a: "Yes, our trainers tailor programs for all levels." },
    { q: "Do you offer personal coaching?", a: "Yes, we have elite personal training packages." },
    { q: "Can I try before joining?", a: "Yes, we offer a 7-day free trial." },
  ];

  return (
    <section className="py-20 bg-gray-950">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-4xl font-display font-bold text-white text-center mb-16">FREQUENTLY ASKED QUESTIONS</h2>
        {faqs.map((faq, index) => (
          <div key={index} className="mb-8 p-6 bg-gray-900 border border-gray-800">
            <h3 className="text-xl font-bold text-white mb-2">{faq.q}</h3>
            <p className="text-gray-400">{faq.a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
