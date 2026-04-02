import { CheckCircle } from 'lucide-react';

export default function WhyChoose() {
  const points = [
    "Certified expert trainers",
    "Premium imported equipment",
    "Personalized training plans",
    "Flexible training schedule",
    "Luxury, clean environment",
    "Real results backed by strategy"
  ];

  return (
    <section className="py-20 bg-black">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-4xl font-display font-bold text-white text-center mb-16">WHY CHOOSE US</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {points.map((point, index) => (
            <div key={index} className="flex items-center gap-4 p-6 bg-gray-900 border border-gray-800">
              <CheckCircle className="text-red-600 w-8 h-8" />
              <span className="text-xl font-medium text-white">{point}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
