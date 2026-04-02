export default function Membership() {
  const plans = [
    { name: "Essential", price: "$49", features: ["Gym Access", "Basic Classes"] },
    { name: "Performance", price: "$89", features: ["Gym Access", "All Classes", "1 PT Session"], popular: true },
    { name: "Elite", price: "$149", features: ["Gym Access", "All Classes", "4 PT Sessions", "Recovery"] },
  ];

  return (
    <section className="py-20 bg-gray-950">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-4xl font-display font-bold text-white text-center mb-16">MEMBERSHIP PLANS</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div key={index} className={`p-8 bg-gray-900 border ${plan.popular ? 'border-red-600' : 'border-gray-800'}`}>
              <h3 className="text-2xl font-bold text-white mb-4">{plan.name}</h3>
              <p className="text-4xl font-bold text-red-600 mb-6">{plan.price}<span className="text-lg text-gray-400">/mo</span></p>
              <ul className="text-gray-400 mb-8 space-y-2">
                {plan.features.map((f, i) => <li key={i}>✓ {f}</li>)}
              </ul>
              <button className={`w-full py-3 font-bold ${plan.popular ? 'bg-red-600 text-white' : 'bg-transparent border border-white text-white'}`}>Choose Plan</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
